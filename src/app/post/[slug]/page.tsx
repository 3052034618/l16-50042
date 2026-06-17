import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import TagBadge from "@/components/TagBadge";
import CommentSection from "@/components/CommentSection";
import ViewCounter from "@/components/ViewCounter";
import {
  Calendar,
  Clock,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatDate, getReadingTime, stripMarkdown } from "@/lib/utils";

interface PostPageProps {
  params: { slug: string };
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const post = await prisma.post.findUnique({
    where: { slug: params.slug, status: "PUBLISHED" },
    select: {
      title: true,
      summary: true,
      content: true,
      tags: {
        select: { tag: { select: { name: true } } },
      },
      publishedAt: true,
    },
  });

  if (!post) {
    return { title: "文章未找到" };
  }

  const description = post.summary || stripMarkdown(post.content).slice(0, 160);
  const keywords = post.tags.map((t) => t.tag.name);

  return {
    title: post.title,
    description,
    keywords,
    openGraph: {
      title: post.title,
      description,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      tags: keywords,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const post = await prisma.post.findUnique({
    where: { slug: params.slug, status: "PUBLISHED" },
    include: {
      tags: {
        include: {
          tag: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true,
            },
          },
        },
      },
      author: {
        select: {
          nickname: true,
        },
      },
    },
  });

  if (!post) {
    notFound();
  }

  const [prevPost, nextPost, viewCount] = await Promise.all([
    prisma.post
      .findFirst({
        where: {
          status: "PUBLISHED",
          publishedAt: { lt: post.publishedAt || post.createdAt },
        },
        orderBy: { publishedAt: "desc" },
        select: { title: true, slug: true },
      })
      .catch(() => null),
    prisma.post
      .findFirst({
        where: {
          status: "PUBLISHED",
          publishedAt: { gt: post.publishedAt || post.createdAt },
        },
        orderBy: { publishedAt: "asc" },
        select: { title: true, slug: true },
      })
      .catch(() => null),
    prisma.view.count({ where: { postId: post.id } }),
  ]);

  const date = post.publishedAt || post.createdAt;
  const readingTime = getReadingTime(post.content);

  return (
    <article className="container-page py-8">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>
      </div>

      <div className="card overflow-hidden">
        <div className="p-8 sm:p-12 border-b border-gray-100">
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map(({ tag }) => (
              <TagBadge key={tag.id} tag={tag} />
            ))}
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            {post.title}
          </h1>

          {post.summary && (
            <p className="text-lg text-gray-600 mb-6 leading-relaxed border-l-4 border-primary-200 pl-4">
              {post.summary}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              发表于 {formatDate(date)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {readingTime} 分钟阅读
            </span>
            <ViewCounter slug={post.slug} initialCount={viewCount} />
            <span>作者：{post.author?.nickname || "博主"}</span>
          </div>
        </div>

        <div className="p-8 sm:p-12">
          <MarkdownRenderer content={post.content} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mt-8">
        {prevPost ? (
          <Link
            href={`/post/${prevPost.slug}`}
            className="card p-5 hover:border-primary-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <ChevronLeft className="w-4 h-4" />
              上一篇
            </div>
            <div className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1">
              {prevPost.title}
            </div>
          </Link>
        ) : (
          <div />
        )}
        {nextPost ? (
          <Link
            href={`/post/${nextPost.slug}`}
            className="card p-5 hover:border-primary-300 hover:shadow-md transition-all group text-right"
          >
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2 justify-end">
              下一篇
              <ChevronRight className="w-4 h-4" />
            </div>
            <div className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1">
              {nextPost.title}
            </div>
          </Link>
        ) : (
          <div />
        )}
      </div>

      <div className="mt-12">
        <CommentSection postSlug={post.slug} />
      </div>
    </article>
  );
}
