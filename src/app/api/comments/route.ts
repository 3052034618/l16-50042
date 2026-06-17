import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const updateSchema = z.object({
  action: z.enum(["APPROVE", "REJECT", "DELETE"]),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status") as
      | "PENDING"
      | "APPROVED"
      | "REJECTED"
      | null;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const where: any = {};
    if (status) where.status = status;

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        include: {
          post: { select: { id: true, title: true, slug: true } },
          parent: { select: { id: true, nickname: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.comment.count({ where }),
    ]);

    const stats = {
      total: await prisma.comment.count(),
      pending: await prisma.comment.count({ where: { status: "PENDING" } }),
      approved: await prisma.comment.count({ where: { status: "APPROVED" } }),
      rejected: await prisma.comment.count({ where: { status: "REJECTED" } }),
    };

    return NextResponse.json({
      comments,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      stats,
    });
  } catch (e) {
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = updateSchema.parse(body);

    const comment = await prisma.comment.findUnique({
      where: { id: params.id },
    });

    if (!comment) {
      return NextResponse.json({ error: "评论不存在" }, { status: 404 });
    }

    if (action === "DELETE") {
      await prisma.comment.delete({ where: { id: params.id } });
      return NextResponse.json({ success: true });
    }

    const updated = await prisma.comment.update({
      where: { id: params.id },
      data: {
        status: action,
        isAdmin: true,
        adminId: user.id,
      },
    });

    return NextResponse.json({ success: true, comment: updated });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: "输入无效", issues: e.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}
