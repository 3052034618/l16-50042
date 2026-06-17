import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PostCard from "@/components/PostCard";
import Pagination from "@/components/Pagination";
import TagBadge from "@/components/TagBadge";
import { FileText, Tags } from "lucide-react";

const PAGE_SIZE = 8;

interface HomePageProps {
  searchParams: {
    page?: string;
    tag?: string;
  };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const page = parseInt(searchParams.page || "1");
  const tagSlug = searchParams.tag;

  const where: any = { status: "PUBLISHED" };
  if (tagSlug) {
    where.tags = {
      some: {
        tag: { slug: tagSlug },
      },
    };
  }

  const [posts, totalPosts, allTags, currentTag] = await Promise.all([
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
      take: 15,
    }),
    tagSlug
      ? prisma.tag.findUnique({
          where: { slug: tagSlug },
          select: { id: true, name: true, slug: true, color: true },
        })
      : null,
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
          {currentTag && (
            <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-lg flex items-center gap-3">
              <Tags className="w-5 h-5 text-primary-600" />
              <span className="text-gray-700">当前标签筛选：</span>
              <TagBadge tag={currentTag} selected />
              <Link
                href="/"
                className="ml-auto text-sm text-primary-600 hover:text-primary-800"
              >
                清除筛选
              </Link>
            </div>
          )}

          {postsWithCount.length === 0 ? (
            <div className="card p-12 text-center">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {currentTag ? "该标签下暂无文章" : "暂无文章"}
              </h3>
              <p className="text-gray-500 text-sm">
                {currentTag
                  ? "尝试查看其他标签或返回首页"
                  : "请稍后再来查看"}
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
                basePath="/"
                searchParams={tagSlug ? { tag: tagSlug } : {}}
              />
            </>
          )}
        </div>

        <aside className="space-y-6">
          <div className="card p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-4">
              <Tags className="w-4 h-4 text-primary-600" />
              热门标签
            </h3>
            {allTags.length === 0 ? (
              <p className="text-sm text-gray-500">暂无标签</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <TagBadge
                    key={tag.id}
                    tag={tag}
                    selected={tag.slug === tagSlug}
                    showCount
                    count={tag._count.posts}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="card p-5 bg-gradient-to-br from-primary-50 to-white border-primary-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              博客统计
            </h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-primary-600">
                  {totalPosts}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">文章总数</div>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-primary-600">
                  {allTags.length}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">标签总数</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
