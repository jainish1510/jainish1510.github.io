import { z } from "zod";

/**
 * Validation for every content file. All object schemas are `.strict()` so a
 * typo such as `tilte:` is reported instead of silently ignored.
 */
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "use lowercase letters, numbers and single hyphens");
const text = z.string().trim();
const optText = text.optional();
const url = z
  .string()
  .trim()
  .refine((v) => v === "" || /^(https?:\/\/|mailto:|\/)/.test(v), "must start with https://, mailto: or /");
const date = z
  .union([z.string(), z.date()])
  .refine((v) => !Number.isNaN(new Date(v as string).getTime()), "must be a date like 2026-07-12")
  .transform((v) => {
    if (v instanceof Date) return v;
    return new Date(v.length === 10 ? `${v}T12:00:00Z` : v);
  });
const strings = z.array(z.string()).default([]);
const obj = <T extends z.ZodRawShape>(shape: T) => z.object(shape).strict();

export const siteSchema = obj({
  name: text,
  url: url.default("https://jainish1510.github.io"),
  discipline: text.default(""),
  roles: text.default(""),
  description: text.default(""),
  heroIntro: text.default(""),
  location: text.default(""),
  timezone: text.default("UTC"),
  email: text.default(""),
  contactBlurb: text.default(""),
  availability: text.default(""),
  resumeUrl: url.default(""),
  blogHeroEyebrow: text.default("Thoughts / Research / Building"),
  blogHeroLine: text.default("Ideas, experiments, technical notes, research, and things I'm figuring out."),
  footerMotto: strings,
  nav: z.array(obj({ label: text, href: z.string().regex(/^\/[\w\-/]*$/, "must be a path like /about") })).default([]),
  homeSections: obj({ now: z.boolean().default(true), projects: z.boolean().default(true), research: z.boolean().default(true), writing: z.boolean().default(true), about: z.boolean().default(true), interests: z.boolean().default(true) }).default({ now: true, projects: true, research: true, writing: true, about: true, interests: true }),
  portrait: obj({ src: z.string(), alt: text, isPlaceholder: z.boolean().default(false) }).nullable().default(null),
  aboutIntro: text.default(""),
  aboutStory: text.default(""),
  comments: obj({ enabled: z.boolean().default(false), repo: text.default(""), repoId: text.default(""), category: text.default(""), categoryId: text.default("") }).default({ enabled: false, repo: "", repoId: "", category: "", categoryId: "" }),
});

export const postFront = obj({
  title: text.min(1),
  subtitle: optText,
  date: date.optional(),
  updated: date.optional(),
  status: z.enum(["published", "draft", "archived"]).default("published"),
  featured: z.boolean().default(false),
  category: slug.optional(),
  tags: strings,
  areas: z.array(slug).default([]),
  cover: z.string().optional(),
  coverAlt: optText,
  demo: z.boolean().default(false),
  excerpt: optText,
  seoTitle: optText,
  seoDescription: optText,
});

export const projectFront = obj({
  title: text.min(1),
  summary: text.min(1),
  category: z.enum(["ml", "research", "web", "cloud", "ai", "systems"]),
  status: z.enum(["active", "completed", "prototype", "archived"]).default("completed"),
  startDate: date.optional(),
  endDate: date.optional(),
  githubUrl: url.optional(),
  demoUrl: url.optional(),
  videoUrl: url.optional(),
  recognition: optText,
  featured: z.boolean().default(false),
  placeholder: z.boolean().default(false),
  order: z.number().optional(),
  cover: z.string().optional(),
  coverAlt: optText,
  skills: z.array(slug).default([]),
  areas: z.array(slug).default([]),
  gallery: z.array(obj({ src: z.string(), alt: text.default(""), caption: optText })).default([]),
});

export const researchFront = obj({
  title: text.min(1),
  abstract: text.min(1),
  question: optText,
  status: z.enum(["ongoing", "completed", "planned"]).default("ongoing"),
  institution: optText,
  startDate: date.optional(),
  endDate: date.optional(),
  collaborators: optText,
  publication: optText,
  codeUrl: url.optional(),
  featured: z.boolean().default(false),
  placeholder: z.boolean().default(false),
  order: z.number().optional(),
  areas: z.array(slug).default([]),
  skills: z.array(slug).default([]),
  projects: z.array(slug).default([]),
});

export const areaList = z.array(obj({ slug, name: text.min(1), parent: slug.optional(), description: optText }));
export const categoryList = z.array(obj({ slug, name: text.min(1), description: optText }));
export const skillList = z.array(
  obj({
    slug,
    name: text.min(1),
    category: z.enum(["languages", "frameworks", "ml", "cloud", "databases", "infrastructure", "research", "tools"]),
    proficiency: z.number().int().min(1).max(5).default(3),
    usedFor: strings,
    areas: z.array(slug).default([]),
    favorite: z.boolean().default(false),
  }),
);
export const experienceList = z.array(
  obj({
    role: text.min(1),
    organization: text.min(1),
    location: optText,
    type: z.enum(["work", "internship", "research", "leadership"]).default("work"),
    startDate: date,
    endDate: date.optional(),
    current: z.boolean().default(false),
    period: optText,
    summary: optText,
    highlights: strings,
    url: url.optional(),
    skills: z.array(slug).default([]),
  }),
);
export const educationList = z.array(obj({ institution: text.min(1), degree: text.min(1), field: text.min(1), location: optText, endDate: date.optional(), expected: z.boolean().default(false), notes: strings }));
export const awardList = z.array(obj({ title: text.min(1), issuer: text.min(1), date: date.optional(), description: optText, url: url.optional() }));
export const nowList = z.array(obj({ label: text.min(1), value: text.min(1), detail: optText, icon: z.enum(["graduation", "microscope", "hammer", "book", "pin", "music", "spark", "dot"]).default("dot") }));
export const timelineList = z.array(obj({ year: z.number().int().min(1950).max(2100), title: text.min(1), kind: z.enum(["education", "research", "work", "build", "community", "milestone"]).default("milestone"), description: optText, link: optText }));
export const learningList = z.array(obj({ topic: text.min(1), note: optText, progress: z.number().min(0).max(100).default(0) }));
export const factList = z.array(z.string().min(1));
export const bookList = z.array(obj({ title: text.min(1), author: text.min(1), status: z.enum(["reading", "read", "queued"]).default("read"), note: optText, url: url.optional() }));
export const interestList = z.array(obj({ name: text.min(1), description: optText }));
export const goalList = z.array(obj({ text: text.min(1), horizon: text.default("") }));
export const socialList = z.array(obj({ platform: z.enum(["github", "linkedin", "email", "x", "twitter", "spotify", "website", "rss"]), label: text.min(1), url: url, handle: optText, visible: z.boolean().default(true) }));
export const widgetsFile = obj({
  spotify: obj({ enabled: z.boolean().default(true), title: text.default(""), artist: text.default(""), album: text.default(""), url: url.optional() }).optional(),
  github: obj({ enabled: z.boolean().default(true), username: text.default("") }).default({ enabled: true, username: "" }),
  clock: obj({ enabled: z.boolean().default(true) }).default({ enabled: true }),
  randomFact: obj({ enabled: z.boolean().default(true) }).default({ enabled: true }),
});
