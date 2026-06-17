import { NextRequest, NextResponse } from "next/server";
import { searchPosts, rebuildSearchIndex } from "@/lib/search";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q") || "";
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20");

    if (!q.trim()) {
      return NextResponse.json({ results: [] });
    }

    const results = await searchPosts(q, limit);
    return NextResponse.json({ results, query: q });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ results: [], error: "搜索失败" }, { status: 500 });
  }
}

export async function POST() {
  try {
    await rebuildSearchIndex();
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "重建失败" }, { status: 500 });
  }
}
