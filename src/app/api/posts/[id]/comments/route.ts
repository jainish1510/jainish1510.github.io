import { guard, json, problem, readJson } from "@/lib/api";
import { CommentError, createComment, listApprovedComments } from "@/lib/repositories/comments";
import { LIMITS } from "@/lib/security/rate-limit";
import { commentInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard(request, { limit: { key: "comments-read", ...LIMITS.search } });
  if ("error" in g) return g.error;
  const { id } = await params;
  return json({ comments: await listApprovedComments(id, g.visitorId) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard(request, { mutation: true, requireVisitor: true, limit: { key: "comment", ...LIMITS.comment } });
  if ("error" in g) return g.error;
  const { id } = await params;
  const body = await readJson(request, commentInputSchema.omit({ postId: true }), 12_000);
  if ("error" in body) return body.error;

  // Bots: filled the honeypot, or submitted faster than a human can type.
  if (body.data.website || (body.data.elapsed !== undefined && body.data.elapsed < 2500)) {
    return json({ status: "PENDING", message: "Thanks — your comment is awaiting moderation." });
  }
  try {
    const comment = await createComment({
      postId: id,
      parentId: body.data.parentId,
      name: body.data.name,
      email: body.data.email,
      content: body.data.content,
      visitorId: g.visitorId,
      ipHash: g.ip,
    });
    const message =
      comment.status === "APPROVED" ? "Comment published." : "Thanks — your comment is awaiting moderation and will appear once approved.";
    return json({ status: comment.status === "SPAM" ? "PENDING" : comment.status, message }, { status: 201 });
  } catch (error) {
    if (error instanceof CommentError) return problem(400, error.message);
    throw error;
  }
}
