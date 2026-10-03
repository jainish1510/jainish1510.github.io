import type { MetadataRoute } from "next";
import { getContent } from "@/lib/store/load";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const base = getContent().site.url.replace(/\/$/, "");
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/bookmarks/", "/search/"] }], sitemap: `${base}/sitemap.xml`, host: base };
}
