// Usage:  npm run new-post -- "My first post"
// Creates content/posts/my-first-post.md as a DRAFT you can edit and preview.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const title = process.argv.slice(2).join(" ").trim();
if (!title) {
  console.error('\n  Give the post a title, for example:\n\n    npm run new-post -- "What I learned this week"\n');
  process.exit(1);
}
const slug = title
  .normalize("NFKD")
  .replace(/[̀-ͯ]/g, "")
  .toLowerCase()
  .replace(/&/g, " and ")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 80);
if (!slug) {
  console.error("\n  That title has no letters or numbers to make a web address from. Try another.\n");
  process.exit(1);
}
const file = path.join("content", "posts", `${slug}.md`);
if (existsSync(file)) {
  console.error(`\n  ${file} already exists. Pick a different title, or open that file.\n`);
  process.exit(1);
}
const first = (readFileSync(path.join("content", "categories.yml"), "utf8").match(/slug:\s*(\S+)/) ?? [])[1] ?? "";
const today = new Date().toISOString().slice(0, 10);
writeFileSync(
  file,
  `---
title: ${JSON.stringify(title)}
subtitle: One line that makes people want to read it
date: ${today}
status: draft          # change to "published" when you are ready
category: ${first}     # see content/categories.yml for the options
tags:
  - Example tag
# cover: /media/blog/my-cover.png     # optional; put the image in public/media/blog/
# coverAlt: Describe the image        # optional
---

Write your post here, using Markdown.

## A heading

Normal text, **bold**, *italic*, [a link](https://example.com), and lists:

- one
- two
`,
);
console.log(`\n  Created ${file}\n\n  1. Open it in any text editor and write.\n  2. Preview:  npm run dev   then open http://localhost:3000/blog/${slug}/\n     (drafts are hidden until you change status to published)\n  3. Publish: set  status: published  and push it to GitHub.\n`);
