import { z } from "zod";
import { guard, json, readJson } from "@/lib/api";
import { db } from "@/lib/db/client";
import { recordView } from "@/lib/repositories/engagement";
import { LIMITS } from "@/lib/security/rate-limit";
import { deviceFromUserAgent } from "@/lib/security/request";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard(request, { mutation: true, requireVisitor: true, limit: { key: "view", ...LIMITS.view } });
  if ("error" in g) return g.error;
  const body = await readJson(request, z.object({ referrer: z.string().max(500).nullable().optional() }), 1000);
  if ("error" in body) return body.error;
  const { id } = await params;
  const post = await db.post.findFirst({ where: { id, status: "PUBLISHED" }, select: { id: true } });
  if (!post) return json({ counted: false });
  // Internal navigation isn't a referrer worth recording.
  const ref = body.data.referrer && !body.data.referrer.startsWith(new URL(request.url).origin) ? body.data.referrer : null;
  return json(await recordView(id, g.visitorId!, { referrer: ref, device: deviceFromUserAgent(request.headers.get("user-agent")) }));
}
