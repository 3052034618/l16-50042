import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { commentSchema } from "@/lib/validations";
import { getClientIp } from "@/lib/utils";
import { generateFingerprint } from "@/lib/auth";
import { z } from "zod";

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const post = await prisma.post.findUnique({
      where: { slug: params.slug, status: "PUBLISHED" },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    const setting = await prisma.setting.findFirst({
      select: { requireApproval: true, commentEnabled: true },
    });

    if (!setting?.commentEnabled) {
      return NextResponse.json(
        { error: "评论功能已关闭" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validated = commentSchema.parse(body);

    if (validated.parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: validated.parentId },
        select: { id: true, postId: true },
      });
      if (!parent || parent.postId !== post.id) {
        return NextResponse.json(
          { error: "回复的评论不存在" },
          { status: 404 }
        );
      }
    }

    const ip = getClientIp(req.headers);
    const userAgent = req.headers.get("user-agent") || "";

    const comment = await prisma.comment.create({
      data: {
        postId: post.id,
        parentId: validated.parentId || null,
        nickname: validated.nickname,
        email: validated.email,
        website: validated.website || null,
        content: validated.content,
        status: setting.requireApproval ? "PENDING" : "APPROVED",
        ip,
        userAgent,
      },
      include: {
        replies: {
          where: { status: "APPROVED" },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json({
      success: true,
      comment,
      message: setting.requireApproval
        ? "评论已提交，等待审核"
        : "评论发表成功",
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: "输入无效", issues: e.errors },
        { status: 400 }
      );
    }
    console.error(e);
    return NextResponse.json({ error: "评论失败" }, { status: 500 });
  }
}
