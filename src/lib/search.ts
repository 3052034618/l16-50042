import { prisma } from "./prisma";

type FlexSearchDocument = any;

let searchIndex: FlexSearchDocument | null = null;

function createIndex(): FlexSearchDocument {
  const FlexSearch = require("flexsearch");
  const FlexDoc = FlexSearch.Document || FlexSearch;
  
  const options = {
    document: {
      id: "id",
      index: [
        {
          field: "title",
          tokenize: "forward",
          optimize: true,
          resolution: 9,
        },
        {
          field: "content",
          tokenize: "strict",
          optimize: true,
          resolution: 5,
        },
      ],
      store: ["title", "summary", "slug"],
    },
    charset: {
      split: /[\s\-.,;:!?()[\]{}"'`~@#$%^&*_+=|\\/<>\n\r\t]+/,
      rtl: false,
    },
  };

  if (FlexSearch.Document) {
    return new FlexSearch.Document(options as any);
  }
  return new FlexDoc(options as any);
}

export async function getSearchIndex(): Promise<FlexSearchDocument> {
  if (searchIndex) return searchIndex;

  searchIndex = createIndex();

  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      title: true,
      summary: true,
      content: true,
      slug: true,
    },
  });

  for (const post of posts) {
    searchIndex.add(post.id, {
      title: post.title,
      content: post.content,
      summary: post.summary || "",
      slug: post.slug,
    });
  }

  return searchIndex;
}

export async function rebuildSearchIndex(): Promise<void> {
  searchIndex = null;
  await getSearchIndex();
}

export async function indexPost(post: {
  id: string;
  title: string;
  content: string;
  summary?: string;
  slug: string;
}): Promise<void> {
  const index = await getSearchIndex();
  index.add(post.id, {
    title: post.title,
    content: post.content,
    summary: post.summary || "",
    slug: post.slug,
  });
}

export async function removePostFromIndex(id: string): Promise<void> {
  const index = await getSearchIndex();
  try {
    index.remove(id);
  } catch (e) {
    // ignore
  }
}

export async function searchPosts(
  query: string,
  limit: number = 20
): Promise<
  {
    id: string;
    title: string;
    summary: string;
    slug: string;
    score: number;
  }[]
> {
  if (!query.trim()) return [];

  const index = await getSearchIndex();
  const results = index.search(query, {
    limit,
    enrich: true,
    suggest: true,
  });

  const postMap = new Map<string, { title: string; summary: string; slug: string; score: number }>();

  for (const result of results || []) {
    for (const item of result.result || []) {
      const itemAny = item as any;
      const itemId = String(itemAny?.id || item);
      const existing = postMap.get(itemId);
      const score = itemAny?.score || 0;
      const doc = itemAny?.doc || {};
      if (!existing || score > existing.score) {
        postMap.set(itemId, {
          title: doc?.title || "",
          summary: doc?.summary || "",
          slug: doc?.slug || "",
          score,
        });
      }
    }
  }

  if (postMap.size === 0) {
    const allPosts = await prisma.post.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { title: { contains: query } },
          { content: { contains: query } },
        ],
      },
      select: {
        id: true,
        title: true,
        summary: true,
        slug: true,
      },
      take: limit,
    });

    for (const post of allPosts) {
      postMap.set(post.id, {
        title: post.title,
        summary: post.summary || "",
        slug: post.slug,
        score: 1,
      });
    }
  }

  return Array.from(postMap.entries())
    .map(([id, data]) => ({
      id,
      ...data,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
