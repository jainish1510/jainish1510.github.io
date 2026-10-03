import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db/client";
import { bus } from "@/lib/events/bus";
import {
  adminListPosts,
  createPost,
  getPublishedPostBySlug,
  getRelatedPosts,
  listPublishedPosts,
  restoreRevision,
  setPostStatus,
  updatePost,
} from "@/lib/repositories/posts";
import { getSearchIndex, invalidateSearchIndex } from "@/lib/search";
import { makeAdmin, postInput, resetDb } from "../helpers";

let authorId: string;

beforeEach(async () => {
  await resetDb();
  authorId = (await makeAdmin()).id;
  invalidateSearchIndex();
});

describe("creating and editing posts", () => {
  it("creates a draft that is not publicly visible", async () => {
    const post = await createPost(postInput(), authorId);
    expect(post.status).toBe("DRAFT");
    expect(post.readingTime).toBeGreaterThanOrEqual(1);
    expect(post.excerpt).toContain("Some bold text");
    expect(await getPublishedPostBySlug(post.slug)).toBeNull();
    expect((await adminListPosts({ status: "DRAFT" })).map((p) => p.id)).toContain(post.id);
    const revisions = await db.postRevision.count({ where: { postId: post.id } });
    expect(revisions).toBe(1);
  });

  it("creates tags on the fly and de-duplicates them", async () => {
    await createPost(postInput({ tags: ["Machine Learning", "machine learning", "VAE"] }), authorId);
    const tags = await db.tag.findMany({ orderBy: { slug: "asc" } });
    expect(tags.map((t) => [t.slug, t.name])).toEqual([
      ["machine-learning", "Machine Learning"],
      ["vae", "VAE"],
    ]);
  });

  it("generates unique slugs on collision", async () => {
    const a = await createPost(postInput(), authorId);
    const b = await createPost(postInput(), authorId);
    expect(a.slug).toBe("testing-the-pipeline");
    expect(b.slug).toBe("testing-the-pipeline-2");
  });

  it("edits a post, replaces tags and records a revision", async () => {
    const post = await createPost(postInput(), authorId);
    const updated = await updatePost(post.id, postInput({ title: "Renamed", content: "New body", tags: ["Fresh"] }), "manual");
    expect(updated.title).toBe("Renamed");
    const withTags = await db.post.findUniqueOrThrow({ where: { id: post.id }, include: { tags: true } });
    expect(withTags.tags.map((t) => t.name)).toEqual(["Fresh"]);
    expect(await db.postRevision.count({ where: { postId: post.id } })).toBe(2);
  });

  it("throttles autosave revisions", async () => {
    const post = await createPost(postInput(), authorId);
    await updatePost(post.id, postInput({ content: "draft 1" }), "autosave");
    await updatePost(post.id, postInput({ content: "draft 2" }), "autosave");
    expect(await db.postRevision.count({ where: { postId: post.id } })).toBe(1);
  });

  it("restores an earlier revision", async () => {
    const post = await createPost(postInput({ content: "original" }), authorId);
    await updatePost(post.id, postInput({ content: "changed" }), "manual");
    const first = await db.postRevision.findFirstOrThrow({ where: { postId: post.id, note: "created" } });
    await restoreRevision(post.id, first.id);
    expect((await db.post.findUniqueOrThrow({ where: { id: post.id } })).content).toBe("original");
  });
});

describe("publishing", () => {
  it("publishes a draft, stamps the date and emits an event", async () => {
    const events: string[] = [];
    const off = bus.on("post.published", ({ slug }) => void events.push(slug));
    const post = await createPost(postInput(), authorId);
    await setPostStatus(post.id, "PUBLISHED");
    off();
    const live = await getPublishedPostBySlug(post.slug);
    expect(live?.publishedAt).toBeInstanceOf(Date);
    expect(events).toEqual([post.slug]);
    expect((await listPublishedPosts()).total).toBe(1);
  });

  it("treats future-dated posts as scheduled", async () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    const post = await createPost(postInput({ status: "PUBLISHED", publishedAt: future as unknown as Date }), authorId);
    expect(await getPublishedPostBySlug(post.slug)).toBeNull();
  });

  it("hides archived posts", async () => {
    const post = await createPost(postInput({ status: "PUBLISHED" }), authorId);
    await setPostStatus(post.id, "ARCHIVED");
    expect(await getPublishedPostBySlug(post.slug)).toBeNull();
  });

  it("makes published posts searchable", async () => {
    await createPost(postInput({ status: "PUBLISHED", title: "Quantum Teleportation Notes", slug: "quantum" }), authorId);
    await createPost(postInput({ title: "Secret Draft About Quantum", slug: "secret" }), authorId);
    const results = (await getSearchIndex()).search("quantum", { types: ["post"] });
    expect(results.map((r) => r.title)).toEqual(["Quantum Teleportation Notes"]);
  });

  it("ranks related posts by shared tags and category", async () => {
    const cat = await db.category.create({ data: { name: "Notes", slug: "notes" } });
    const base = await createPost(postInput({ status: "PUBLISHED", slug: "base", tags: ["ml", "vae"], categoryId: cat.id }), authorId);
    const close = await createPost(postInput({ status: "PUBLISHED", slug: "close", title: "Close", tags: ["ml", "vae"], categoryId: cat.id }), authorId);
    await createPost(postInput({ status: "PUBLISHED", slug: "far", title: "Far", tags: ["cooking"] }), authorId);
    const related = await getRelatedPosts(base.id, 2);
    expect(related[0]?.id).toBe(close.id);
  });
});
