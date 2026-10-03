import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db/client";

export const projectCardSelect = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  category: true,
  status: true,
  startDate: true,
  endDate: true,
  githubUrl: true,
  demoUrl: true,
  featured: true,
  isPlaceholder: true,
  recognition: true,
  cover: { select: { path: true, alt: true, width: true, height: true } },
  skills: { select: { name: true, slug: true }, orderBy: { order: "asc" } },
  areas: { select: { slug: true, name: true } },
} satisfies Prisma.ProjectSelect;

export type ProjectCard = Prisma.ProjectGetPayload<{ select: typeof projectCardSelect }>;

export async function listProjects(filter: { category?: string; featured?: boolean; area?: string } = {}) {
  return db.project.findMany({
    where: {
      ...(filter.category ? { category: filter.category } : {}),
      ...(filter.featured ? { featured: true } : {}),
      ...(filter.area ? { areas: { some: { slug: filter.area } } } : {}),
    },
    select: projectCardSelect,
    orderBy: [{ order: "asc" }, { startDate: "desc" }],
  });
}

export async function getProject(slug: string) {
  return db.project.findUnique({
    where: { slug },
    include: {
      cover: true,
      gallery: true,
      skills: { orderBy: { order: "asc" } },
      areas: true,
      research: { select: { slug: true, title: true, status: true } },
    },
  });
}

export async function getAdjacentProjects(slug: string) {
  const all = await db.project.findMany({ select: { slug: true, title: true }, orderBy: [{ order: "asc" }, { startDate: "desc" }] });
  const i = all.findIndex((p) => p.slug === slug);
  return { previous: i > 0 ? all[i - 1] : null, next: i >= 0 && i < all.length - 1 ? all[i + 1] : null };
}

export async function listResearch() {
  return db.researchProject.findMany({
    orderBy: [{ order: "asc" }, { startDate: "desc" }],
    include: { areas: { select: { slug: true, name: true } }, skills: { select: { name: true } } },
  });
}

export async function getResearch(slug: string) {
  return db.researchProject.findUnique({
    where: { slug },
    include: { areas: true, skills: true, projects: { select: { slug: true, title: true } }, figures: true },
  });
}

export async function listExperience() {
  return db.experience.findMany({ orderBy: [{ startDate: "desc" }], include: { skills: { select: { name: true, slug: true } } } });
}

export async function listEducation() {
  return db.education.findMany({ orderBy: [{ order: "asc" }] });
}

export async function listAwards() {
  return db.award.findMany({ orderBy: [{ order: "asc" }, { date: "desc" }] });
}

export async function listSkills() {
  return db.skill.findMany({
    orderBy: [{ category: "asc" }, { order: "asc" }],
    include: {
      projects: { select: { title: true, slug: true } },
      research: { select: { title: true, slug: true } },
      _count: { select: { projects: true, research: true, experiences: true } },
    },
  });
}

/** Everything the research graph needs, in one round trip per table. */
export async function getResearchGraph() {
  const [areas, posts, projects, research, skills] = await Promise.all([
    db.researchArea.findMany({ orderBy: { order: "asc" }, select: { id: true, slug: true, name: true, description: true, parentId: true } }),
    db.post.findMany({
      where: { status: "PUBLISHED", publishedAt: { lte: new Date() } },
      select: { slug: true, title: true, areas: { select: { slug: true } } },
    }),
    db.project.findMany({ select: { slug: true, title: true, areas: { select: { slug: true } } } }),
    db.researchProject.findMany({ select: { slug: true, title: true, areas: { select: { slug: true } } } }),
    db.skill.findMany({ where: { areas: { some: {} } }, select: { slug: true, name: true, areas: { select: { slug: true } } } }),
  ]);
  const flat = <T extends { areas: { slug: string }[] }>(rows: T[]) => rows.map(({ areas: a, ...rest }) => ({ ...rest, areas: a.map((x) => x.slug) }));
  return { areas, posts: flat(posts), projects: flat(projects), research: flat(research), skills: flat(skills) };
}

export type ResearchGraphData = Awaited<ReturnType<typeof getResearchGraph>>;
