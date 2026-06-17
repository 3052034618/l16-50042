"use client";

import { useState, useEffect } from "react";
import MarkdownRenderer from "./MarkdownRenderer";

interface SplitEditorProps {
  content: string;
  onChange: (content: string) => void;
  autoSaveStatus?: "idle" | "saving" | "saved" | "error";
  lastSaved?: Date | null;
}

export default function SplitEditor({
  content,
  onChange,
  autoSaveStatus = "idle",
  lastSaved,
}: SplitEditorProps) {
  const [showPreview, setShowPreview] = useState(true);

  return (
    <div className="h-full flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-white">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              showPreview
                ? "bg-primary-100 text-primary-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {showPreview ? "✓ 预览模式" : "仅编辑器"}
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {autoSaveStatus !== "idle" && (
            <span className="flex items-center gap-1 text-gray-500">
              {autoSaveStatus === "saving" && (
                <>
                  <svg
                    className="w-3 h-3 animate-spin"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  正在保存...
                </>
              )}
              {autoSaveStatus === "saved" && (
                <>
                  <svg
                    className="w-3 h-3 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-green-600">
                    {lastSaved
                      ? `已保存 ${lastSaved.toLocaleTimeString("zh-CN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}`
                      : "已保存到本地"}
                  </span>
                </>
              )}
              {autoSaveStatus === "error" && (
                <span className="text-red-500">保存失败</span>
              )}
            </span>
          )}
          <span className="text-gray-400">
            {content.length} 字
          </span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden" style={{ minHeight: "500px" }}>
        <div className={`${showPreview ? "w-1/2" : "w-full"} border-r border-gray-200 flex flex-col`}>
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-600">
            Markdown 编辑器
          </div>
          <textarea
            value={content}
            onChange={(e) => onChange(e.target.value)}
            className="editor-textarea flex-1"
            placeholder={`# 开始写作...\n\n这里支持标准 Markdown 语法，包括标题、列表、代码块、表格等。\n\n\`\`\`javascript\nconst hello = "world";\nconsole.log(hello);\n\`\`\`\n\n> 引用文本示例`}
            spellCheck={false}
          />
        </div>

        {showPreview && (
          <div className="w-1/2 flex flex-col">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-600">
              实时预览
            </div>
            <div className="flex-1 overflow-auto p-6 bg-white">
              {content ? (
                <MarkdownRenderer content={content} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  在左侧输入 Markdown，这里将实时显示预览效果
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
