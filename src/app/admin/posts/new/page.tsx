import PostEditor from "@/components/PostEditor";

export default function NewPostPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">撰写新文章</h1>
        <p className="text-sm text-gray-500 mt-1">
          内容将每隔 60 秒自动保存到本地
        </p>
      </div>
      <PostEditor />
    </div>
  );
}
