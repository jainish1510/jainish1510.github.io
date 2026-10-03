import "server-only";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import YAML from "yaml";
import type { ZodType } from "zod";
import { makeExcerpt, readingTime, slugify } from "@/lib/content/text";
import * as S from "./schema";
import type * as T from "./types";

/**
 * Reads everything in /content at build time. Problems are collected across
 * ALL files and reported together with the file name and field, in plain
 * language, so a typo fails the build with a clear message instead of
 * publishing a broken page.
 */
let ROOT = process.cwd();
let CONTENT_DIR = path.join(ROOT, "content");
let PUBLIC_DIR = path.join(ROOT, "public");

export class ContentError extends Error {
  constructor(public problems: string[]) {
    super(`\n\nThe content has ${problems.length} problem${problems.length === 1 ? "" : "s"} to fix:\n\n${problems.map((p) => `  • ${p}`).join("\n")}\n`);
    this.name = "ContentError";
  }
}

type Ctx = { problems: string[] };
const rel = (file: string) => path.relative(ROOT, file).split(path.sep).join("/");

function check<D>(ctx: Ctx, schema: ZodType<D>, data: unknown, file: string): D | null {
  if (data === undefined) return null; // a missing file was already reported (or is optional)
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  for (const issue of result.error.issues) {
    const where = issue.path.length ? ` → ${issue.path.join(".")}` : "";
    const message = /received undefined/.test(issue.message) ? "this is required but missing" : issue.message.replace(/^Invalid input: expected (\w+), received (\w+)$/, "expected $1 but found $2");
    ctx.problems.push(`${rel(file)}${where}: ${message}`);
  }
  return null;
}

function readYaml(ctx: Ctx, name: string, required = true): unknown {
  const file = path.join(CONTENT_DIR, name);
  if (!existsSync(file)) {
    if (required) ctx.problems.push(`content/${name}: file is missing`);
    return undefined;
  }
  try {
    return YAML.parse(readFileSync(file, "utf8"));
  } catch (e) {
    ctx.problems.push(`content/${name}: could not be read (${(e as Error).message.split("\n")[0]}). Check indentation and quotes.`);
    return undefined;
  }
}

export function parseFrontMatter(source: string): { data: unknown; body: string } | null {
  const m = source.replace(/^﻿/, "").match(/^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)([\s\S]*)$/);
  if (!m) return null;
  return { data: YAML.parse(m[1]!) ?? {}, body: m[2]! };
}

/** Split a body into `# Heading` sections, ignoring `#` lines inside code fences. */
export function splitSections(body: string): { intro: string; sections: { heading: string; text: string }[] } {
  const sections: { heading: string; text: string[] }[] = [];
  const intro: string[] = [];
  let fence: string | null = null;
  for (const line of body.split(/\r?\n/)) {
    const f = line.match(/^\s*(```+|~~~+)/);
    if (f) fence = fence ? (line.trim().startsWith(fence[0]!.slice(0, 3)) ? null : fence) : f[1]!;
    const h = !fence && line.match(/^# (.+?)\s*$/);
    if (h) sections.push({ heading: h[1]!, text: [] });
    else (sections.at(-1)?.text ?? intro).push(line);
  }
  return { intro: intro.join("\n").trim(), sections: sections.map((s) => ({ heading: s.heading, text: s.text.join("\n").trim() })) };
}

function mdFiles(ctx: Ctx, dir: string): { slug: string; file: string; source: string }[] {
  const full = path.join(CONTENT_DIR, dir);
  if (!existsSync(full)) return [];
  return readdirSync(full)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .sort()
    .flatMap((f) => {
      const slug = f.slice(0, -3);
      const file = path.join(full, f);
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        ctx.problems.push(`${rel(file)}: the file name must be lowercase words joined by hyphens (for example my-first-post.md)`);
        return [];
      }
      return [{ slug, file, source: readFileSync(file, "utf8") }];
    });
}

function assetExists(ctx: Ctx, file: string, assetPath: string | undefined) {
  if (!assetPath || /^https?:\/\//.test(assetPath)) return;
  if (!existsSync(path.join(PUBLIC_DIR, assetPath.replace(/^\//, "")))) {
    ctx.problems.push(`${rel(file)}: the image ${assetPath} was not found. Put the file in public${path.posix.dirname(assetPath)}/ and check the spelling.`);
  }
}

const upper = <V extends string>(v: V) => v.toUpperCase();
const asRef = (items: { slug: string; name: string }[]) => (slugs: string[], ctx: Ctx, file: string, what: string): T.NamedRef[] =>
  slugs.flatMap((s) => {
    const hit = items.find((i) => i.slug === s);
    if (!hit) ctx.problems.push(`${rel(file)}: ${what} “${s}” does not exist. Available: ${items.map((i) => i.slug).join(", ")}`);
    return hit ? [{ name: hit.name, slug: hit.slug }] : [];
  });

export function loadContent(now = new Date(), root = process.env.CONTENT_ROOT ?? process.cwd()): T.Content {
  ROOT = root;
  CONTENT_DIR = path.join(ROOT, "content");
  PUBLIC_DIR = path.join(ROOT, "public");
  const ctx: Ctx = { problems: [] };

  // ── site + taxonomy ────────────────────────────────────────────────
  const siteFile = path.join(CONTENT_DIR, "site.yml");
  const site = check(ctx, S.siteSchema, readYaml(ctx, "site.yml", true), siteFile);
  const areasRaw = check(ctx, S.areaList, readYaml(ctx, "areas.yml", false), path.join(CONTENT_DIR, "areas.yml")) ?? [];
  const catsRaw = check(ctx, S.categoryList, readYaml(ctx, "categories.yml", false), path.join(CONTENT_DIR, "categories.yml")) ?? [];
  const skillsRaw = check(ctx, S.skillList, readYaml(ctx, "skills.yml", false), path.join(CONTENT_DIR, "skills.yml")) ?? [];

  const areas: T.Area[] = areasRaw.map((a) => ({ id: a.slug, slug: a.slug, name: a.name, description: a.description ?? null, parentId: a.parent ?? null }));
  for (const a of areas) if (a.parentId && !areas.some((p) => p.slug === a.parentId)) ctx.problems.push(`content/areas.yml: area “${a.slug}” has parent “${a.parentId}”, which does not exist`);
  const categories: T.Category[] = catsRaw.map((c) => ({ id: c.slug, slug: c.slug, name: c.name, description: c.description ?? null }));
  const skillRefs = asRef(skillsRaw);
  const areaRefs = asRef(areas);

  // ── projects ───────────────────────────────────────────────────────
  const PROJECT_SECTIONS: Record<string, keyof T.Project> = { problem: "problem", "why i built it": "motivation", motivation: "motivation", architecture: "architecture", "how it works": "howItWorks", challenges: "challenges", results: "results", lessons: "lessons" };
  type ProjectDraft = T.Project & { order: number };
  const projects: ProjectDraft[] = [];
  mdFiles(ctx, "projects").forEach(({ slug, file, source }, index) => {
    const parsed = safeFront(ctx, source, file);
    if (!parsed) return;
    const f = check(ctx, S.projectFront, parsed.data, file);
    if (!f) return;
    assetExists(ctx, file, f.cover);
    f.gallery.forEach((g) => assetExists(ctx, file, g.src));
    const split = splitSections(parsed.body);
    const sec: Partial<Record<keyof T.Project, string>> = {};
    for (const s of split.sections) {
      const key = PROJECT_SECTIONS[s.heading.toLowerCase()];
      if (!key) ctx.problems.push(`${rel(file)}: unknown section “# ${s.heading}”. Use: Problem, Why I built it, Architecture, How it works, Challenges, Results, Lessons`);
      else sec[key] = s.text;
    }
    projects.push({
      id: slug, slug, title: f.title, summary: f.summary, category: upper(f.category), status: upper(f.status),
      startDate: f.startDate ?? null, endDate: f.endDate ?? null, githubUrl: f.githubUrl || null, demoUrl: f.demoUrl || null, videoUrl: f.videoUrl || null,
      featured: f.featured, isPlaceholder: f.placeholder, recognition: f.recognition ?? null,
      cover: f.cover ? { path: f.cover, alt: f.coverAlt ?? "" } : null,
      skills: skillRefs(f.skills, ctx, file, "technology").map((s) => ({ id: s.slug, ...s })), areas: areaRefs(f.areas, ctx, file, "research area"),
      problem: sec.problem as string ?? null, motivation: sec.motivation as string ?? null, architecture: sec.architecture as string ?? null, howItWorks: sec.howItWorks as string ?? null,
      challenges: sec.challenges as string ?? null, results: sec.results as string ?? null, lessons: sec.lessons as string ?? null,
      gallery: f.gallery.map((g) => ({ path: g.src, alt: g.alt, caption: g.caption ?? null })), research: [], order: f.order ?? index,
    });
  });
  projects.sort((a, b) => a.order - b.order);

  // ── research ───────────────────────────────────────────────────────
  const RESEARCH_SECTIONS: Record<string, "methodology" | "datasets" | "experiments" | "results"> = { methodology: "methodology", datasets: "datasets", experiments: "experiments", results: "results" };
  const research: (T.ResearchEntry & { order: number })[] = [];
  mdFiles(ctx, "research").forEach(({ slug, file, source }, index) => {
    const parsed = safeFront(ctx, source, file);
    if (!parsed) return;
    const f = check(ctx, S.researchFront, parsed.data, file);
    if (!f) return;
    const sec: Partial<Record<"methodology" | "datasets" | "experiments" | "results", string>> = {};
    for (const s of splitSections(parsed.body).sections) {
      const key = RESEARCH_SECTIONS[s.heading.toLowerCase()];
      if (!key) ctx.problems.push(`${rel(file)}: unknown section “# ${s.heading}”. Use: Methodology, Datasets, Experiments, Results`);
      else sec[key] = s.text;
    }
    const linked = f.projects.flatMap((p) => {
      const hit = projects.find((x) => x.slug === p);
      if (!hit) ctx.problems.push(`${rel(file)}: project “${p}” does not exist`);
      return hit ? [{ slug: hit.slug, title: hit.title }] : [];
    });
    research.push({
      id: slug, slug, title: f.title, abstract: f.abstract, question: f.question ?? null, methodology: sec.methodology ?? null, datasets: sec.datasets ?? null,
      experiments: sec.experiments ?? null, results: sec.results ?? null, publication: f.publication ?? null, codeUrl: f.codeUrl || null,
      collaborators: f.collaborators ?? null, institution: f.institution ?? null, status: upper(f.status), startDate: f.startDate ?? null, endDate: f.endDate ?? null,
      featured: f.featured, isPlaceholder: f.placeholder, areas: areaRefs(f.areas, ctx, file, "research area"),
      skills: skillRefs(f.skills, ctx, file, "technology").map((s) => ({ id: s.slug, ...s })), projects: linked, order: f.order ?? index,
    });
  });
  research.sort((a, b) => a.order - b.order);
  for (const p of projects) p.research = research.filter((r) => r.projects.some((x) => x.slug === p.slug)).map((r) => ({ slug: r.slug, title: r.title, status: r.status }));

  // ── experience, education, awards ──────────────────────────────────
  const expFile = path.join(CONTENT_DIR, "experience.yml");
  const experience: T.Experience[] = (check(ctx, S.experienceList, readYaml(ctx, "experience.yml", false), expFile) ?? []).map((e, i) => ({
    id: `exp-${i}`, role: e.role, organization: e.organization, location: e.location ?? null, type: upper(e.type), startDate: e.startDate, endDate: e.endDate ?? null,
    current: e.current, period: e.period ?? null, summary: e.summary ?? null, highlights: e.highlights.join("\n") || null, url: e.url || null,
    skills: skillRefs(e.skills, ctx, expFile, "technology").map((s) => ({ id: s.slug, ...s })),
  })).sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  const eduFile = path.join(CONTENT_DIR, "education.yml");
  const education: T.Education[] = (check(ctx, S.educationList, readYaml(ctx, "education.yml", false), eduFile) ?? []).map((e, i) => ({ id: `edu-${i}`, institution: e.institution, degree: e.degree, field: e.field, location: e.location ?? null, endDate: e.endDate ?? null, expected: e.expected, notes: e.notes.join("\n") || null }));
  const awardFile = path.join(CONTENT_DIR, "awards.yml");
  const awards: T.Award[] = (check(ctx, S.awardList, readYaml(ctx, "awards.yml", false), awardFile) ?? []).map((a, i) => ({ id: `award-${i}`, title: a.title, issuer: a.issuer, date: a.date ?? null, description: a.description ?? null, url: a.url || null }));

  // ── skills (with usage counts) ─────────────────────────────────────
  for (const s of skillsRaw) for (const a of s.areas) if (!areas.some((x) => x.slug === a)) ctx.problems.push(`content/skills.yml: skill “${s.slug}” refers to research area “${a}”, which does not exist`);
  const skills: T.Skill[] = skillsRaw.map((s) => {
    const ps = projects.filter((p) => p.skills.some((k) => k.slug === s.slug));
    const rs = research.filter((r) => r.skills.some((k) => k.slug === s.slug));
    const es = experience.filter((e) => e.skills.some((k) => k.slug === s.slug));
    return {
      id: s.slug, slug: s.slug, name: s.name, category: upper(s.category), usedFor: s.usedFor.join("\n") || null, proficiency: s.proficiency, favorite: s.favorite, areaSlugs: s.areas,
      projects: ps.map((p) => ({ title: p.title, slug: p.slug })), research: rs.map((r) => ({ title: r.title, slug: r.slug })), _count: { projects: ps.length, research: rs.length, experiences: es.length },
    };
  });

  // ── posts ──────────────────────────────────────────────────────────
  const catRef = (slug: string | undefined, file: string) => {
    if (!slug) return null;
    const c = categories.find((x) => x.slug === slug);
    if (!c) ctx.problems.push(`${rel(file)}: category “${slug}” does not exist. Available: ${categories.map((x) => x.slug).join(", ")}`);
    return c ? { name: c.name, slug: c.slug } : null;
  };
  const posts: T.Post[] = [];
  for (const { slug, file, source } of mdFiles(ctx, "posts")) {
    const parsed = safeFront(ctx, source, file);
    if (!parsed) continue;
    const f = check(ctx, S.postFront, parsed.data, file);
    if (!f) continue;
    if (f.status === "published" && !f.date) {
      ctx.problems.push(`${rel(file)} → date: a published post needs a date, for example date: 2026-07-12 (or set status: draft)`);
      continue;
    }
    assetExists(ctx, file, f.cover);
    const tags = [...new Map(f.tags.filter((t) => slugify(t)).map((t) => [slugify(t), t.trim()])).entries()].map(([s, name]) => ({ slug: s, name }));
    const body = parsed.body.trim();
    posts.push({
      id: slug, slug, title: f.title, subtitle: f.subtitle ?? null, excerpt: f.excerpt ?? makeExcerpt(body.replace(/^:::callout[\s\S]*?^:::\s*$/m, "")) ?? null,
      readingTime: readingTime(body), publishedAt: f.date ?? null, featured: f.featured, isDemo: f.demo, category: catRef(f.category, file), tags,
      cover: f.cover ? { path: f.cover, alt: f.coverAlt ?? "" } : null, status: upper(f.status) as T.Post["status"], content: body,
      areas: areaRefs(f.areas, ctx, file, "research area"), seoTitle: f.seoTitle ?? null, seoDescription: f.seoDescription ?? null,
      updatedAt: f.updated ?? f.date ?? statSync(file).mtime, author: { name: site?.name ?? "" },
    });
  }

  // ── personal lists ─────────────────────────────────────────────────
  const list = <D, R>(name: string, schema: ZodType<D[]>, map: (d: D, i: number) => R, required = false): R[] => (check(ctx, schema, readYaml(ctx, name, required), path.join(CONTENT_DIR, name)) ?? []).map(map);
  const now_ = list("now.yml", S.nowList, (n, i): T.NowItem => ({ id: `now-${i}`, label: n.label, value: n.value, detail: n.detail ?? null, icon: n.icon }));
  const timeline = list("timeline.yml", S.timelineList, (t, i): T.TimelineEvent => ({ id: `tl-${i}`, year: t.year, title: t.title, description: t.description ?? null, kind: upper(t.kind), link: t.link ?? null }));
  const learning = list("learning.yml", S.learningList, (l, i): T.LearningItem => ({ id: `lr-${i}`, topic: l.topic, note: l.note ?? null, progress: l.progress }));
  const facts = list("facts.yml", S.factList, (f, i): T.Fact => ({ id: `fact-${i}`, text: f }));
  const books = list("books.yml", S.bookList, (b, i): T.Book => ({ id: `book-${i}`, title: b.title, author: b.author, note: b.note ?? null, status: upper(b.status), url: b.url || null }));
  const interests = list("interests.yml", S.interestList, (n, i): T.Interest => ({ id: `int-${i}`, name: n.name, description: n.description ?? null }));
  const goals = list("goals.yml", S.goalList, (g, i): T.Goal => ({ id: `goal-${i}`, text: g.text, horizon: g.horizon }));
  const social = list("social.yml", S.socialList, (l, i): T.SocialLink => ({ id: `soc-${i}`, platform: l.platform, label: l.label, url: l.url, handle: l.handle ?? null, visible: l.visible }));
  const widgetsParsed = check(ctx, S.widgetsFile, readYaml(ctx, "widgets.yml", false) ?? {}, path.join(CONTENT_DIR, "widgets.yml"));

  if (site?.portrait) assetExists(ctx, siteFile, site.portrait.src);

  // Duplicate slugs
  for (const [what, items] of [["post", posts], ["project", projects], ["research entry", research]] as const) {
    const seen = new Set<string>();
    for (const i of items) {
      if (seen.has(i.slug)) ctx.problems.push(`two ${what}s share the name “${i.slug}”`);
      seen.add(i.slug);
    }
  }

  if (ctx.problems.length || !site || !widgetsParsed) throw new ContentError(ctx.problems.length ? ctx.problems : ["content/site.yml is missing"]);

  return {
    site: site as T.SiteConfig,
    categories, areas, posts, projects, research, skills, experience, education, awards,
    now: now_, timeline, learning, facts, books, interests, goals, social,
    widgets: { spotify: widgetsParsed.spotify ? { enabled: widgetsParsed.spotify.enabled, title: widgetsParsed.spotify.title, artist: widgetsParsed.spotify.artist, album: widgetsParsed.spotify.album, url: widgetsParsed.spotify.url || null } : null, github: widgetsParsed.github, clock: widgetsParsed.clock, randomFact: widgetsParsed.randomFact },
    builtAt: now,
  };
}

function safeFront(ctx: Ctx, source: string, file: string) {
  try {
    const parsed = parseFrontMatter(source);
    if (!parsed) {
      ctx.problems.push(`${rel(file)}: the file must start with a settings block between two lines of three dashes (---). See any other file in the same folder for an example.`);
      return null;
    }
    return parsed;
  } catch (e) {
    ctx.problems.push(`${rel(file)}: the settings block at the top could not be read (${(e as Error).message.split("\n")[0]}). Check indentation, and put quotes around text that contains a colon.`);
    return null;
  }
}

let cached: { content: T.Content; at: number } | null = null;

/** Cached for the length of a build; re-read on every call in `next dev` so edits show up on refresh. */
export function getContent(): T.Content {
  if (process.env.NODE_ENV === "development") return loadContent();
  if (!cached) cached = { content: loadContent(), at: Date.now() };
  return cached.content;
}
