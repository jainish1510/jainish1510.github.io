import type { Metadata } from "next";
import { SearchExperience } from "@/components/blog/search-experience";

export const metadata: Metadata = { title: "Search", description: "Search articles, projects and research.", alternates: { canonical: "/search" } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return (
    <div className="container-prose min-h-[70vh] pt-32 md:pt-44">
      <p className="eyebrow">Search</p>
      <h1 className="mt-4 text-4xl font-medium tracking-[-0.035em] text-fg">Find anything.</h1>
      <p className="mt-3 text-sm text-muted">
        Articles, projects, research and pages — searched by title, subtitle, content, tags and category. Tip: press ⌘K / Ctrl K anywhere.
      </p>
      <SearchExperience initial={q ?? ""} />
    </div>
  );
}
