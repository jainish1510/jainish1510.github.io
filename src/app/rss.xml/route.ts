import { getContent } from "@/lib/store/load";

export const dynamic = "force-static";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function GET() {
  const { site, posts, builtAt } = getContent();
  const base = site.url.replace(/\/$/, "");
  const items = posts
    .filter((p) => p.status === "PUBLISHED" && p.publishedAt && p.publishedAt <= builtAt)
    .sort((a, b) => b.publishedAt!.getTime() - a.publishedAt!.getTime())
    .slice(0, 30)
    .map(
      (p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${base}/blog/${p.slug}/</link>
      <guid isPermaLink="true">${base}/blog/${p.slug}/</guid>
      <pubDate>${p.publishedAt!.toUTCString()}</pubDate>
      <description>${esc(p.excerpt ?? p.subtitle ?? "")}</description>
${[p.category?.name, ...p.tags.map((t) => t.name)].filter(Boolean).map((c) => `      <category>${esc(c!)}</category>`).join("\n")}
    </item>`,
    )
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(site.name)} — Writing</title>
    <link>${base}/blog/</link>
    <description>${esc(site.blogHeroLine)}</description>
    <language>en-us</language>
    <atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
