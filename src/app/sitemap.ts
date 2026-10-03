import type { MetadataRoute } from "next";
import { getContent } from "@/lib/store/load";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const c = getContent();
  const base = c.site.url.replace(/\/$/, "");
  const pages = ["", "/about", "/projects", "/research", "/blog", "/experience", "/contact"].map((p) => ({ url: `${base}${p}/`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.8 }));
  return [
    ...pages,
    ...c.posts.filter((p) => p.status === "PUBLISHED" && p.publishedAt && p.publishedAt <= c.builtAt).map((p) => ({ url: `${base}/blog/${p.slug}/`, lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...c.projects.map((p) => ({ url: `${base}/projects/${p.slug}/`, priority: 0.6 })),
    ...c.research.map((r) => ({ url: `${base}/research/${r.slug}/`, priority: 0.6 })),
  ];
}
