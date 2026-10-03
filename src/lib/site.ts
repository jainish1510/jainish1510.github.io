import "server-only";
import { getContent } from "@/lib/store/load";

export const getSite = () => getContent().site;

/** The public origin, without a trailing slash. Used for canonical links, the sitemap and feeds. */
export const siteUrl = () => getContent().site.url.replace(/\/$/, "");
export const absolute = (p: string) => `${siteUrl()}${p.startsWith("/") ? p : `/${p}`}`;
