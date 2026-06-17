import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ensureAdminUser } from "@/lib/seed";

export const metadata: Metadata = {
  title: {
    default: process.env.SITE_NAME || "我的博客",
    template: `%s | ${process.env.SITE_NAME || "我的博客"}`,
  },
  description: "一个基于Next.js构建的个人Markdown博客系统",
  keywords: ["博客", "Markdown", "Next.js", "技术文章"],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    title: process.env.SITE_NAME || "我的博客",
    description: "一个基于Next.js构建的个人Markdown博客系统",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await ensureAdminUser();
  } catch (e) {
    console.error("初始化管理员失败:", e);
  }

  return (
    <html lang="zh-CN">
      <body className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            },
          }}
        />
      </body>
    </html>
  );
}
