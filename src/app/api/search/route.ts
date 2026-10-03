import { guard, json } from "@/lib/api";
import { LIMITS } from "@/lib/security/rate-limit";
import { getSearchIndex } from "@/lib/search";
import type { SearchDocType } from "@/lib/search/engine";

export async function GET(request: Request) {
  const g = await guard(request, { limit: { key: "search", ...LIMITS.search } });
  if ("error" in g) return g.error;
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").slice(0, 100);
  const limit = Math.min(30, Math.max(1, Number(url.searchParams.get("limit") ?? 20)));
  const types = url.searchParams.get("type")?.split(",").filter((t): t is SearchDocType => ["post", "project", "research", "page"].includes(t));
  const index = await getSearchIndex();
  const results = index.search(q, { limit, types: types?.length ? types : undefined });
  return json({ query: q, results }, { headers: { "Cache-Control": "private, max-age=30" } });
}
