import Link from "next/link";
import { cn } from "@/lib/utils";

interface TagBadgeProps {
  tag: {
    id: string;
    name: string;
    slug: string;
    color?: string | null;
  };
  selected?: boolean;
  showCount?: boolean;
  count?: number;
}

const DEFAULT_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-purple-100 text-purple-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
  "bg-cyan-100 text-cyan-700",
  "bg-yellow-100 text-yellow-700",
  "bg-indigo-100 text-indigo-700",
];

function getColorForTag(tagName: string, color?: string | null): string {
  if (color) return color;
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % DEFAULT_COLORS.length;
  return DEFAULT_COLORS[index];
}

export default function TagBadge({
  tag,
  selected = false,
  showCount = false,
  count = 0,
}: TagBadgeProps) {
  const colorClass = getColorForTag(tag.name, tag.color);

  return (
    <Link
      href={`/tags/${tag.slug}`}
      className={cn(
        "badge transition-all",
        selected
          ? "bg-primary-600 text-white hover:bg-primary-700"
          : `${colorClass} hover:opacity-80`
      )}
    >
      #{tag.name}
      {showCount && (
        <span className={cn("ml-1", selected ? "text-primary-100" : "opacity-70")}>
          {count}
        </span>
      )}
    </Link>
  );
}
