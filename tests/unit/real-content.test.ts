import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { listPublishedPosts, getRelatedPosts, getAdjacentPosts, getPublishedPostBySlug, listCategoriesWithCounts, listTagsWithCounts } from "@/lib/repositories/posts";
import { getResearchGraph, listProjects } from "@/lib/repositories/portfolio";
import { buildSearchDocuments } from "@/lib/search/documents";
import { SearchIndex } from "@/lib/search/engine";
import { loadContent } from "@/lib/store/load";

/** These run against the actual /content folder, so a bad edit fails `npm test` and CI before it can be deployed. */
describe("the real content", () => {
  const c = loadContent();

  it("is valid", () => {
    expect(c.posts.length).toBeGreaterThan(0);
    expect(c.site.name).toBeTruthy();
  });

  it("only references media files that exist", () => {
    const refs = new Set<string>();
    const dir = path.join(process.cwd(), "content");
    const walk = (d: string) => {
      for (const f of readdirSync(d, { withFileTypes: true })) {
        const full = path.join(d, f.name);
        if (f.isDirectory()) walk(full);
        else for (const m of readFileSync(full, "utf8").matchAll(/\/media\/[\w./-]+\.(?:png|jpe?g|webp|gif|avif|mp4|webm)/g)) refs.add(m[0]);
      }
    };
    walk(dir);
    expect(refs.size).toBeGreaterThan(0);
    for (const ref of refs) expect(existsSync(path.join(process.cwd(), "public", ref)), ref).toBe(true);
  });

  it("publishes five posts and keeps the draft out", () => {
    const { posts, total } = listPublishedPosts();
    expect(total).toBe(5);
    expect(posts.map((p) => p.slug)).not.toContain("notes-on-agentic-ai-systems");
    expect(getPublishedPostBySlug("notes-on-agentic-ai-systems")).toBeNull();
  });

  it("orders posts newest first and links neighbours", () => {
    const { posts } = listPublishedPosts();
    const dates = posts.map((p) => p.publishedAt!.getTime());
    expect(dates).toEqual([...dates].sort((a, b) => b - a));
    const mid = getPublishedPostBySlug(posts[2]!.slug)!;
    const { previous, next } = getAdjacentPosts(mid.publishedAt!);
    expect(previous?.slug).toBe(posts[3]!.slug);
    expect(next?.slug).toBe(posts[1]!.slug);
  });

  it("filters by tag and category and counts them", () => {
    const tag = listTagsWithCounts().find((t) => t.slug === "machine-learning")!;
    expect(listPublishedPosts({ tag: tag.slug }).total).toBe(tag._count.posts);
    const cat = listCategoriesWithCounts().find((x) => x.slug === "building")!;
    expect(listPublishedPosts({ category: "building" }).total).toBe(cat._count.posts);
  });

  it("finds related posts that share topics", () => {
    const vae = getPublishedPostBySlug("understanding-variational-autoencoders-through-experiments")!;
    const related = getRelatedPosts(vae.id, 2);
    expect(related).toHaveLength(2);
    expect(related.map((p) => p.id)).not.toContain(vae.id);
  });

  it("keeps the original project order and featured set", () => {
    expect(listProjects().map((p) => p.slug).slice(0, 2)).toEqual(["multi-cloud-deployment-orchestrator", "vae-benchmark"]);
    expect(listProjects({ featured: true })).toHaveLength(4);
  });

  it("builds a research graph where every node points at a real area", () => {
    const g = getResearchGraph();
    const areas = new Set(g.areas.map((a) => a.slug));
    for (const n of [...g.posts, ...g.projects, ...g.research, ...g.skills]) for (const a of n.areas) expect(areas.has(a)).toBe(true);
  });

  it("produces a searchable index of published content only", () => {
    const docs = buildSearchDocuments();
    expect(docs.some((d) => d.type === "post" && d.title.includes("Agentic"))).toBe(false); // the draft post
    const index = new SearchIndex(docs);
    expect(index.search("variational")[0]?.url).toContain("/blog/");
    expect(index.search("elder care")[0]?.type).toBe("project");
    for (const d of docs) expect(d.url.endsWith("/")).toBe(true);
  });
});
