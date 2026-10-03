import { describe, expect, it } from "vitest";
import { collectionSchema } from "@/lib/admin/collection-schema";
import { getCollection } from "@/lib/admin/collections";
import { insertBlock, prefixLines, wrapSelection } from "@/lib/content/editing";
import { commentInputSchema, postInputSchema } from "@/lib/validation";
import { postInput } from "../helpers";

describe("post validation", () => {
  it("accepts a valid post and normalises empty strings to null", () => {
    const r = postInputSchema.safeParse({ ...postInput(), subtitle: "", excerpt: "" });
    expect(r.success).toBe(true);
    expect(r.data?.subtitle).toBeNull();
  });
  it("rejects bad slugs, missing titles and unknown statuses", () => {
    expect(postInputSchema.safeParse({ ...postInput(), slug: "Bad Slug!" }).success).toBe(false);
    expect(postInputSchema.safeParse({ ...postInput(), title: "  " }).success).toBe(false);
    expect(postInputSchema.safeParse({ ...postInput(), status: "LIVE" }).success).toBe(false);
  });
  it("caps tags", () => {
    expect(postInputSchema.safeParse({ ...postInput(), tags: Array.from({ length: 13 }, (_, i) => `t${i}`) }).success).toBe(false);
  });
});

describe("comment validation", () => {
  const base = { postId: "p1", name: "Alex", content: "Nice post!" };
  it("enforces the documented limits", () => {
    expect(commentInputSchema.safeParse(base).success).toBe(true);
    expect(commentInputSchema.safeParse({ ...base, name: "x".repeat(81) }).success).toBe(false);
    expect(commentInputSchema.safeParse({ ...base, content: "x".repeat(5001) }).success).toBe(false);
    expect(commentInputSchema.safeParse({ ...base, email: "not-an-email" }).success).toBe(false);
    expect(commentInputSchema.safeParse({ ...base, email: "" }).data?.email).toBeNull();
  });
  it("rejects a filled honeypot", () => {
    expect(commentInputSchema.safeParse({ ...base, website: "http://spam" }).success).toBe(false);
  });
});

describe("collection schema factory", () => {
  it("builds validators from field definitions", () => {
    const schema = collectionSchema(getCollection("projects")!);
    const ok = schema.safeParse({ title: "X", slug: "x", summary: "S", category: "ML", status: "ACTIVE", githubUrl: "", skills: [], areas: [], gallery: [], startDate: "2025-01-01", order: "2" });
    expect(ok.success).toBe(true);
    expect((ok.data as Record<string, unknown>).githubUrl).toBeNull();
    expect((ok.data as Record<string, unknown>).startDate).toBeInstanceOf(Date);
    expect((ok.data as Record<string, unknown>).order).toBe(2);
    const bad = schema.safeParse({ title: "X", slug: "x", summary: "S", category: "NOPE", status: "ACTIVE", githubUrl: "javascript:alert(1)" });
    expect(bad.success).toBe(false);
  });
});

describe("editor text operations", () => {
  it("wraps and unwraps a selection", () => {
    const wrapped = wrapSelection("make bold here", 5, 9, "**");
    expect(wrapped.value).toBe("make **bold** here");
    const unwrapped = wrapSelection(wrapped.value, wrapped.selectionStart, wrapped.selectionEnd, "**");
    expect(unwrapped.value).toBe("make bold here");
  });
  it("inserts blocks with blank-line separation", () => {
    expect(insertBlock("para", 4, 4, "---").value).toBe("para\n\n---\n\n");
  });
  it("prefixes and toggles list markers", () => {
    const r = prefixLines("a\nb", 0, 3, "- ");
    expect(r.value).toBe("- a\n- b");
    expect(prefixLines(r.value, 0, r.value.length, "- ").value).toBe("a\nb");
  });
});
