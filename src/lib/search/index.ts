import { db } from "@/lib/db/client";
import { stripMarkdown } from "@/lib/content/text";
import { bus } from "@/lib/events/bus";
import { SearchIndex, type SearchDocument } from "./engine";

const STATIC_PAGES: SearchDocument[] = [
  { id: "page-about", type: "page", title: "About", subtitle: "Biography, journey, education and interests", url: "/about", tags: ["bio", "biography", "education"] },
  { id: "page-projects", type: "page", title: "Projects", subtitle: "Things I've built", url: "/projects", tags: ["portfolio", "work"] },
  { id: "page-research", type: "page", title: "Research", subtitle: "Questions I'm working on", url: "/research", tags: ["lab", "papers"] },
  { id: "page-experience", type: "page", title: "Experience", subtitle: "Career timeline and technology universe", url: "/experience", tags: ["career", "resume", "skills"] },
  { id: "page-blog", type: "page", title: "Writing", subtitle: "Essays, notes and experiments", url: "/blog", tags: ["blog", "articles"] },
  { id: "page-contact", type: "page", title: "Contact", subtitle: "Get in touch", url: "/contact", tags: ["email", "social"] },
  { id: "page-bookmarks", type: "page", title: "Saved articles", subtitle: "Articles you bookmarked", url: "/bookmarks", tags: ["bookmarks", "saved"] },
];

export async function loadSearchDocuments(): Promise<SearchDocument[]> {
  const [posts, projects, research] = await Promise.all([
    db.post.findMany({
      where: { status: "PUBLISHED", publishedAt: { lte: new Date() } },
      select: { id: true, slug: true, title: true, subtitle: true, excerpt: true, content: true, publishedAt: true, category: { select: { name: true } }, tags: { select: { name: true } } },
    }),
    db.project.findMany({ select: { id: true, slug: true, title: true, summary: true, category: true, problem: true, howItWorks: true, startDate: true, skills: { select: { name: true } } } }),
    db.researchProject.findMany({ select: { id: true, slug: true, title: true, abstract: true, question: true, methodology: true, areas: { select: { name: true } } } }),
  ]);
  return [
    ...posts.map<SearchDocument>((p) => ({
      id: p.id,
      type: "post",
      title: p.title,
      subtitle: p.subtitle ?? p.excerpt,
      url: `/blog/${p.slug}`,
      tags: p.tags.map((t) => t.name),
      category: p.category?.name,
      body: stripMarkdown(p.content),
      date: p.publishedAt?.toISOString(),
    })),
    ...projects.map<SearchDocument>((p) => ({
      id: p.id,
      type: "project",
      title: p.title,
      subtitle: p.summary,
      url: `/projects/${p.slug}`,
      tags: p.skills.map((s) => s.name),
      category: p.category,
      body: stripMarkdown([p.problem, p.howItWorks].filter(Boolean).join("\n")),
      date: p.startDate?.toISOString(),
    })),
    ...research.map<SearchDocument>((r) => ({
      id: r.id,
      type: "research",
      title: r.title,
      subtitle: r.abstract,
      url: `/research/${r.slug}`,
      tags: r.areas.map((a) => a.name),
      category: "Research",
      body: stripMarkdown([r.question, r.methodology].filter(Boolean).join("\n")),
    })),
    ...STATIC_PAGES,
  ];
}

const TTL_MS = 5 * 60_000;
const g = globalThis as unknown as { __searchIndex?: { index: SearchIndex; builtAt: number } | null; __searchHooked?: boolean };

export async function getSearchIndex() {
  if (!g.__searchIndex || Date.now() - g.__searchIndex.builtAt > TTL_MS) {
    g.__searchIndex = { index: new SearchIndex(await loadSearchDocuments()), builtAt: Date.now() };
  }
  return g.__searchIndex.index;
}

export function invalidateSearchIndex() {
  g.__searchIndex = null;
}

if (!g.__searchHooked) {
  g.__searchHooked = true;
  bus.on("post.saved", invalidateSearchIndex);
  bus.on("post.deleted", invalidateSearchIndex);
  bus.on("content.changed", invalidateSearchIndex);
}
