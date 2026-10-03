// Usage: npm run check   — validates everything in /content and says what to fix, in plain language.
import { ContentError, loadContent } from "../src/lib/store/load";

try {
  const c = loadContent();
  const live = c.posts.filter((p) => p.status === "PUBLISHED" && p.publishedAt && p.publishedAt <= c.builtAt).length;
  console.log(`\n  ✓ Content is valid\n    ${live} published posts (${c.posts.length - live} drafts/scheduled), ${c.projects.length} projects, ${c.research.length} research entries, ${c.skills.length} skills\n`);
} catch (e) {
  if (e instanceof ContentError) {
    console.error(e.message);
    process.exit(1);
  }
  throw e;
}
