import { z } from "zod";
import { guard, json, problem, readJson } from "@/lib/api";
import { CommentError, setCommentLike } from "@/lib/repositories/comments";
import { LIMITS } from "@/lib/security/rate-limit";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard(request, { mutation: true, requireVisitor: true, limit: { key: "comment-like", ...LIMITS.like } });
  if ("error" in g) return g.error;
  const body = await readJson(request, z.object({ liked: z.boolean() }), 200);
  if ("error" in body) return body.error;
  const { id } = await params;
  try {
    return json(await setCommentLike(id, g.visitorId!, body.data.liked));
  } catch (error) {
    if (error instanceof CommentError) return problem(404, error.message);
    throw error;
  }
}
