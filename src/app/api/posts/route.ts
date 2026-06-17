import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { postSchema } from "@/lib/validations";
import { indexPost } from "@/lib/search";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status") as "DRAFT" | "PUBLISHED" | null;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const where: any = { authorId: user.id };
    if (status) where.status = status;

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          summary: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              views: true,
              comments: true,
            },
          },
          tags: {
            select: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.post.count({ where }),
    ]);

    return NextResponse.json({
      posts,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
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

    const body = await req.json();
    const validated = postSchema.parse(body);

    let slug = validated.slug || slugify(validated.title);
    let slugSuffix = 0;
    while (true) {
      const existing = await prisma.post.findUnique({
        where: { slug: slugSuffix ? `${slug}-${slugSuffix}` : slug },
      });
      if (!existing) {
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

    const post = await prisma.post.create({
      data: {
        title: validated.title,
        slug,
        summary: validated.summary || null,
        content: validated.content,
        status: validated.status,
        authorId: user.id,
        publishedAt: validated.status === "PUBLISHED" ? new Date() : null,
        tags: {
          create: uniqueTagIds.map((tagId) => ({
            tag: { connect: { id: tagId } },
          })),
        },
      },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    });

    if (validated.status === "PUBLISHED") {
      await indexPost({
        id: post.id,
        title: post.title,
        content: post.content,
        summary: post.summary || undefined,
        slug: post.slug,
      });
    }

    return NextResponse.json({ success: true, post });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: "输入无效", issues: e.errors },
        { status: 400 }
      );
    }
    console.error(e);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
