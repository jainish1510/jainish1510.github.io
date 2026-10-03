import { db } from "@/lib/db/client";

export type Period = 7 | 30 | 90;

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function emptySeries(days: number, now: Date) {
  const out = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) out.set(dayKey(new Date(now.getTime() - i * 86400000)), 0);
  return out;
}

function bucket(rows: { createdAt: Date }[], days: number, now: Date) {
  const series = emptySeries(days, now);
  for (const r of rows) {
    const k = dayKey(r.createdAt);
    if (series.has(k)) series.set(k, series.get(k)! + 1);
  }
  return [...series.entries()].map(([date, value]) => ({ date, value }));
}

export async function getTotals() {
  const [views, likes, comments, bookmarks, pending, messages] = await Promise.all([
    db.view.count(),
    db.like.count(),
    db.comment.count({ where: { status: "APPROVED" } }),
    db.bookmark.count(),
    db.comment.count({ where: { status: "PENDING" } }),
    db.contactMessage.count({ where: { read: false } }),
  ]);
  return { views, likes, comments, bookmarks, pending, messages };
}

export async function getAnalytics(days: Period = 30, now = new Date()) {
  const since = new Date(now.getTime() - days * 86400000);
  const prevSince = new Date(since.getTime() - days * 86400000);
  const [views, likes, comments, prevViews, posts, clicks, tags] = await Promise.all([
    db.view.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true, referrer: true, device: true, postId: true } }),
    db.like.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    db.comment.findMany({ where: { createdAt: { gte: since }, status: { in: ["APPROVED", "PENDING"] } }, select: { createdAt: true } }),
    db.view.count({ where: { createdAt: { gte: prevSince, lt: since } } }),
    db.post.findMany({ select: { id: true, title: true, slug: true, status: true, _count: { select: { views: true, likes: true, comments: true, bookmarks: true } } } }),
    db.event.findMany({ where: { type: "project_click", createdAt: { gte: since } }, select: { entityId: true, metadata: true } }),
    db.tag.findMany({ select: { name: true, posts: { select: { id: true } } } }),
  ]);

  const count = <T,>(items: T[], key: (i: T) => string | null | undefined) => {
    const m = new Map<string, number>();
    for (const i of items) {
      const k = key(i) ?? "direct";
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  };

  const viewsByPost = new Map<string, number>();
  for (const v of views) viewsByPost.set(v.postId, (viewsByPost.get(v.postId) ?? 0) + 1);

  const projectTitles = new Map((await db.project.findMany({ select: { id: true, title: true } })).map((p) => [p.id, p.title]));

  return {
    period: days,
    summary: {
      views: views.length,
      viewsChange: prevViews ? (views.length - prevViews) / prevViews : null,
      likes: likes.length,
      comments: comments.length,
    },
    series: {
      views: bucket(views, days, now),
      likes: bucket(likes, days, now),
      comments: bucket(comments, days, now),
    },
    referrers: count(views, (v) => v.referrer).slice(0, 8),
    devices: count(views, (v) => v.device ?? "unknown"),
    topPosts: posts
      .map((p) => ({ ...p, periodViews: viewsByPost.get(p.id) ?? 0 }))
      .sort((a, b) => b._count.views - a._count.views)
      .slice(0, 8),
    topTags: tags
      .map((t) => ({ name: t.name, value: t.posts.reduce((sum, p) => sum + (viewsByPost.get(p.id) ?? 0), 0) }))
      .filter((t) => t.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8),
    projectClicks: count(clicks, (c) => projectTitles.get(c.entityId ?? "") ?? "unknown").slice(0, 8),
  };
}

export type AnalyticsData = Awaited<ReturnType<typeof getAnalytics>>;
