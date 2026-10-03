import { z } from "zod";
import { guard, json, readJson } from "@/lib/api";
import { recordEvent } from "@/lib/repositories/engagement";
import { LIMITS } from "@/lib/security/rate-limit";

const schema = z.object({ type: z.enum(["project_click", "outbound_click"]), entityType: z.string().max(20).optional(), entityId: z.string().max(40).optional() });

export async function POST(request: Request) {
  const g = await guard(request, { mutation: true, limit: { key: "event", ...LIMITS.event } });
  if ("error" in g) return g.error;
  const body = await readJson(request, schema, 2000);
  if ("error" in body) return body.error;
  await recordEvent(body.data.type, { ...body.data, visitorId: g.visitorId });
  return json({ ok: true });
}
