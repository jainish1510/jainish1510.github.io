import { guard, json } from "@/lib/api";
import { getNowPlaying } from "@/lib/integrations/spotify";
import { LIMITS } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const g = await guard(request, { limit: { key: "spotify", ...LIMITS.search } });
  if ("error" in g) return g.error;
  try {
    return json({ track: await getNowPlaying() }, { headers: { "Cache-Control": "private, max-age=20" } });
  } catch {
    return json({ track: null, unavailable: true });
  }
}
