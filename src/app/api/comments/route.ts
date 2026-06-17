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

const STATUS_MAP: Record<string, string> = {
  APPROVE: "APPROVED",
  REJECT: "REJECTED",
};

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "缺少评论ID" }, { status: 400 });
    }

    const body = await req.json();
    const { action } = updateSchema.parse(body);

    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      return NextResponse.json({ error: "评论不存在" }, { status: 404 });
    }

    if (action === "DELETE") {
      await prisma.comment.deleteMany({
        where: { OR: [{ id }, { parentId: id }] },
      });
      return NextResponse.json({ success: true });
    }

    const targetStatus = STATUS_MAP[action];
    if (!targetStatus) {
      return NextResponse.json({ error: "无效操作" }, { status: 400 });
    }

    const updated = await prisma.comment.update({
      where: { id },
      data: {
        status: targetStatus,
        adminId: user.id,
      },
    });

    const [total, pending, approved, rejected] = await Promise.all([
      prisma.comment.count(),
      prisma.comment.count({ where: { status: "PENDING" } }),
      prisma.comment.count({ where: { status: "APPROVED" } }),
      prisma.comment.count({ where: { status: "REJECTED" } }),
    ]);

    return NextResponse.json({
      success: true,
      comment: updated,
      stats: { total, pending, approved, rejected },
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: "输入无效", issues: e.errors },
        { status: 400 }
      );
    }
    console.error(e);
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}
