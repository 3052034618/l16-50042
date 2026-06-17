import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/utils";
import { generateFingerprint } from "@/lib/auth";

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

    const ip = getClientIp(req.headers);
    const userAgent = req.headers.get("user-agent") || "";
    const fingerprint = generateFingerprint(ip, userAgent);

    const ONE_DAY = 24 * 60 * 60 * 1000;
    const cutoff = new Date(Date.now() - ONE_DAY);

    const existingView = await prisma.view.findFirst({
      where: {
        postId: post.id,
        fingerprint,
        createdAt: { gte: cutoff },
      },
    });

    if (existingView) {
      const totalViews = await prisma.view.count({
        where: { postId: post.id },
      });
      return NextResponse.json({ counted: false, total: totalViews });
    }

    await prisma.view.create({
      data: {
        postId: post.id,
        fingerprint,
        ip,
        userAgent,
      },
    });

    const totalViews = await prisma.view.count({
      where: { postId: post.id },
    });

    return NextResponse.json({ counted: true, total: totalViews });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "统计失败" }, { status: 500 });
  }
}
