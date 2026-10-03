import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db/client";
import { CommentError, createComment, listApprovedComments, moderateComments, setCommentLike } from "@/lib/repositories/comments";
import { getEngagementState, listBookmarkedPosts, recordView, setBookmark, setPostLike } from "@/lib/repositories/engagement";
import { createPost } from "@/lib/repositories/posts";
import { VIEW_DEDUP_WINDOW_MS } from "@/lib/constants";
import { makeAdmin, postInput, resetDb } from "../helpers";

let postId: string;

beforeEach(async () => {
  await resetDb();
  const admin = await makeAdmin();
  postId = (await createPost(postInput({ status: "PUBLISHED" }), admin.id)).id;
});

describe("likes", () => {
  it("is idempotent per visitor and supports unliking", async () => {
    expect((await setPostLike(postId, "v1", true)).count).toBe(1);
    expect((await setPostLike(postId, "v1", true)).count).toBe(1); // duplicate ignored
    expect((await setPostLike(postId, "v2", true)).count).toBe(2);
    expect((await setPostLike(postId, "v1", false)).count).toBe(1);
    const state = await getEngagementState(postId, "v2");
    expect(state).toMatchObject({ likes: 1, liked: true });
  });

  it("survives concurrent duplicate requests", async () => {
    await Promise.all(Array.from({ length: 5 }, () => setPostLike(postId, "racer", true).catch(() => null)));
    expect(await db.like.count({ where: { postId, visitorId: "racer" } })).toBe(1);
  });
});

describe("views", () => {
  it("de-duplicates within the window and ignores bots", async () => {
    const t0 = new Date("2026-01-01T00:00:00Z");
    expect((await recordView(postId, "v1", { device: "desktop" }, t0)).counted).toBe(true);
    expect((await recordView(postId, "v1", { device: "desktop" }, new Date(t0.getTime() + 60_000))).counted).toBe(false);
    expect((await recordView(postId, "v1", {}, new Date(t0.getTime() + VIEW_DEDUP_WINDOW_MS + 1000))).counted).toBe(true);
    expect((await recordView(postId, "bot", { device: "bot" }, t0)).counted).toBe(false);
    const view = await db.view.findFirstOrThrow({ where: { visitorId: "v1" } });
    expect(view.device).toBe("desktop");
  });

  it("stores only the referrer host", async () => {
    await recordView(postId, "v9", { referrer: "https://www.google.com/search?q=secret" });
    expect((await db.view.findFirstOrThrow({ where: { visitorId: "v9" } })).referrer).toBe("google.com");
  });
});

describe("bookmarks", () => {
  it("persists per visitor", async () => {
    await setBookmark(postId, "v1", true);
    await setBookmark(postId, "v1", true);
    expect((await listBookmarkedPosts("v1")).map((p) => p.id)).toEqual([postId]);
    await setBookmark(postId, "v1", false);
    expect(await listBookmarkedPosts("v1")).toEqual([]);
  });
});

describe("comments", () => {
  it("queues new comments for moderation and shows only approved ones", async () => {
    const c = await createComment({ postId, name: "Alex", content: "Great post" });
    expect(c.status).toBe("PENDING");
    expect(await listApprovedComments(postId, null)).toEqual([]);
    await moderateComments([c.id], "APPROVED");
    const list = await listApprovedComments(postId, null);
    expect(list.map((x) => x.authorName)).toEqual(["Alex"]);
  });

  it("sends obvious spam straight to the spam folder", async () => {
    const c = await createComment({ postId, name: "seo", content: "buy backlinks http://a.test http://b.test http://c.test" });
    expect(c.status).toBe("SPAM");
  });

  it("stores content as plain text (no HTML interpretation)", async () => {
    const c = await createComment({ postId, name: "x", content: "<script>alert(1)</script>‮" });
    expect(c.content).toBe("<script>alert(1)</script>"); // rendered as text by React, bidi override stripped
  });

  it("builds a reply tree and caps depth at three levels", async () => {
    const root = await createComment({ postId, name: "A", content: "root" });
    await moderateComments([root.id], "APPROVED");
    const r1 = await createComment({ postId, parentId: root.id, name: "B", content: "level 2", isAuthor: true });
    const r2 = await createComment({ postId, parentId: r1.id, name: "C", content: "level 3", isAuthor: true });
    const r3 = await createComment({ postId, parentId: r2.id, name: "D", content: "level 4?", isAuthor: true });
    expect([r1.depth, r2.depth, r3.depth]).toEqual([1, 2, 2]);
    expect(r3.parentId).toBe(r1.id); // flattened onto the deepest allowed level
    const tree = await listApprovedComments(postId, null);
    expect(tree[0]?.replies[0]?.replies.map((r) => r.content)).toEqual(["level 3", "level 4?"]);
  });

  it("refuses comments on unpublished posts and replies to hidden comments", async () => {
    const admin = await db.user.findFirstOrThrow();
    const draft = await createPost(postInput({ slug: "draft-only" }), admin.id);
    await expect(createComment({ postId: draft.id, name: "A", content: "hi" })).rejects.toBeInstanceOf(CommentError);
    const pending = await createComment({ postId, name: "A", content: "pending" });
    await expect(createComment({ postId, parentId: pending.id, name: "B", content: "reply" })).rejects.toBeInstanceOf(CommentError);
  });

  it("likes comments once per visitor", async () => {
    const c = await createComment({ postId, name: "A", content: "likable" });
    await moderateComments([c.id], "APPROVED");
    await setCommentLike(c.id, "v1", true);
    expect((await setCommentLike(c.id, "v1", true)).count).toBe(1);
    const [listed] = await listApprovedComments(postId, "v1");
    expect(listed).toMatchObject({ likes: 1, liked: true });
  });
});
