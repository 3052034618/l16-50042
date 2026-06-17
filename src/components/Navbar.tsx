import Link from "next/link";
import { PenSquare, Search, Home, Tag, Settings, LogIn } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function Navbar() {
  const user = await getCurrentUser();
  const setting = await prisma.setting.findFirst({
    select: { siteName: true },
  });
  const siteName = setting?.siteName || process.env.SITE_NAME || "我的博客";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container-page h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-xl text-gray-900 hover:text-primary-600 transition-colors"
          >
            <PenSquare className="w-6 h-6 text-primary-600" />
            <span>{siteName}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
            >
              <Home className="w-4 h-4" />
              首页
            </Link>
            <Link
              href="/tags"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
            >
              <Tag className="w-4 h-4" />
              标签
            </Link>
            <Link
              href="/search"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
            >
              <Search className="w-4 h-4" />
              搜索
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <form action="/search" className="hidden sm:flex items-center mr-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                name="q"
                placeholder="搜索文章..."
                className="pl-9 pr-4 py-1.5 w-56 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </form>

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
              >
                <Settings className="w-4 h-4" />
                后台
              </Link>
              <Link
                href="/admin/posts/new"
                className="btn-primary !py-1.5"
              >
                <PenSquare className="w-4 h-4 mr-1" />
                写文章
              </Link>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
            >
              <LogIn className="w-4 h-4" />
              登录
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
