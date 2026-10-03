import "server-only";
import { stripMarkdown } from "@/lib/content/text";
import { getContent } from "@/lib/store/load";
import type { SearchDocument } from "./engine";

const STATIC_PAGES: SearchDocument[] = [
  { id: "page-about", type: "page", title: "About", subtitle: "Biography, journey, education and interests", url: "/about", tags: ["bio", "biography", "education"] },
  { id: "page-projects", type: "page", title: "Projects", subtitle: "Things I've built", url: "/projects", tags: ["portfolio", "work"] },
  { id: "page-research", type: "page", title: "Research", subtitle: "Questions I'm working on", url: "/research", tags: ["lab", "papers"] },
  { id: "page-experience", type: "page", title: "Experience", subtitle: "Career timeline and technology universe", url: "/experience", tags: ["career", "resume", "skills"] },
  { id: "page-blog", type: "page", title: "Writing", subtitle: "Essays, notes and experiments", url: "/blog", tags: ["blog", "articles"] },
  { id: "page-contact", type: "page", title: "Contact", subtitle: "Get in touch", url: "/contact", tags: ["email", "social"] },
  { id: "page-bookmarks", type: "page", title: "Saved articles", subtitle: "Articles you bookmarked", url: "/bookmarks", tags: ["bookmarks", "saved"] },
];

const BODY_LIMIT = 4000;

/** Everything searchable, serialised into /search-index.json at build time. */
export function buildSearchDocuments(): SearchDocument[] {
  const c = getContent();
  const body = (...parts: (string | null | undefined)[]) => stripMarkdown(parts.filter(Boolean).join("\n")).slice(0, BODY_LIMIT);
  return [
    ...c.posts
      .filter((p) => p.status === "PUBLISHED" && p.publishedAt && p.publishedAt <= c.builtAt)
      .map<SearchDocument>((p) => ({ id: p.id, type: "post", title: p.title, subtitle: p.subtitle ?? p.excerpt, url: `/blog/${p.slug}/`, tags: p.tags.map((t) => t.name), category: p.category?.name, body: body(p.content), date: p.publishedAt?.toISOString() })),
    ...c.projects.map<SearchDocument>((p) => ({ id: p.id, type: "project", title: p.title, subtitle: p.summary, url: `/projects/${p.slug}/`, tags: p.skills.map((s) => s.name), category: p.category, body: body(p.problem, p.howItWorks), date: p.startDate?.toISOString() })),
    ...c.research.map<SearchDocument>((r) => ({ id: r.id, type: "research", title: r.title, subtitle: r.abstract, url: `/research/${r.slug}/`, tags: r.areas.map((a) => a.name), category: "Research", body: body(r.question, r.methodology) })),
    ...STATIC_PAGES.map((p) => ({ ...p, url: `${p.url}/` })),
  ];
}
