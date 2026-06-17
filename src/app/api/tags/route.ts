import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const tags = await prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        color: true,
        _count: {
          select: { posts: true },
        },
      },
      orderBy: { posts: { _count: "desc" } },
    });

    return NextResponse.json({ tags });
  } catch (e) {
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const schema = z.object({
      name: z.string().min(1).max(50),
      color: z.string().optional(),
    });

    const body = await req.json();
    const { name, color } = schema.parse(body);

    const existing = await prisma.tag.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json({ tag: existing });
    }

    const { slugify } = await import("@/lib/utils");
    const tag = await prisma.tag.create({
      data: { name, slug: slugify(name), color: color || null },
    });

    return NextResponse.json({ tag });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: "输入无效", issues: e.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
