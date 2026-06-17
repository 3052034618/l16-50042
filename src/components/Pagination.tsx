"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string>;
}

export default function Pagination({
  currentPage,
  totalPages,
  basePath,
  searchParams = {},
}: PaginationProps) {
  if (totalPages <= 1) return null;

  function buildUrl(page: number) {
    const params = new URLSearchParams(searchParams as any);
    params.set("page", String(page));
    return `${basePath}?${params.toString()}`;
  }

  const pages: (number | "...")[] = [];
  const maxVisible = 5;

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <nav className="flex items-center justify-center gap-1 mt-8">
      <Link
        href={buildUrl(Math.max(1, currentPage - 1))}
        className={cn(
          "btn-ghost !p-2",
          currentPage === 1 && "pointer-events-none opacity-50"
        )}
        aria-disabled={currentPage === 1}
      >
        <ChevronLeft className="w-4 h-4" />
      </Link>

      {pages.map((page, idx) =>
        page === "..." ? (
          <span key={`dots-${idx}`} className="px-2 text-gray-500">
            ...
          </span>
        ) : (
          <Link
            key={page}
            href={buildUrl(page)}
            className={cn(
              "btn-ghost w-9 !px-2 !py-2",
              currentPage === page &&
                "!bg-primary-600 !text-white hover:!bg-primary-700"
            )}
          >
            {page}
          </Link>
        )
      )}

      <Link
        href={buildUrl(Math.min(totalPages, currentPage + 1))}
        className={cn(
          "btn-ghost !p-2",
          currentPage === totalPages && "pointer-events-none opacity-50"
        )}
        aria-disabled={currentPage === totalPages}
      >
        <ChevronRight className="w-4 h-4" />
      </Link>
    </nav>
  );
}
