import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  slug: string;
}

function buildCommentTree(comments: any[]): any[] {
  const map = new Map<string, any>();
  const roots: any[] = [];

  for (const c of comments) {
    map.set(c.id, { ...c, replies: [] });
  }

  for (const c of map.values()) {
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId).replies.push(c);
    } else {
      roots.push(c);
    }
  }

  const sortReplies = (items: any[]) => {
    items.sort(
      (a: any, b: any) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    for (const item of items) {
      if (item.replies?.length) sortReplies(item.replies);
    }
  };

  sortReplies(roots);
  return roots;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Params }
) {
  try {
    const post = await prisma.post.findUnique({
      where: { slug: params.slug, status: "PUBLISHED" },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    const searchParams = req.nextUrl.searchParams;
    const approvedOnly = searchParams.get("approved") !== "0";

    const where: any = {
      postId: post.id,
    };
    if (approvedOnly) {
      where.status = "APPROVED";
    }

    const comments = await prisma.comment.findMany({
      where,
      select: {
        id: true,
        parentId: true,
        nickname: true,
        email: true,
        website: true,
        content: true,
        status: true,
        isAdmin: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const tree = buildCommentTree(comments);

    return NextResponse.json({
      comments: tree,
      total: comments.length,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ comments: [], total: 0 });
  }
}
