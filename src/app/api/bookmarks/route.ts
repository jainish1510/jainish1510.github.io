import { guard, json } from "@/lib/api";
import { listBookmarkedPosts } from "@/lib/repositories/engagement";
import { LIMITS } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

/** Server bookmarks for this browser, merged with ids the client kept locally. */
export async function GET(request: Request) {
  const g = await guard(request, { limit: { key: "bookmarks", ...LIMITS.search } });
  if ("error" in g) return g.error;
  const ids = (new URL(request.url).searchParams.get("ids") ?? "").split(",").filter((s) => /^[a-z0-9]{10,40}$/i.test(s)).slice(0, 100);
  const posts = g.visitorId ? await listBookmarkedPosts(g.visitorId, ids) : [];
  return json({ posts }, { headers: { "Cache-Control": "no-store" } });
}
