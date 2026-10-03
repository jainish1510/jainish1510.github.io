import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/** A minimal but complete content tree in a temp folder, for testing the loader. */
export function makeSite(extra: Record<string, string> = {}) {
  const root = mkdtempSync(path.join(tmpdir(), "studio-"));
  const put = (file: string, text: string) => {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    writeFileSync(path.join(root, file), text);
  };
  put("content/site.yml", "name: Test Person\nurl: https://example.test\nnav:\n  - label: About\n    href: /about\n");
  put("content/areas.yml", "- slug: ml\n  name: Machine Learning\n- slug: vision\n  name: Vision\n  parent: ml\n");
  put("content/categories.yml", "- slug: notes\n  name: Notes\n- slug: essays\n  name: Essays\n");
  put("content/skills.yml", "- slug: python\n  name: Python\n  category: languages\n  areas: [ml]\n");
  put("content/posts/first-post.md", "---\ntitle: First Post\ndate: 2025-01-02\ncategory: notes\ntags: [One, Two]\nareas: [ml]\n---\n\nHello **world**.\n");
  put("content/projects/thing.md", "---\ntitle: Thing\nsummary: A thing\ncategory: ml\nskills: [python]\n---\n\n# Problem\n\nIt is hard.\n\n```bash\n# a comment, not a heading\nls\n```\n\n# Results\n\nGood.\n");
  put("content/research/study.md", "---\ntitle: Study\nabstract: An abstract.\nprojects: [thing]\n---\n\n# Methodology\n\nWe did stuff.\n");
  for (const [file, text] of Object.entries(extra)) put(file, text);
  return { root, put, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}
