import { notFound } from "next/navigation";
import TagsPageWithSlug from "./[slug]/page";

export default function TagsIndexPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  return TagsPageWithSlug({
    params: { slug: undefined as any },
    searchParams,
  });
}
