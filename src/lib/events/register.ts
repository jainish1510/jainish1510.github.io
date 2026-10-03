import "server-only";
import { revalidatePath } from "next/cache";
import { bus } from "./bus";

/**
 * Framework-side listeners: keep cached public pages fresh when content
 * changes. Imported once by the admin server actions.
 */
const g = globalThis as unknown as { __studioRevalidationHooked?: boolean };

function safeRevalidate(path: string, type?: "layout" | "page") {
  try {
    revalidatePath(path, type);
  } catch {
    /* outside a request scope (scripts/tests) — nothing to revalidate */
  }
}

if (!g.__studioRevalidationHooked) {
  g.__studioRevalidationHooked = true;
  bus.on("post.saved", ({ slug, previousSlug }) => {
    safeRevalidate("/");
    safeRevalidate("/blog");
    safeRevalidate(`/blog/${slug}`);
    if (previousSlug && previousSlug !== slug) safeRevalidate(`/blog/${previousSlug}`);
    safeRevalidate("/sitemap.xml");
    safeRevalidate("/rss.xml");
  });
  bus.on("post.deleted", ({ slug }) => {
    safeRevalidate("/blog");
    safeRevalidate(`/blog/${slug}`);
    safeRevalidate("/");
  });
  bus.on("content.changed", () => safeRevalidate("/", "layout"));
  bus.on("media.changed", () => safeRevalidate("/", "layout"));
  bus.on("comment.moderated", () => safeRevalidate("/blog", "layout"));
}

export {};
