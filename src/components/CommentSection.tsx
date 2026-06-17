"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  MessageSquare,
  Send,
  Reply,
  ChevronDown,
  ChevronUp,
  User,
  Globe,
  Mail,
  MessageCircle,
  Clock,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { formatDateTime, gravatarUrl } from "@/lib/utils";

interface Comment {
  id: string;
  nickname: string;
  email: string;
  website?: string | null;
  content: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  parentId: string | null;
  isAdmin: boolean;
  replies?: Comment[];
}

interface CommentSectionProps {
  postSlug: string;
}

type CommentFormData = {
  nickname: string;
  email: string;
  website: string;
  content: string;
};

const COMMENT_STORAGE_KEY = "blog_comment_info";

export default function CommentSection({ postSlug }: CommentSectionProps) {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentEnabled, setCommentEnabled] = useState(true);
  const [requireApproval, setRequireApproval] = useState(true);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CommentFormData>({
    nickname: "",
    email: "",
    website: "",
    content: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const saved = localStorage.getItem(COMMENT_STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setForm((prev) => ({
          ...prev,
          nickname: data.nickname || "",
          email: data.email || "",
          website: data.website || "",
        }));
      } catch (e) {
        // ignore
      }
    }

    Promise.all([
      fetch(`/api/settings`).then((r) => r.json().catch(() => ({}))),
    ]).then(([settings]) => {
      setCommentEnabled(settings.commentEnabled !== false);
      setRequireApproval(settings.requireApproval !== false);
    });

    loadComments();
  }, [postSlug]);

  async function loadComments() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/posts/slug/${postSlug}/comments/list?approved=1`
      );
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function toggleCollapsed(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    if (!commentEnabled) return;

    if (!form.nickname.trim()) {
      setErrors((prev) => ({ ...prev, nickname: "请输入昵称" }));
      return;
    }
    if (!form.email.trim()) {
      setErrors((prev) => ({ ...prev, email: "请输入邮箱" }));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setErrors((prev) => ({ ...prev, email: "请输入有效邮箱" }));
      return;
    }
    if (!form.content.trim()) {
      setErrors((prev) => ({ ...prev, content: "请输入评论内容" }));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/slug/${postSlug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          website: form.website || undefined,
          parentId: replyTo || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem(
          COMMENT_STORAGE_KEY,
          JSON.stringify({
            nickname: form.nickname,
            email: form.email,
            website: form.website,
          })
        );

        setForm((prev) => ({ ...prev, content: "" }));
        setReplyTo(null);

        if (requireApproval) {
          toast.success("评论已提交", {
            description: "您的评论正在等待审核通过后显示",
          });
        } else {
          toast.success("评论发表成功");
          loadComments();
        }
        router.refresh();
      } else {
        if (data.issues) {
          const errs: Record<string, string> = {};
          for (const issue of data.issues) {
            const key = issue.path?.[0] || "general";
            errs[key] = issue.message;
          }
          setErrors(errs);
        }
        toast.error(data.error || "发表评论失败");
      }
    } catch (e) {
      toast.error("网络错误，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  }

  const approvedCount = comments.length + comments.reduce((acc, c) => acc + (c.replies?.length || 0), 0);

  if (!commentEnabled) {
    return (
      <div className="card p-8 text-center text-gray-500">
        <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <p>评论功能已关闭</p>
      </div>
    );
  }

  return (
    <section className="card overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <MessageSquare className="w-5 h-5 text-primary-600" />
          评论区
          {approvedCount > 0 && (
            <span className="badge bg-primary-100 text-primary-700">
              {approvedCount}
            </span>
          )}
        </h2>
        {requireApproval && (
          <span className="flex items-center gap-1 text-xs text-gray-500 bg-amber-50 px-2 py-1 rounded-md">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            新评论需审核
          </span>
        )}
      </div>

      <div className="p-6 border-b border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-4">
          {replyTo && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-md">
              <Reply className="w-4 h-4 text-blue-600" />
              正在回复某条评论
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="ml-auto text-xs text-blue-600 hover:underline"
              >
                取消回复
              </button>
            </div>
          )}

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                <User className="w-3 h-3 inline mr-1" />
                昵称 *
              </label>
              <input
                type="text"
                value={form.nickname}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, nickname: e.target.value }))
                }
                placeholder="您的昵称"
                className={`input !py-2 text-sm ${
                  errors.nickname ? "border-red-300" : ""
                }`}
              />
              {errors.nickname && (
                <p className="text-xs text-red-500 mt-0.5">{errors.nickname}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                <Mail className="w-3 h-3 inline mr-1" />
                邮箱 *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="your@email.com"
                className={`input !py-2 text-sm ${
                  errors.email ? "border-red-300" : ""
                }`}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-0.5">{errors.email}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                <Globe className="w-3 h-3 inline mr-1" />
                网站（可选）
              </label>
              <input
                type="url"
                value={form.website}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, website: e.target.value }))
                }
                placeholder="https://..."
                className="input !py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <textarea
              value={form.content}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, content: e.target.value }))
              }
              rows={4}
              placeholder="写下您的评论..."
              className={`textarea text-sm ${
                errors.content ? "border-red-300" : ""
              }`}
            />
            {errors.content && (
              <p className="text-xs text-red-500 mt-0.5">{errors.content}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              支持基础 Markdown：**加粗**、*斜体*、`代码`、[链接](url)
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-1" />
              )}
              {replyTo ? "回复评论" : "发表评论"}
            </button>
          </div>
        </form>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            加载评论中...
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">暂无评论，来发表第一条吧！</p>
          </div>
        ) : (
          <ul className="space-y-6">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                collapsed={collapsed}
                toggleCollapsed={toggleCollapsed}
                onReply={() => setReplyTo(comment.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function CommentItem({
  comment,
  collapsed,
  toggleCollapsed,
  onReply,
  depth = 0,
}: {
  comment: Comment;
  collapsed: Set<string>;
  toggleCollapsed: (id: string) => void;
  onReply: () => void;
  depth?: number;
}) {
  const isCollapsed = collapsed.has(comment.id);
  const hasReplies = comment.replies && comment.replies.length > 0;

  return (
    <li className={depth > 0 ? "ml-8 sm:ml-12 mt-4" : ""}>
      <div className="flex gap-3">
        <img
          src={gravatarUrl(comment.email, 40)}
          alt={comment.nickname}
          className="w-10 h-10 rounded-full flex-shrink-0 bg-gray-100"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {comment.website ? (
              <a
                href={comment.website}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-gray-900 hover:text-primary-600 text-sm"
              >
                {comment.nickname}
              </a>
            ) : (
              <span className="font-medium text-gray-900 text-sm">
                {comment.nickname}
              </span>
            )}
            {comment.isAdmin && (
              <span className="badge bg-primary-600 text-white text-[10px]">
                <Check className="w-2.5 h-2.5 mr-0.5" />
                博主
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              {formatDateTime(comment.createdAt)}
            </span>
          </div>

          {!isCollapsed && (
            <>
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                {comment.content}
              </div>
              <div className="mt-2 flex items-center gap-3">
                <button
                  onClick={onReply}
                  className="text-xs text-gray-500 hover:text-primary-600 flex items-center gap-1"
                >
                  <Reply className="w-3 h-3" />
                  回复
                </button>
                {hasReplies && (
                  <button
                    onClick={() => toggleCollapsed(comment.id)}
                    className="text-xs text-gray-500 hover:text-primary-600 flex items-center gap-1"
                  >
                    <ChevronUp className="w-3 h-3" />
                    收起回复 ({comment.replies!.length})
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {hasReplies && isCollapsed && (
        <button
          onClick={() => toggleCollapsed(comment.id)}
          className="ml-12 mt-2 text-xs text-primary-600 hover:underline flex items-center gap-1"
        >
          <ChevronDown className="w-3 h-3" />
          展开 {comment.replies!.length} 条回复
        </button>
      )}

      {hasReplies && !isCollapsed && (
        <ul className="mt-2 space-y-4 border-l-2 border-gray-100">
          {comment.replies!.map((reply) => (
            <div key={reply.id} className="pl-4">
              <CommentItem
                comment={reply}
                collapsed={collapsed}
                toggleCollapsed={toggleCollapsed}
                onReply={onReply}
                depth={depth + 1}
              />
            </div>
          ))}
        </ul>
      )}
    </li>
  );
}
