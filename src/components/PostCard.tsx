import Link from "next/link";
import { Calendar, Eye, Clock, Tag as TagIcon } from "lucide-react";
import { formatDate, getReadingTime, truncate, stripMarkdown } from "@/lib/utils";
import TagBadge from "./TagBadge";

interface PostCardProps {
  post: {
    id: string;
    title: string;
    slug: string;
    summary: string | null;
    content: string;
    publishedAt: Date | null;
    createdAt: Date;
    _count?: {
      views?: number;
      comments?: number;
    };
    views?: Array<{ id: string }>;
    comments?: Array<{ id: string }>;
    tags?: Array<{
      tag: {
        id: string;
        name: string;
        slug: string;
        color: string | null;
      };
    }>;
  };
}

export default function PostCard({ post }: PostCardProps) {
  const date = post.publishedAt || post.createdAt;
  const summary =
    post.summary || truncate(stripMarkdown(post.content), 150);
  const readingTime = getReadingTime(post.content);
  const viewCount = post.views?.length || post._count?.views || 0;
  const commentCount = post.comments?.length || post._count?.comments || 0;

  return (
    <article className="card p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-wrap gap-2 mb-3">
        {post.tags?.slice(0, 4).map(({ tag }) => (
          <TagBadge key={tag.id} tag={tag} />
        ))}
      </div>

      <Link href={`/post/${post.slug}`}>
        <h2 className="text-xl font-bold text-gray-900 mb-2 hover:text-primary-600 transition-colors line-clamp-2">
          {post.title}
        </h2>
      </Link>

      <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
        {summary}
      </p>

      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          {formatDate(date)}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {readingTime} 分钟阅读
        </span>
        <span className="flex items-center gap-1">
          <Eye className="w-3.5 h-3.5" />
          {viewCount} 阅读
        </span>
        {commentCount > 0 && (
          <span className="flex items-center gap-1">
            <TagIcon className="w-3.5 h-3.5" />
            {commentCount} 评论
          </span>
        )}
      </div>
    </article>
  );
}
