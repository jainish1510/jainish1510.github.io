import type { MetadataRoute } from "next";
import { db } from "@/lib/db/client";
import { env } from "@/lib/env";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.siteUrl;
  const [posts, projects, research] = await Promise.all([
    db.post.findMany({ where: { status: "PUBLISHED", publishedAt: { lte: new Date() } }, select: { slug: true, updatedAt: true } }),
    db.project.findMany({ select: { slug: true, updatedAt: true } }),
    db.researchProject.findMany({ select: { slug: true, updatedAt: true } }),
  ]);
  const pages = ["", "/about", "/projects", "/research", "/blog", "/experience", "/contact"].map((p) => ({
    url: `${base}${p}`,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.8,
  }));
  return [
    ...pages,
    ...posts.map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...projects.map((p) => ({ url: `${base}/projects/${p.slug}`, lastModified: p.updatedAt, priority: 0.6 })),
    ...research.map((r) => ({ url: `${base}/research/${r.slug}`, lastModified: r.updatedAt, priority: 0.6 })),
  ];
}
