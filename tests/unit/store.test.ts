import { afterEach, describe, expect, it } from "vitest";
import { ContentError, loadContent, splitSections } from "@/lib/store/load";
import { makeSite } from "./../helpers";

const NOW = new Date("2026-01-01T00:00:00Z");
let cleanup: (() => void) | null = null;
afterEach(() => cleanup?.());

function site(extra: Record<string, string> = {}) {
  const s = makeSite(extra);
  cleanup = s.cleanup;
  return s;
}
const problems = (root: string) => {
  try {
    loadContent(NOW, root);
  } catch (e) {
    if (e instanceof ContentError) return e.problems;
    throw e;
  }
  return [] as string[];
};

describe("loading a valid site", () => {
  it("builds typed content with derived fields", () => {
    const c = loadContent(NOW, site().root);
    expect(c.site.name).toBe("Test Person");
    const post = c.posts[0]!;
    expect(post).toMatchObject({ slug: "first-post", status: "PUBLISHED", readingTime: 1, category: { slug: "notes", name: "Notes" } });
    expect(post.tags.map((t) => t.slug)).toEqual(["one", "two"]);
    expect(post.excerpt).toBe("Hello world.");
    expect(c.projects[0]).toMatchObject({ category: "ML", status: "COMPLETED", problem: "It is hard.\n\n```bash\n# a comment, not a heading\nls\n```", results: "Good." });
    expect(c.research[0]!.projects).toEqual([{ slug: "thing", title: "Thing" }]);
    expect(c.projects[0]!.research.map((r) => r.slug)).toEqual(["study"]);
    expect(c.skills[0]!._count.projects).toBe(1);
  });
});

describe("section splitting", () => {
  it("ignores # lines inside code fences", () => {
    const { sections } = splitSections("# One\n\n```py\n# not a heading\n```\n\n# Two\n\nbody");
    expect(sections.map((s) => s.heading)).toEqual(["One", "Two"]);
    expect(sections[0]!.text).toContain("# not a heading");
  });
});

describe("friendly errors", () => {
  it("reports every problem with the file and field, and catches typos", () => {
    const s = site({
      "content/posts/bad.md": "---\ntilte: Oops\ndate: 2025-01-01\n---\nbody\n",
      "content/projects/also-bad.md": "---\ntitle: X\nsummary: Y\ncategory: nonsense\n---\n",
    });
    const list = problems(s.root);
    expect(list.join("\n")).toMatch(/content\/posts\/bad\.md.*Unrecognized key: "tilte"/);
    expect(list.join("\n")).toMatch(/content\/posts\/bad\.md → title: this is required but missing/);
    expect(list.join("\n")).toMatch(/content\/projects\/also-bad\.md → category/);
  });

  it("explains missing dates, unknown categories and missing images", () => {
    const s = site({
      "content/posts/nodate.md": "---\ntitle: No date\n---\nx\n",
      "content/posts/badcat.md": "---\ntitle: Bad cat\ndate: 2025-01-01\ncategory: nope\ncover: /media/missing.png\n---\nx\n",
    });
    const text = problems(s.root).join("\n");
    expect(text).toMatch(/nodate\.md → date: a published post needs a date/);
    expect(text).toMatch(/category “nope” does not exist\. Available: notes, essays/);
    expect(text).toMatch(/image \/media\/missing\.png was not found/);
  });

  it("rejects a file without a settings block, bad YAML, and badly named files", () => {
    const s = site({ "content/posts/plain.md": "just text", "content/posts/broken.md": "---\ntitle: a: b: c\n---\nx", "content/posts/Bad Name.md": "---\ntitle: x\ndate: 2025-01-01\n---\n" });
    const text = problems(s.root).join("\n");
    expect(text).toMatch(/plain\.md: the file must start with a settings block/);
    expect(text).toMatch(/broken\.md: the settings block at the top could not be read/);
    expect(text).toMatch(/Bad Name\.md: the file name must be lowercase/);
  });

  it("rejects unknown section headings and dangling references", () => {
    const s = site({
      "content/projects/oops.md": "---\ntitle: Oops\nsummary: s\ncategory: ml\nskills: [cobol]\nareas: [nowhere]\n---\n\n# Introduction\n\ntext\n",
    });
    const text = problems(s.root).join("\n");
    expect(text).toMatch(/unknown section “# Introduction”/);
    expect(text).toMatch(/technology “cobol” does not exist/);
    expect(text).toMatch(/research area “nowhere” does not exist/);
  });
});

describe("visibility", () => {
  it("loads drafts and future posts but flags them as not live", () => {
    const s = site({
      "content/posts/draft.md": "---\ntitle: Draft\nstatus: draft\n---\nx\n",
      "content/posts/future.md": "---\ntitle: Future\ndate: 2030-01-01\n---\nx\n",
    });
    const c = loadContent(NOW, s.root);
    const live = c.posts.filter((p) => p.status === "PUBLISHED" && p.publishedAt && p.publishedAt <= c.builtAt).map((p) => p.slug);
    expect(live).toEqual(["first-post"]);
    expect(c.posts).toHaveLength(3);
  });
});
