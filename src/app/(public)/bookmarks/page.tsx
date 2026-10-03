import type { Metadata } from "next";
import { SavedArticles } from "@/components/blog/saved-articles";

export const metadata: Metadata = { title: "Saved articles", robots: { index: false } };

export default function BookmarksPage() {
  return (
    <div className="container-prose min-h-[70vh] pt-32 md:pt-44">
      <p className="eyebrow">Reading list</p>
      <h1 className="mt-4 text-4xl font-medium tracking-[-0.035em] text-fg">Saved Articles</h1>
      <p className="mt-3 text-sm text-muted">Saved in this browser only — no account needed. Clearing your browser data removes them.</p>
      <SavedArticles />
    </div>
  );
}
