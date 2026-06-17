import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

export async function GET() {
  try {
    const setting = await prisma.setting.findFirst();
    if (!setting) {
      return NextResponse.json(
        {
          siteName: process.env.SITE_NAME || "我的博客",
          siteDescription: "",
          requireApproval: true,
          commentEnabled: true,
        }
      );
    }
    return NextResponse.json({
      siteName: setting.siteName,
      siteDescription: setting.siteDescription,
      requireApproval: setting.requireApproval,
      commentEnabled: setting.commentEnabled,
    });
  } catch (e) {
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const schema = z.object({
      siteName: z.string().min(1).max(100),
      siteDescription: z.string().max(500).optional(),
      requireApproval: z.boolean(),
      commentEnabled: z.boolean(),
    });

    const body = await req.json();
    const data = schema.parse(body);

    let setting = await prisma.setting.findFirst({
      where: { userId: user.id },
    });

    if (setting) {
      setting = await prisma.setting.update({
        where: { id: setting.id },
        data,
      });
    } else {
      setting = await prisma.setting.create({
        data: {
          userId: user.id,
          ...data,
        },
      });
    }

    return NextResponse.json({ success: true, setting });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: "输入无效", issues: e.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
