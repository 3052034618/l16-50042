"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  PenSquare,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  user: {
    id: string;
    email: string;
    nickname: string;
  };
}

const navItems = [
  {
    label: "仪表盘",
    href: "/admin",
    icon: LayoutDashboard,
    match: (path: string) => path === "/admin",
  },
  {
    label: "文章管理",
    href: "/admin/posts",
    icon: FileText,
    match: (path: string) => path.startsWith("/admin/posts"),
  },
  {
    label: "评论管理",
    href: "/admin/comments",
    icon: MessageSquare,
    match: (path: string) => path.startsWith("/admin/comments"),
  },
  {
    label: "系统设置",
    href: "/admin/settings",
    icon: Settings,
    match: (path: string) => path.startsWith("/admin/settings"),
  },
];

export default function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("已退出登录");
      router.push("/");
      router.refresh();
    } catch (e) {
      toast.error("退出失败");
    }
  }

  return (
    <div className="space-y-4 sticky top-20">
      <div className="card p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
            <User className="w-6 h-6 text-primary-600" />
          </div>
          <div className="min-w-0">
            <div className="font-medium text-gray-900 truncate">
              {user.nickname}
            </div>
            <div className="text-xs text-gray-500 truncate">{user.email}</div>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <Link
        href="/admin/posts/new"
        className="btn-primary w-full justify-center"
      >
        <PenSquare className="w-4 h-4 mr-1" />
        写新文章
      </Link>

      <button
        onClick={handleLogout}
        className="btn-secondary w-full justify-center text-gray-600"
      >
        <LogOut className="w-4 h-4 mr-1" />
        退出登录
      </button>
    </div>
  );
}
