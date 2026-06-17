"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  MessageSquare,
  Search,
  Filter,
  Check,
  X,
  Trash2,
  Eye,
  Loader2,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { formatDateTime, gravatarUrl } from "@/lib/utils";

interface Comment {
  id: string;
  nickname: string;
  email: string;
  website: string | null;
  content: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  ip: string;
  userAgent: string;
  createdAt: string;
  post: { id: string; title: string; slug: string } | null;
  parent: { id: string; nickname: string } | null;
}

const PAGE_SIZE = 15;

type StatusFilter = "" | "PENDING" | "APPROVED" | "REJECTED";

export default function CommentsPage() {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StatusFilter>("PENDING");
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [actionId, setActionId] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (status) params.set("status", status);

      const res = await fetch(`/api/comments?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
        setTotal(data.total || 0);
        if (data.stats) setStats(data.stats);
      }
    } catch (e) {
      toast.error("加载失败");
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  async function handleAction(
    id: string,
    action: "APPROVE" | "REJECT" | "DELETE"
  ) {
    if (action === "DELETE" && !confirm("确定要删除这条评论吗？")) return;
    setActionId(id);
    try {
      const res = await fetch(`/api/comments?id=${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        toast.success(
          action === "APPROVE"
            ? "已通过审核"
            : action === "REJECT"
            ? "已拒绝"
            : "已删除"
        );
        loadComments();
        router.refresh();
      } else {
        toast.error("操作失败");
      }
    } catch (e) {
      toast.error("网络错误");
    } finally {
      setActionId(null);
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const statusTabs: { key: StatusFilter; label: string; count: number; icon: any }[] = [
    { key: "", label: "全部", count: stats.total, icon: MessageSquare },
    { key: "PENDING", label: "待审核", count: stats.pending, icon: AlertCircle },
    { key: "APPROVED", label: "已通过", count: stats.approved, icon: CheckCircle },
    { key: "REJECTED", label: "已拒绝", count: stats.rejected, icon: XCircle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">评论管理</h1>
        <p className="text-sm text-gray-500 mt-1">
          管理访客评论，审核和处理不当内容
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statusTabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.key === status;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setStatus(tab.key);
                setPage(1);
              }}
              className={`card p-4 text-left transition-all ${
                active
                  ? "ring-2 ring-primary-500 border-primary-300"
                  : "hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon
                  className={`w-4 h-4 ${
                    tab.key === "PENDING"
                      ? "text-amber-600"
                      : tab.key === "APPROVED"
                      ? "text-green-600"
                      : tab.key === "REJECTED"
                      ? "text-red-600"
                      : "text-primary-600"
                  }`}
                />
                <span className="text-sm text-gray-600">{tab.label}</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {tab.count.toLocaleString()}
              </div>
            </button>
          );
        })}
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg">
            <Filter className="w-4 h-4 text-gray-400 ml-2" />
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as StatusFilter);
                setPage(1);
              }}
              className="bg-transparent border-0 outline-none text-sm py-1.5 pr-2 focus:ring-0"
            >
              {statusTabs.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label} ({t.count})
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索评论..."
                className="input pl-10 !py-2 text-sm"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-6 h-6 mx-auto animate-spin text-primary-600" />
          </div>
        ) : comments.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">
              {status ? "该状态下暂无评论" : "暂无评论"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="p-4 sm:p-5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex gap-4">
                  <img
                    src={gravatarUrl(comment.email, 40)}
                    alt={comment.nickname}
                    className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900 text-sm">
                        {comment.nickname}
                      </span>
                      <a
                        href={`mailto:${comment.email}`}
                        className="text-xs text-gray-400 hover:text-gray-600 truncate max-w-[150px]"
                      >
                        {comment.email}
                      </a>
                      {comment.website && (
                        <a
                          href={comment.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary-600 hover:underline truncate max-w-[150px]"
                        >
                          {comment.website}
                        </a>
                      )}
                      <span
                        className={`badge text-[10px] ml-auto ${
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

                    <p className="text-sm text-gray-700 whitespace-pre-wrap break-words mb-3">
                      {comment.content}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDateTime(comment.createdAt)}
                      </span>
                      {comment.post && (
                        <a
                          href={`/post/${comment.post.slug}#comments`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-primary-600 truncate max-w-[200px]"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {comment.post.title}
                        </a>
                      )}
                      {comment.parent && (
                        <span className="flex items-center gap-1 text-purple-600">
                          回复 @{comment.parent.nickname}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-1">
                      {comment.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleAction(comment.id, "APPROVE")}
                            disabled={actionId === comment.id}
                            className="btn-primary !py-1 !px-3 text-xs !h-auto"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            通过
                          </button>
                          <button
                            onClick={() => handleAction(comment.id, "REJECT")}
                            disabled={actionId === comment.id}
                            className="btn-secondary !py-1 !px-3 text-xs !h-auto text-red-600"
                          >
                            <X className="w-3 h-3 mr-1" />
                            拒绝
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleAction(comment.id, "DELETE")}
                        disabled={actionId === comment.id}
                        className="btn-ghost !py-1 !px-3 text-xs !h-auto text-red-500 hover:!bg-red-50 hover:!text-red-600"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              第 {page} / {totalPages} 页
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-ghost !p-1.5 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 text-sm text-gray-600">{page}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-ghost !p-1.5 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
