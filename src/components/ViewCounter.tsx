"use client";

import { useState, useEffect } from "react";
import { Eye } from "lucide-react";

interface ViewCounterProps {
  slug: string;
  initialCount: number;
}

export default function ViewCounter({ slug, initialCount }: ViewCounterProps) {
  const [count, setCount] = useState(initialCount);
  const [hasCounted, setHasCounted] = useState(false);

  useEffect(() => {
    if (hasCounted) return;

    let cancelled = false;
    async function countView() {
      try {
        const res = await fetch(`/api/posts/slug/${slug}/view`, {
          method: "POST",
        });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setCount(data.total || initialCount);
          setHasCounted(true);
        }
      } catch (e) {
        // silent
      }
    }

    const timer = setTimeout(countView, 2000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [slug, initialCount, hasCounted]);

  return (
    <span className="flex items-center gap-1">
      <Eye className="w-4 h-4" />
      {count.toLocaleString()} 阅读
    </span>
  );
}
