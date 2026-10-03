import { cache } from "react";
import { db } from "@/lib/db/client";

/**
 * Site settings are stored one row per key. The definitions below give each
 * key a type, a default and an admin label, so /admin/settings is generated
 * from this list and new settings need no new UI.
 */
type SettingType = "text" | "textarea" | "markdown" | "boolean" | "nav";

type Def = { key: string; label: string; type: SettingType; group: string; default: string; help?: string };

export const SETTING_DEFS = [
  { key: "site.name", label: "Name", type: "text", group: "Identity", default: "Jainish Patel" },
  { key: "site.discipline", label: "Discipline", type: "text", group: "Identity", default: "Computer Science" },
  { key: "site.roles", label: "Roles line", type: "text", group: "Identity", default: "Researcher · Builder · Explorer" },
  {
    key: "site.description",
    label: "SEO description",
    type: "textarea",
    group: "Identity",
    default:
      "Jainish Patel — computer science graduate student working across machine learning, medical imaging research and software systems. Projects, research notes and writing.",
  },
  {
    key: "hero.intro",
    label: "Hero statement",
    type: "textarea",
    group: "Homepage",
    default: "I build systems at the intersection of machine learning, software, research, and emerging technology.",
  },
  { key: "home.showNow", label: "Show “Currently”", type: "boolean", group: "Homepage", default: "true" },
  { key: "home.showProjects", label: "Show featured projects", type: "boolean", group: "Homepage", default: "true" },
  { key: "home.showResearch", label: "Show research", type: "boolean", group: "Homepage", default: "true" },
  { key: "home.showWriting", label: "Show writing", type: "boolean", group: "Homepage", default: "true" },
  { key: "home.showAbout", label: "Show about teaser", type: "boolean", group: "Homepage", default: "true" },
  { key: "home.showInterests", label: "Show interests", type: "boolean", group: "Homepage", default: "true" },
  { key: "about.intro", label: "About — introduction", type: "markdown", group: "About", default: "" },
  { key: "about.story", label: "About — longer story", type: "markdown", group: "About", default: "" },
  { key: "contact.email", label: "Public email", type: "text", group: "Contact", default: "" },
  { key: "contact.blurb", label: "Contact blurb", type: "textarea", group: "Contact", default: "" },
  { key: "contact.availability", label: "Availability line", type: "text", group: "Contact", default: "" },
  { key: "location.label", label: "Location", type: "text", group: "Contact", default: "Nashville, TN" },
  { key: "location.timezone", label: "Time zone (IANA)", type: "text", group: "Contact", default: "America/Chicago" },
  { key: "resume.url", label: "Résumé URL", type: "text", group: "Contact", default: "", help: "Upload a PDF elsewhere or leave empty to hide the link." },
  { key: "blog.heroTitle", label: "Blog hero eyebrow", type: "text", group: "Blog", default: "Thoughts / Research / Building" },
  {
    key: "blog.heroSubtitle",
    label: "Blog hero line",
    type: "textarea",
    group: "Blog",
    default: "Ideas, experiments, technical notes, research, and things I'm figuring out.",
  },
  { key: "footer.motto", label: "Footer motto (one per line)", type: "textarea", group: "Footer", default: "Building.\nResearching.\nLearning." },
  {
    key: "nav.items",
    label: "Navigation",
    type: "nav",
    group: "Navigation",
    default: JSON.stringify([
      { label: "About", href: "/about" },
      { label: "Projects", href: "/projects" },
      { label: "Research", href: "/research" },
      { label: "Writing", href: "/blog" },
      { label: "Experience", href: "/experience" },
      { label: "Contact", href: "/contact" },
    ]),
    help: "One item per line: Label | /path",
  },
] as const satisfies readonly Def[];

export type SettingKey = (typeof SETTING_DEFS)[number]["key"];
export type Settings = Record<SettingKey, string>;
export type NavItem = { label: string; href: string };

export const getSettings = cache(async (): Promise<Settings> => {
  const rows = await db.siteSetting.findMany();
  const stored = new Map(rows.map((r) => [r.key, r.value]));
  return Object.fromEntries(SETTING_DEFS.map((d) => [d.key, stored.get(d.key) ?? d.default])) as Settings;
});

export function flag(settings: Settings, key: SettingKey) {
  return settings[key] === "true";
}

export function parseNav(value: string): NavItem[] {
  try {
    const items = JSON.parse(value) as NavItem[];
    return items.filter((i) => typeof i.label === "string" && typeof i.href === "string" && /^\/[\w\-/]*$/.test(i.href));
  } catch {
    return [];
  }
}

export async function saveSettings(values: Partial<Record<SettingKey, string>>) {
  const valid = new Set<string>(SETTING_DEFS.map((d) => d.key));
  await db.$transaction(
    Object.entries(values)
      .filter(([k, v]) => valid.has(k) && typeof v === "string")
      .map(([key, value]) => db.siteSetting.upsert({ where: { key }, create: { key, value: value! }, update: { value: value! } })),
  );
}
