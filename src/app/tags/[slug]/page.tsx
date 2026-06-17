import { prisma } from "@/lib/prisma";
import TagBadge from "@/components/TagBadge";
import PostCard from "@/components/PostCard";
import Pagination from "@/components/Pagination";
import { Tags, FileText } from "lucide-react";
import { notFound } from "next/navigation";
import Link from "next/link";

const PAGE_SIZE = 8;

interface TagPageProps {
  params?: { slug?: string };
  searchParams: {
    page?: string;
  };
}

export default async function TagsPage({ params, searchParams }: TagPageProps) {
  const slug = params?.slug;
  const page = parseInt(searchParams.page || "1");

  if (!slug) {
    const tags = await prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        color: true,
        _count: {
          select: { posts: { where: { post: { status: "PUBLISHED" } } } },
        },
      },
      orderBy: { posts: { _count: "desc" } },
    });

    return (
      <div className="container-page py-8">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 mb-8">
          <Tags className="w-7 h-7 text-primary-600" />
          全部标签
        </h1>

        {tags.length === 0 ? (
          <div className="card p-12 text-center">
            <Tags className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              暂无标签
            </h3>
            <p className="text-gray-500 text-sm">
              发布文章时可以创建标签
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/tags/${tag.slug}`}
                className="card p-5 hover:border-primary-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <TagBadge tag={tag} showCount count={tag._count.posts} />
                </div>
                <div className="text-sm text-gray-500 mt-3">
                  {tag._count.posts} 篇文章
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  const tag = await prisma.tag.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      color: true,
    },
  });

  if (!tag) {
    notFound();
  }

  const where = {
    status: "PUBLISHED" as const,
    tags: { some: { tag: { slug } } },
  };

  const [posts, totalPosts, allTags] = await Promise.all([
    prisma.post.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        content: true,
        publishedAt: true,
        createdAt: true,
        views: { select: { id: true } },
        comments: {
          where: { status: "APPROVED" },
          select: { id: true },
        },
        tags: {
          select: {
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
      },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.post.count({ where }),
    prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        color: true,
        _count: {
          select: { posts: { where: { post: { status: "PUBLISHED" } } } },
        },
      },
      orderBy: { posts: { _count: "desc" } },
      take: 12,
    }),
  ]);

  const totalPages = Math.ceil(totalPosts / PAGE_SIZE);
  const postsWithCount = posts.map((p) => ({
    ...p,
    _count: {
      views: p.views.length,
      comments: p.comments.length,
    },
  }));

  return (
    <div className="container-page py-8">
      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <div className="mb-6 p-5 bg-gradient-to-r from-primary-50 to-white border border-primary-200 rounded-xl">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <Tags className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <TagBadge tag={tag} selected />
                    标签
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    共 <span className="font-medium">{totalPosts}</span> 篇文章
                  </p>
                </div>
              </div>
              <Link
                href="/tags"
                className="text-sm text-primary-600 hover:text-primary-800 hover:underline"
              >
                查看全部标签 →
              </Link>
            </div>
          </div>

          {postsWithCount.length === 0 ? (
            <div className="card p-12 text-center">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                该标签下暂无文章
              </h3>
              <p className="text-gray-500 text-sm">
                <Link href="/" className="text-primary-600 hover:underline">
                  返回首页
                </Link>
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {postsWithCount.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                basePath={`/tags/${slug}`}
              />
            </>
          )}
        </div>

        <aside>
          <div className="card p-5 sticky top-20">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-4">
              <Tags className="w-4 h-4 text-primary-600" />
              其他标签
            </h3>
            <div className="flex flex-wrap gap-2">
              {allTags
                .filter((t) => t.slug !== slug)
                .map((t) => (
                  <TagBadge
                    key={t.id}
                    tag={t}
                    showCount
                    count={t._count.posts}
                  />
                ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
