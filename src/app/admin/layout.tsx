import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminSidebar from "@/components/AdminSidebar";
import {
  FileText,
  Eye,
  MessageSquare,
  Tags,
  TrendingUp,
  PenSquare,
  Calendar,
  Clock,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="container-page py-6">
      <div className="grid lg:grid-cols-5 gap-6">
        <aside className="lg:col-span-1">
          <AdminSidebar user={user} />
        </aside>
        <div className="lg:col-span-4">{children}</div>
      </div>
    </div>
  );
}
