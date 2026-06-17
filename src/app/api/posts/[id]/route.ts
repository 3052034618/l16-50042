import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { postSchema } from "@/lib/validations";
import { indexPost, removePostFromIndex } from "@/lib/search";
import { z } from "zod";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const post = await prisma.post.findUnique({
      where: { id: params.id, authorId: user.id },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (e) {
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const existing = await prisma.post.findUnique({
      where: { id: params.id, authorId: user.id },
      include: { tags: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    const body = await req.json();
    const validated = postSchema.parse(body);

    let slug = validated.slug || slugify(validated.title);
    let slugSuffix = 0;
    while (true) {
      const found = await prisma.post.findFirst({
        where: {
          slug: slugSuffix ? `${slug}-${slugSuffix}` : slug,
          NOT: { id: params.id },
        },
      });
      if (!found) {
        if (slugSuffix) slug = `${slug}-${slugSuffix}`;
        break;
      }
      slugSuffix++;
    }

    const tagIds: string[] = [...validated.tagIds];

    for (const newTagName of validated.newTags) {
      const tagSlug = slugify(newTagName);
      let tag = await prisma.tag.findUnique({ where: { name: newTagName } });
      if (!tag) {
        tag = await prisma.tag.create({
          data: { name: newTagName, slug: tagSlug },
        });
      }
      tagIds.push(tag.id);
    }

    const uniqueTagIds = Array.from(new Set(tagIds));

    const previousStatus = existing.status;
    const newStatus = validated.status;
    const wasPublished = previousStatus === "PUBLISHED";
    const willBePublished = newStatus === "PUBLISHED";

    await prisma.$transaction(async (tx) => {
      await tx.tagOnPost.deleteMany({ where: { postId: params.id } });

      await tx.post.update({
        where: { id: params.id },
        data: {
          title: validated.title,
          slug,
          summary: validated.summary || null,
          content: validated.content,
          status: newStatus,
          publishedAt:
            willBePublished && !wasPublished
              ? new Date()
              : existing.publishedAt,
          tags: {
            create: uniqueTagIds.map((tagId) => ({
              tag: { connect: { id: tagId } },
            })),
          },
        },
      });
    });

    if (willBePublished) {
      await indexPost({
        id: params.id,
        title: validated.title,
        content: validated.content,
        summary: validated.summary || undefined,
        slug,
      });
    } else if (wasPublished) {
      await removePostFromIndex(params.id);
    }

    const updatedPost = await prisma.post.findUnique({
      where: { id: params.id },
      include: { tags: { include: { tag: true } } },
    });

    return NextResponse.json({ success: true, post: updatedPost });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: "输入无效", issues: e.errors },
        { status: 400 }
      );
    }
    console.error(e);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const existing = await prisma.post.findUnique({
      where: { id: params.id, authorId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    await prisma.post.delete({ where: { id: params.id } });

    if (existing.status === "PUBLISHED") {
      await removePostFromIndex(params.id);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
