import type { Metadata } from "next";
import { Suspense } from "react";
import { BlogBrowser } from "@/components/blog/blog-browser";
import { getFeaturedPost, getStartHerePosts, listCategoriesWithCounts, listPublishedPosts, listTagsWithCounts } from "@/lib/repositories/posts";
import { getSite } from "@/lib/site";

export function generateMetadata(): Metadata {
  return { title: "Writing", description: getSite().blogHeroLine, alternates: { canonical: "/blog/" } };
}

export default function BlogPage() {
  const site = getSite();
  const props = {
    eyebrow: site.blogHeroEyebrow,
    headline: site.blogHeroLine,
    posts: listPublishedPosts().posts,
    featured: getFeaturedPost(),
    startHere: getStartHerePosts(4),
    categories: listCategoriesWithCounts().map((c) => ({ slug: c.slug, name: c.name, count: c._count.posts })),
    tags: listTagsWithCounts().map((t) => ({ slug: t.slug, name: t.name, count: t._count.posts })),
  };
  return (
    <Suspense fallback={<div className="container-page pt-44">{/* filters load on the client */}</div>}>
      <BlogBrowser {...props} />
    </Suspense>
  );
}
