"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Settings,
  Save,
  Globe,
  MessageSquare,
  Loader2,
  Shield,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Search,
} from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [data, setData] = useState({
    siteName: "",
    siteDescription: "",
    requireApproval: true,
    commentEnabled: true,
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        setData({
          siteName: d.siteName || "",
          siteDescription: d.siteDescription || "",
          requireApproval: d.requireApproval !== false,
          commentEnabled: d.commentEnabled !== false,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast.success("设置已保存");
        setTimeout(() => location.reload(), 500);
      } else {
        toast.error("保存失败");
      }
    } catch (e) {
      toast.error("网络错误");
    } finally {
      setSaving(false);
    }
  }

  async function handleRebuildIndex() {
    if (!confirm("确定要重建全文搜索索引吗？可能需要一点时间。")) return;
    setRebuilding(true);
    try {
      const res = await fetch("/api/search", { method: "POST" });
      if (res.ok) {
        toast.success("搜索索引已重建");
      } else {
        toast.error("重建失败");
      }
    } catch (e) {
      toast.error("网络错误");
    } finally {
      setRebuilding(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">系统设置</h1>
        <p className="text-sm text-gray-500 mt-1">配置博客的基础信息和功能开关</p>
      </div>

      {loading ? (
        <div className="card p-12 text-center">
          <Loader2 className="w-6 h-6 mx-auto animate-spin text-primary-600" />
        </div>
      ) : (
        <>
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
                <Globe className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">站点信息</h3>
                <p className="text-xs text-gray-500">基础站点配置</p>
              </div>
            </div>

            <div className="space-y-5 max-w-xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  站点名称
                </label>
                <input
                  type="text"
                  value={data.siteName}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, siteName: e.target.value }))
                  }
                  placeholder="我的博客"
                  className="input"
                  maxLength={100}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  站点描述
                </label>
                <textarea
                  value={data.siteDescription}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      siteDescription: e.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="简短描述你的博客..."
                  className="textarea"
                  maxLength={500}
                />
                <p className="text-xs text-gray-400 mt-1">
                  用于 SEO 和社交媒体分享，最多 500 字
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">评论设置</h3>
                <p className="text-xs text-gray-500">管理评论功能和审核策略</p>
              </div>
            </div>

            <div className="space-y-4 max-w-xl">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-sm text-gray-900 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    启用评论功能
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    关闭后访客将无法发表新评论
                  </div>
                </div>
                <button
                  onClick={() =>
                    setData((prev) => ({
                      ...prev,
                      commentEnabled: !prev.commentEnabled,
                    }))
                  }
                  className="text-primary-600 hover:text-primary-700"
                >
                  {data.commentEnabled ? (
                    <ToggleRight className="w-10 h-10" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-gray-400" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-sm text-gray-900 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    评论审核
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    开启后所有新评论需要审核通过后才会显示
                  </div>
                </div>
                <button
                  onClick={() =>
                    setData((prev) => ({
                      ...prev,
                      requireApproval: !prev.requireApproval,
                    }))
                  }
                  className="text-primary-600 hover:text-primary-700"
                  disabled={!data.commentEnabled}
                >
                  {data.requireApproval ? (
                    <ToggleRight className={`w-10 h-10 ${!data.commentEnabled ? "opacity-50" : ""}`} />
                  ) : (
                    <ToggleLeft className={`w-10 h-10 ${!data.commentEnabled ? "text-gray-300" : "text-gray-400"}`} />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
                <Search className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">搜索维护</h3>
                <p className="text-xs text-gray-500">全文搜索引擎管理</p>
              </div>
            </div>

            <div className="max-w-xl">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-sm text-gray-900">
                    重建搜索索引
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    如果搜索结果异常，可以重建索引
                  </div>
                </div>
                <button
                  onClick={handleRebuildIndex}
                  disabled={rebuilding}
                  className="btn-secondary !py-1.5 text-xs"
                >
                  {rebuilding ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  )}
                  重建索引
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => location.reload()}
              className="btn-secondary"
            >
              重置
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              保存设置
            </button>
          </div>
        </>
      )}
    </div>
  );
}
