import { db } from "@/lib/db/client";
import { env } from "@/lib/env";
import { getSettings } from "@/lib/settings";

export const revalidate = 3600;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET() {
  const [settings, posts] = await Promise.all([
    getSettings(),
    db.post.findMany({
      where: { status: "PUBLISHED", publishedAt: { lte: new Date() } },
      orderBy: { publishedAt: "desc" },
      take: 30,
      select: { slug: true, title: true, excerpt: true, subtitle: true, publishedAt: true, category: { select: { name: true } }, tags: { select: { name: true } } },
    }),
  ]);
  const base = env.siteUrl;
  const items = posts
    .map(
      (p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${base}/blog/${p.slug}</link>
      <guid isPermaLink="true">${base}/blog/${p.slug}</guid>
      <pubDate>${p.publishedAt!.toUTCString()}</pubDate>
      <description>${esc(p.excerpt ?? p.subtitle ?? "")}</description>
${[p.category?.name, ...p.tags.map((t) => t.name)].filter(Boolean).map((c) => `      <category>${esc(c!)}</category>`).join("\n")}
    </item>`,
    )
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(settings["site.name"])} — Writing</title>
    <link>${base}/blog</link>
    <description>${esc(settings["blog.heroSubtitle"])}</description>
    <language>en-us</language>
    <atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, s-maxage=3600" } });
}
