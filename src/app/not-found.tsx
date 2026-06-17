import Link from "next/link";
import { Home, Search, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-page py-24">
      <div className="text-center max-w-lg mx-auto">
        <div className="text-8xl font-black text-primary-100 mb-4 select-none">
          404
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">页面未找到</h1>
        <p className="text-gray-500 mb-8">
          您访问的页面不存在或已被删除，请检查URL是否正确，或返回首页继续浏览。
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href="/" className="btn-primary">
            <Home className="w-4 h-4 mr-1" />
            返回首页
          </Link>
          <Link href="/search" className="btn-secondary">
            <Search className="w-4 h-4 mr-1" />
            搜索文章
          </Link>
        </div>
      </div>
    </div>
  );
}
