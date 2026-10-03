import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db/client";
import { COMMENT_LIMITS, type CommentStatus } from "@/lib/constants";
import { bus } from "@/lib/events/bus";
import { sanitizePlainText } from "@/lib/security/http";
import { SPAM_THRESHOLD, scoreSpam } from "@/lib/security/spam";

export type PublicComment = {
  id: string;
  parentId: string | null;
  depth: number;
  authorName: string;
  isAuthor: boolean;
  isDemo: boolean;
  content: string;
  createdAt: string;
  likes: number;
  liked: boolean;
  replies: PublicComment[];
};

/** Approved comments for a post, assembled into a tree (max depth 3). */
export async function listApprovedComments(postId: string, visitorId: string | null): Promise<PublicComment[]> {
  const rows = await db.comment.findMany({
    where: { postId, status: "APPROVED" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      parentId: true,
      depth: true,
      authorName: true,
      isAuthor: true,
      isDemo: true,
      content: true,
      createdAt: true,
      _count: { select: { likes: true } },
      likes: visitorId ? { where: { visitorId }, select: { id: true } } : false,
    },
  });
  const byId = new Map<string, PublicComment>();
  for (const r of rows) {
    byId.set(r.id, {
      id: r.id,
      parentId: r.parentId,
      depth: r.depth,
      authorName: r.authorName,
      isAuthor: r.isAuthor,
      isDemo: r.isDemo,
      content: r.content,
      createdAt: r.createdAt.toISOString(),
      likes: r._count.likes,
      liked: Array.isArray(r.likes) && r.likes.length > 0,
      replies: [],
    });
  }
  const roots: PublicComment[] = [];
  for (const c of byId.values()) {
    const parent = c.parentId ? byId.get(c.parentId) : undefined;
    if (parent) parent.replies.push(c);
    else if (!c.parentId) roots.push(c);
    // A reply whose parent is not approved is hidden with it.
  }
  return roots;
}

export type CreateCommentInput = {
  postId: string;
  parentId?: string | null;
  name: string;
  email?: string | null;
  content: string;
  visitorId?: string | null;
  ipHash?: string | null;
  isAuthor?: boolean;
};

export class CommentError extends Error {}

export async function createComment(input: CreateCommentInput) {
  const post = await db.post.findFirst({ where: { id: input.postId, status: "PUBLISHED" }, select: { id: true } });
  if (!post) throw new CommentError("This article isn't accepting comments.");

  let depth = 0;
  if (input.parentId) {
    const parent = await db.comment.findFirst({ where: { id: input.parentId, postId: input.postId }, select: { depth: true, status: true } });
    if (!parent || (parent.status !== "APPROVED" && !input.isAuthor)) throw new CommentError("You can't reply to that comment.");
    // Replies beyond the third level attach to the deepest allowed level.
    depth = Math.min(parent.depth + 1, COMMENT_LIMITS.maxDepth);
    if (parent.depth >= COMMENT_LIMITS.maxDepth) {
      const p = await db.comment.findUnique({ where: { id: input.parentId }, select: { parentId: true } });
      input.parentId = p?.parentId ?? input.parentId;
    }
  }

  const name = sanitizePlainText(input.name, COMMENT_LIMITS.name);
  const content = sanitizePlainText(input.content, COMMENT_LIMITS.content);
  const email = input.email ? sanitizePlainText(input.email, COMMENT_LIMITS.email).toLowerCase() : null;
  const { score } = scoreSpam({ name, content, email });

  // Readers whose earlier comments were approved skip the queue (same browser identity).
  const trusted =
    !input.isAuthor &&
    score === 0 &&
    !!input.visitorId &&
    (await db.comment.count({ where: { visitorId: input.visitorId, status: "APPROVED", isAuthor: false } })) >= 2;

  const status: CommentStatus = input.isAuthor ? "APPROVED" : score >= SPAM_THRESHOLD ? "SPAM" : trusted ? "APPROVED" : "PENDING";

  const comment = await db.comment.create({
    data: {
      postId: input.postId,
      parentId: input.parentId ?? null,
      depth,
      authorName: name,
      authorEmail: email,
      content,
      status,
      isAuthor: input.isAuthor ?? false,
      visitorId: input.visitorId ?? null,
      ipHash: input.ipHash ?? null,
      spamScore: score,
    },
  });
  await bus.emit("comment.created", { id: comment.id, postId: comment.postId, status });
  return comment;
}

export async function setCommentLike(commentId: string, visitorId: string, liked: boolean) {
  const comment = await db.comment.findFirst({ where: { id: commentId, status: "APPROVED" }, select: { id: true } });
  if (!comment) throw new CommentError("Comment not found.");
  if (liked) {
    await db.commentLike.upsert({ where: { commentId_visitorId: { commentId, visitorId } }, create: { commentId, visitorId }, update: {} });
  } else {
    await db.commentLike.deleteMany({ where: { commentId, visitorId } });
  }
  return { liked, count: await db.commentLike.count({ where: { commentId } }) };
}

// ─── Moderation ────────────────────────────────────────────────────────────

export type AdminCommentFilter = { status?: CommentStatus | "ALL"; postId?: string; order?: "newest" | "oldest"; q?: string };

export async function adminListComments(filter: AdminCommentFilter = {}) {
  const where: Prisma.CommentWhereInput = {
    ...(filter.status && filter.status !== "ALL" ? { status: filter.status } : {}),
    ...(filter.postId ? { postId: filter.postId } : {}),
    ...(filter.q ? { OR: [{ content: { contains: filter.q } }, { authorName: { contains: filter.q } }] } : {}),
  };
  return db.comment.findMany({
    where,
    orderBy: { createdAt: filter.order === "oldest" ? "asc" : "desc" },
    take: 200,
    include: {
      post: { select: { title: true, slug: true } },
      parent: { select: { authorName: true, content: true } },
      _count: { select: { likes: true, replies: true } },
    },
  });
}

export async function commentStatusCounts() {
  const groups = await db.comment.groupBy({ by: ["status"], _count: { _all: true } });
  const out: Record<CommentStatus, number> = { PENDING: 0, APPROVED: 0, REJECTED: 0, SPAM: 0 };
  for (const g of groups) out[g.status as CommentStatus] = g._count._all;
  return out;
}

export async function moderateComments(ids: string[], action: CommentStatus | "DELETE") {
  if (action === "DELETE") await db.comment.deleteMany({ where: { id: { in: ids } } });
  else await db.comment.updateMany({ where: { id: { in: ids } }, data: { status: action } });
  await bus.emit("comment.moderated", { ids, status: action });
}
