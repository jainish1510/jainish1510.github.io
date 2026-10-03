import { z } from "zod";
import { guard, json, problem, readJson } from "@/lib/api";
import { db } from "@/lib/db/client";
import { setPostLike } from "@/lib/repositories/engagement";
import { LIMITS } from "@/lib/security/rate-limit";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard(request, { mutation: true, requireVisitor: true, limit: { key: "like", ...LIMITS.like } });
  if ("error" in g) return g.error;
  const body = await readJson(request, z.object({ liked: z.boolean() }), 200);
  if ("error" in body) return body.error;
  const { id } = await params;
  const post = await db.post.findFirst({ where: { id, status: "PUBLISHED" }, select: { id: true } });
  if (!post) return problem(404, "Article not found.");
  return json(await setPostLike(id, g.visitorId!, body.data.liked));
}
