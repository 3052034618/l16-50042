import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PostEditor from "@/components/PostEditor";

interface EditPostPageProps {
  params: { id: string };
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const post = await prisma.post.findUnique({
    where: { id: params.id, authorId: user.id },
    include: {
      tags: {
        include: { tag: true },
      },
    },
  });

  if (!post) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">编辑文章</h1>
        <p className="text-sm text-gray-500 mt-1">
          正在编辑：{post.title}
        </p>
      </div>
      <PostEditor
        postId={post.id}
        initialData={{
          title: post.title,
          slug: post.slug,
          summary: post.summary || "",
          content: post.content,
          status: post.status as "DRAFT" | "PUBLISHED",
          tagIds: post.tags.map((t) => t.tagId),
          newTags: [],
        }}
      />
    </div>
  );
}
