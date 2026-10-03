import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchExperience } from "@/components/blog/search-experience";

export const metadata: Metadata = { title: "Search", description: "Search articles, projects and research.", alternates: { canonical: "/search/" }, robots: { index: false } };

export default function SearchPage() {
  return (
    <div className="container-prose min-h-[70vh] pt-32 md:pt-44">
      <p className="eyebrow">Search</p>
      <h1 className="mt-4 text-4xl font-medium tracking-[-0.035em] text-fg">Find anything.</h1>
      <p className="mt-3 text-sm text-muted">
        Articles, projects, research and pages — searched by title, subtitle, content, tags and category. Tip: press ⌘K / Ctrl K anywhere.
      </p>
      <Suspense fallback={<div className="skeleton mt-10 h-14 w-full" />}>
        <SearchExperience />
      </Suspense>
    </div>
  );
}
