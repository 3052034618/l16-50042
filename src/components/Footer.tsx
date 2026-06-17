export default function Footer() {
  const year = new Date().getFullYear();
  const siteName = process.env.SITE_NAME || "我的博客";

  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="container-page py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500">
            © {year} {siteName}. 保留所有权利。
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>由 Next.js 构建</span>
            <span>•</span>
            <span>Prisma + SQLite</span>
            <span>•</span>
            <span>TailwindCSS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
