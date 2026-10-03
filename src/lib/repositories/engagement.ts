import { db } from "@/lib/db/client";
import { VIEW_DEDUP_WINDOW_MS } from "@/lib/constants";

/**
 * Likes and bookmarks are idempotent per (post, visitor) thanks to unique
 * indexes; toggles therefore never create duplicates even under races.
 */
export async function setPostLike(postId: string, visitorId: string, liked: boolean) {
  if (liked) {
    await db.like.upsert({ where: { postId_visitorId: { postId, visitorId } }, create: { postId, visitorId }, update: {} });
  } else {
    await db.like.deleteMany({ where: { postId, visitorId } });
  }
  const count = await db.like.count({ where: { postId } });
  return { liked, count };
}

export async function setBookmark(postId: string, visitorId: string, saved: boolean) {
  if (saved) {
    await db.bookmark.upsert({ where: { postId_visitorId: { postId, visitorId } }, create: { postId, visitorId }, update: {} });
  } else {
    await db.bookmark.deleteMany({ where: { postId, visitorId } });
  }
  return { saved };
}

export async function getEngagementState(postId: string, visitorId: string | null) {
  const [likes, comments, views, liked, saved] = await Promise.all([
    db.like.count({ where: { postId } }),
    db.comment.count({ where: { postId, status: "APPROVED" } }),
    db.view.count({ where: { postId } }),
    visitorId ? db.like.count({ where: { postId, visitorId } }) : 0,
    visitorId ? db.bookmark.count({ where: { postId, visitorId } }) : 0,
  ]);
  return { likes, comments, views, liked: liked > 0, saved: saved > 0 };
}

/**
 * Counts a view unless the same visitor viewed the same post inside the
 * dedup window. Bots are ignored entirely.
 */
export async function recordView(
  postId: string,
  visitorId: string,
  meta: { referrer?: string | null; device?: string | null } = {},
  now = new Date(),
) {
  if (meta.device === "bot") return { counted: false };
  const recent = await db.view.findFirst({
    where: { postId, visitorId, createdAt: { gt: new Date(now.getTime() - VIEW_DEDUP_WINDOW_MS) } },
    select: { id: true },
  });
  if (recent) return { counted: false };
  await db.view.create({ data: { postId, visitorId, referrer: normaliseReferrer(meta.referrer), device: meta.device ?? null, createdAt: now } });
  return { counted: true };
}

export function normaliseReferrer(referrer?: string | null) {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    return host || null;
  } catch {
    return null;
  }
}

export async function listBookmarkedPosts(visitorId: string, extraIds: string[] = []) {
  const bookmarks = await db.bookmark.findMany({ where: { visitorId }, select: { postId: true, createdAt: true }, orderBy: { createdAt: "desc" } });
  const ids = [...new Set([...bookmarks.map((b) => b.postId), ...extraIds])];
  if (!ids.length) return [];
  return db.post.findMany({
    where: { id: { in: ids }, status: "PUBLISHED" },
    select: { id: true, slug: true, title: true, subtitle: true, readingTime: true, publishedAt: true, category: { select: { name: true } } },
  });
}

export async function recordEvent(type: string, data: { entityType?: string; entityId?: string; visitorId?: string | null; metadata?: object }) {
  await db.event.create({
    data: {
      type,
      entityType: data.entityType,
      entityId: data.entityId,
      visitorId: data.visitorId ?? null,
      metadata: data.metadata ? JSON.stringify(data.metadata).slice(0, 1000) : null,
    },
  });
}
