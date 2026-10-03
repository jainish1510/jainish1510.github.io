import "server-only";
import { getContent } from "@/lib/store/load";
import type { Project, ProjectCard } from "@/lib/store/types";

export type { ProjectCard };

const toCard = ({ videoUrl: _v, problem: _p, motivation: _m, architecture: _a, howItWorks: _h, challenges: _c, results: _r, lessons: _l, gallery: _g, research: _re, ...card }: Project): ProjectCard => card;

export function listProjects(filter: { category?: string; featured?: boolean; area?: string } = {}): ProjectCard[] {
  return getContent()
    .projects.filter((p) => (!filter.category || p.category === filter.category) && (!filter.featured || p.featured) && (!filter.area || p.areas.some((a) => a.slug === filter.area)))
    .map(toCard);
}

export const listProjectSlugs = () => getContent().projects.map((p) => p.slug);
export const getProject = (slug: string): Project | null => getContent().projects.find((p) => p.slug === slug) ?? null;

export function getAdjacentProjects(slug: string) {
  const all = getContent().projects;
  const i = all.findIndex((p) => p.slug === slug);
  return { previous: i > 0 ? { slug: all[i - 1]!.slug, title: all[i - 1]!.title } : null, next: i >= 0 && i < all.length - 1 ? { slug: all[i + 1]!.slug, title: all[i + 1]!.title } : null };
}

export const listResearch = () => getContent().research;
export const listResearchSlugs = () => getContent().research.map((r) => r.slug);
export const getResearch = (slug: string) => getContent().research.find((r) => r.slug === slug) ?? null;
export const listExperience = () => getContent().experience;
export const listEducation = () => getContent().education;
export const listAwards = () => getContent().awards;
export const listSkills = () => getContent().skills;

/** Everything the research graph needs. */
export function getResearchGraph() {
  const c = getContent();
  const posts = c.posts.filter((p) => p.status === "PUBLISHED" && p.publishedAt && p.publishedAt <= c.builtAt);
  return {
    areas: c.areas,
    posts: posts.map((p) => ({ slug: p.slug, title: p.title, areas: p.areas.map((a) => a.slug) })),
    projects: c.projects.map((p) => ({ slug: p.slug, title: p.title, areas: p.areas.map((a) => a.slug) })),
    research: c.research.map((r) => ({ slug: r.slug, title: r.title, areas: r.areas.map((a) => a.slug) })),
    skills: c.skills.filter((s) => s.areaSlugs.length).map((s) => ({ slug: s.slug, name: s.name, areas: s.areaSlugs })),
  };
}

export type ResearchGraphData = ReturnType<typeof getResearchGraph>;
