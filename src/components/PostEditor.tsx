"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import SplitEditor from "@/components/SplitEditor";
import { X, Plus, Save, Eye, Loader2, FilePen, Trash2, CheckCircle2, Pencil } from "lucide-react";
import { slugify } from "@/lib/utils";

export interface PostEditorData {
  id?: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  status: "DRAFT" | "PUBLISHED";
  tagIds: string[];
  newTags: string[];
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  color?: string | null;
}

interface PostEditorProps {
  initialData?: Partial<PostEditorData>;
  postId?: string;
}

const AUTOSAVE_INTERVAL = 60_000; // 60秒
const STORAGE_KEY = "blog_editor_draft";

export default function PostEditor({ initialData, postId }: PostEditorProps) {
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>([]);
  const [data, setData] = useState<PostEditorData>({
    title: "",
    slug: "",
    summary: "",
    content: "",
    status: "DRAFT",
    tagIds: [],
    newTags: [],
    ...initialData,
  });
  const [newTagInput, setNewTagInput] = useState("");
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const slugEditedRef = useRef(!!initialData?.slug);

  useEffect(() => {
    fetch("/api/tags")
      .then((r) => r.json())
      .then((d) => setTags(d.tags || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (slugEditedRef.current) return;
    if (data.title) {
      setData((prev) => ({ ...prev, slug: slugify(prev.title) }));
    }
  }, [data.title]);

  const saveToLocal = useCallback(() => {
    try {
      const draft = {
        ...data,
        savedAt: new Date().toISOString(),
        postId,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      setLastSaved(new Date());
      setAutoSaveStatus("saved");
      setTimeout(() => setAutoSaveStatus("idle"), 2000);
    } catch (e) {
      setAutoSaveStatus("error");
      setTimeout(() => setAutoSaveStatus("idle"), 2000);
    }
  }, [data, postId]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && !initialData?.content && !postId) {
      try {
        const draft = JSON.parse(saved);
        if (confirm("检测到未发布的本地草稿，是否恢复？")) {
          setData({
            title: draft.title || "",
            slug: draft.slug || "",
            summary: draft.summary || "",
            content: draft.content || "",
            status: draft.status || "DRAFT",
            tagIds: draft.tagIds || [],
            newTags: draft.newTags || [],
          });
          if (draft.slug) slugEditedRef.current = true;
          toast.info("已恢复本地草稿");
        }
      } catch (e) {
        // ignore
      }
    }
  }, [initialData, postId]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (data.title || data.content) {
        setAutoSaveStatus("saving");
        setTimeout(saveToLocal, 500);
      }
    }, AUTOSAVE_INTERVAL);

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (data.title || data.content) {
        saveToLocal();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      clearInterval(timer);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [data, saveToLocal]);

  function handleFieldChange<K extends keyof PostEditorData>(
    key: K,
    value: PostEditorData[K]
  ) {
    setData((prev) => ({ ...prev, [key]: value }));
    if (key === "slug") slugEditedRef.current = true;
  }

  function toggleTag(tagId: string) {
    setData((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter((id) => id !== tagId)
        : [...prev.tagIds, tagId],
    }));
  }

  function addNewTag() {
    const name = newTagInput.trim();
    if (!name) return;
    if (data.newTags.includes(name)) {
      setNewTagInput("");
      return;
    }
    const existing = tags.find((t) => t.name === name);
    if (existing) {
      if (!data.tagIds.includes(existing.id)) {
        setData((prev) => ({ ...prev, tagIds: [...prev.tagIds, existing.id] }));
      }
    } else {
      setData((prev) => ({ ...prev, newTags: [...prev.newTags, name] }));
    }
    setNewTagInput("");
  }

  function removeNewTag(name: string) {
    setData((prev) => ({ ...prev, newTags: prev.newTags.filter((t) => t !== name) }));
  }

  async function handleSubmit(e: React.FormEvent, forceStatus?: "DRAFT" | "PUBLISHED") {
    e.preventDefault();
    setErrors({});

    const submitData = { ...data };
    if (forceStatus) submitData.status = forceStatus;

    if (!submitData.title.trim()) {
      setErrors((prev) => ({ ...prev, title: "请输入标题" }));
      return;
    }
    if (!submitData.slug.trim()) {
      setErrors((prev) => ({ ...prev, slug: "请输入路径" }));
      return;
    }
    if (!submitData.content.trim()) {
      setErrors((prev) => ({ ...prev, content: "请输入内容" }));
      return;
    }

    setSubmitting(true);

    try {
      const url = postId ? `/api/posts/${postId}` : "/api/posts";
      const method = postId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      const result = await res.json();

      if (res.ok) {
        localStorage.removeItem(STORAGE_KEY);
        toast.success(
          submitData.status === "PUBLISHED"
            ? postId
              ? "文章已更新并发布"
              : "文章已发布"
            : postId
            ? "草稿已保存"
            : "草稿已创建"
        );
        router.push("/admin/posts");
        router.refresh();
      } else {
        if (result.issues) {
          const errs: Record<string, string> = {};
          for (const issue of result.issues) {
            const key = issue.path?.[0] || "general";
            errs[key] = issue.message;
          }
          setErrors(errs);
        }
        toast.error(result.error || "提交失败");
      }
    } catch (e) {
      toast.error("网络错误，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  }

  function clearLocalDraft() {
    if (confirm("确定要删除本地保存的草稿吗？此操作不可撤销。")) {
      localStorage.removeItem(STORAGE_KEY);
      toast.success("本地草稿已清除");
    }
  }

  const allSelectedTagNames = [
    ...tags.filter((t) => data.tagIds.includes(t.id)).map((t) => t.name),
    ...data.newTags,
  ];

  return (
    <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
      <div className="card p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <FilePen className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {postId ? "编辑文章" : "撰写新文章"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearLocalDraft}
              className="btn-ghost !text-xs text-gray-500"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              清除本地草稿
            </button>
            <button
              type="button"
              onClick={saveToLocal}
              className="btn-secondary !text-xs"
            >
              <Save className="w-3.5 h-3.5 mr-1" />
              手动保存
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            文章标题 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.title}
            onChange={(e) => handleFieldChange("title", e.target.value)}
            placeholder="一个有吸引力的标题..."
            className={`input text-lg py-3 ${
              errors.title ? "border-red-300 focus:ring-red-500" : ""
            }`}
          />
          {errors.title && (
            <p className="mt-1 text-xs text-red-500">{errors.title}</p>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              URL 路径 (slug) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.slug}
              onChange={(e) => handleFieldChange("slug", e.target.value)}
              placeholder="my-first-article"
              className={`input ${errors.slug ? "border-red-300 focus:ring-red-500" : ""}`}
            />
            {errors.slug && (
              <p className="mt-1 text-xs text-red-500">{errors.slug}</p>
            )}
            <p className="mt-1 text-xs text-gray-400">
              生成的访问路径：/post/{data.slug || "<slug>"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              状态
            </label>
            <select
              value={data.status}
              onChange={(e) =>
                handleFieldChange(
                  "status",
                  e.target.value as "DRAFT" | "PUBLISHED"
                )
              }
              className="input"
            >
              <option value="DRAFT">草稿</option>
              <option value="PUBLISHED">已发布</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            文章摘要（可选）
          </label>
          <textarea
            value={data.summary}
            onChange={(e) => handleFieldChange("summary", e.target.value)}
            rows={2}
            placeholder="简短描述文章内容，用于列表展示和SEO..."
            className="textarea"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            标签
          </label>
          <div className="mb-2 space-y-1">
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const selected = data.tagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`badge cursor-pointer transition-all ${
                        selected
                          ? "bg-primary-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {selected && (
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                      )}
                      #{tag.name}
                    </button>
                  );
                })}
              </div>
            )}

            {data.newTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {data.newTags.map((name) => (
                  <span
                    key={name}
                    className="badge bg-green-100 text-green-700"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    #{name} (新)
                    <button
                      type="button"
                      onClick={() => removeNewTag(name)}
                      className="ml-1.5 opacity-60 hover:opacity-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addNewTag();
                }
              }}
              placeholder="输入新标签名称后回车添加..."
              className="input"
            />
            <button
              type="button"
              onClick={addNewTag}
              className="btn-secondary whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {allSelectedTagNames.length > 0 && (
            <p className="mt-1 text-xs text-gray-500">
              已选择 {allSelectedTagNames.length} 个标签：
              {allSelectedTagNames.join(", ")}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          文章内容 <span className="text-red-500">*</span>
        </label>
        {errors.content && (
          <p className="mb-1.5 text-xs text-red-500">{errors.content}</p>
        )}
        <SplitEditor
          content={data.content}
          onChange={(v) => handleFieldChange("content", v)}
          autoSaveStatus={autoSaveStatus}
          lastSaved={lastSaved}
        />
      </div>

      <div className="flex items-center justify-end gap-3 sticky bottom-0 p-4 bg-gray-50 border-t border-gray-200 rounded-lg">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary"
        >
          取消
        </button>
        <button
          type="button"
          onClick={(e) => handleSubmit(e, "DRAFT")}
          disabled={submitting}
          className="btn-secondary"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Pencil className="w-4 h-4 mr-1" />
          )}
          保存草稿
        </button>
        <button
          type="submit"
          onClick={(e) => handleSubmit(e, "PUBLISHED")}
          disabled={submitting}
          className="btn-primary"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Eye className="w-4 h-4 mr-1" />
          )}
          {postId ? "更新并发布" : "发布文章"}
        </button>
      </div>
    </form>
  );
}
