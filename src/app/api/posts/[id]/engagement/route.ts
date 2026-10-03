import { guard, json } from "@/lib/api";
import { getEngagementState } from "@/lib/repositories/engagement";
import { LIMITS } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard(request, { limit: { key: "engagement", ...LIMITS.search } });
  if ("error" in g) return g.error;
  const { id } = await params;
  return json(await getEngagementState(id, g.visitorId), { headers: { "Cache-Control": "no-store" } });
}
