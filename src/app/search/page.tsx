"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PostCard from "@/components/PostCard";
import Pagination from "@/components/Pagination";
import TagBadge from "@/components/TagBadge";
import { Search as SearchIcon, X, Loader2 } from "lucide-react";
import { highlightText } from "@/lib/utils";

const PAGE_SIZE = 10;

interface SearchResult {
  id: string;
  title: string;
  summary: string;
  slug: string;
  score: number;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQ);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQ);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    let cancelled = false;
    async function doSearch() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=${PAGE_SIZE}`
        );
        if (res.ok && !cancelled) {
          const data = await res.json();
          setResults(data.results || []);
          setSearched(true);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    doSearch();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  return (
    <div className="container-page py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">全文搜索</h1>

        <div className="card p-4 mb-8">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="输入关键词搜索文章标题和内容..."
              className="input pl-12 pr-12 py-6 text-base"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {loading && (
          <div className="text-center py-12 text-gray-500">
            <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-primary-600" />
            <p>正在搜索中...</p>
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="card p-12 text-center">
            <SearchIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              未找到相关结果
            </h3>
            <p className="text-gray-500 text-sm">
              未找到与 &ldquo;<span className="font-medium">{debouncedQuery}</span>&rdquo; 相关的文章
            </p>
            <p className="text-gray-400 text-xs mt-2">
              尝试换其他关键词，或
              <Link href="/" className="text-primary-600 hover:underline ml-1">
                返回首页
              </Link>
            </p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            <p className="text-sm text-gray-500 mb-4">
              找到 <span className="font-medium text-gray-900">{results.length}</span> 篇相关文章
            </p>
            <div className="space-y-4">
              {results.map((result) => (
                <article key={result.id} className="card p-5 hover:shadow-md transition-shadow">
                  <Link
                    href={`/post/${result.slug}`}
                    className="block"
                  >
                    <h2
                      className="text-lg font-semibold text-gray-900 mb-2 hover:text-primary-600 transition-colors"
                      dangerouslySetInnerHTML={{
                        __html: highlightText(result.title, debouncedQuery),
                      }}
                    />
                  </Link>
                  {result.summary && (
                    <p
                      className="text-sm text-gray-600 leading-relaxed line-clamp-3"
                      dangerouslySetInnerHTML={{
                        __html: highlightText(result.summary, debouncedQuery),
                      }}
                    />
                  )}
                  <div className="mt-3">
                    <Link
                      href={`/post/${result.slug}`}
                      className="text-xs text-primary-600 hover:underline"
                    >
                      查看全文 →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {!searched && !loading && (
          <div className="card p-12 text-center text-gray-500">
            <SearchIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              开始搜索
            </h3>
            <p className="text-sm">
              在上方输入框输入关键词，即可搜索文章标题和内容
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
