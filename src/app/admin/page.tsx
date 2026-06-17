import { prisma } from "@/lib/prisma";
import {
  FileText,
  Eye,
  MessageSquare,
  Tags,
  TrendingUp,
  Clock,
  Calendar,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function AdminDashboard() {
  const [stats, recentPosts, recentComments] = await Promise.all([
    Promise.all([
      prisma.post.count(),
      prisma.post.count({ where: { status: "PUBLISHED" } }),
      prisma.post.count({ where: { status: "DRAFT" } }),
      prisma.comment.count(),
      prisma.comment.count({ where: { status: "PENDING" } }),
      prisma.view.count(),
      prisma.tag.count(),
    ]),
    prisma.post.findMany({
      take: 5,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        updatedAt: true,
        _count: { select: { views: true, comments: true } },
      },
    }),
    prisma.comment.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        post: { select: { id: true, title: true, slug: true } },
      },
    }),
  ]);

  const [
    totalPosts,
    publishedPosts,
    draftPosts,
    totalComments,
    pendingComments,
    totalViews,
    totalTags,
  ] = stats;

  const statCards = [
    {
      label: "文章总数",
      value: totalPosts,
      icon: FileText,
      color: "bg-blue-50 text-blue-600",
      sub: `已发布 ${publishedPosts}`,
    },
    {
      label: "草稿箱",
      value: draftPosts,
      icon: Clock,
      color: "bg-amber-50 text-amber-600",
      sub: "待发布",
    },
    {
      label: "总评论",
      value: totalComments,
      icon: MessageSquare,
      color: "bg-purple-50 text-purple-600",
      sub: pendingComments > 0 ? `${pendingComments} 条待审核` : "全部已审核",
    },
    {
      label: "总阅读量",
      value: totalViews,
      icon: Eye,
      color: "bg-green-50 text-green-600",
      sub: `共 ${totalTags} 个标签`,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
        <p className="text-sm text-gray-500 mt-1">博客数据概览与快捷操作</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {stat.value.toLocaleString()}
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm text-gray-500">{stat.label}</span>
                <span className="text-xs text-gray-400">{stat.sub}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary-600" />
              最近文章
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {recentPosts.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                暂无文章
              </div>
            ) : (
              recentPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {post.title}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(post.updatedAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {post._count.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {post._count.comments}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`badge text-xs ${
                      post.status === "PUBLISHED"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {post.status === "PUBLISHED" ? "已发布" : "草稿"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary-600" />
              最近评论
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {recentComments.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                暂无评论
              </div>
            ) : (
              recentComments.map((comment) => (
                <div
                  key={comment.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm text-gray-900">
                      {comment.nickname}
                    </span>
                    <span
                      className={`badge text-[10px] ${
                        comment.status === "APPROVED"
                          ? "bg-green-100 text-green-700"
                          : comment.status === "REJECTED"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {comment.status === "APPROVED"
                        ? "已通过"
                        : comment.status === "REJECTED"
                        ? "已拒绝"
                        : "待审核"}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {comment.content}
                  </div>
                  <div className="text-xs text-gray-400 flex items-center justify-between">
                    <span className="truncate">评论于：{comment.post?.title}</span>
                    <span>{formatDate(comment.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
