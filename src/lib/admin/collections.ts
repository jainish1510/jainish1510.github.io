import {
  BOOK_STATUSES,
  EXPERIENCE_TYPES,
  PROJECT_CATEGORIES,
  PROJECT_STATUSES,
  RESEARCH_STATUSES,
  SKILL_CATEGORIES,
  TIMELINE_KINDS,
} from "@/lib/constants";

/**
 * Declarative content model for the admin. Each collection lists its fields
 * once; the validation schema (collection-schema.ts), the form and the list
 * view are all generated from this — adding a field is a one-line change.
 */
export type FieldType = "text" | "slug" | "textarea" | "markdown" | "number" | "boolean" | "select" | "date" | "url" | "relation" | "parent" | "media" | "gallery";

export type RelationTarget = "skills" | "areas" | "projects" | "research";

export type FieldDef = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: readonly string[];
  max?: number;
  min?: number;
  help?: string;
  relation?: RelationTarget;
  /** For slug fields: which field it's generated from. */
  from?: string;
  wide?: boolean;
};

export type CollectionDef = {
  key: string;
  label: string;
  singular: string;
  model: string;
  description: string;
  group: "Portfolio" | "Personal" | "Taxonomy";
  titleField: string;
  columns: string[];
  orderBy: Record<string, "asc" | "desc">[];
  fields: FieldDef[];
  publicPath?: (item: Record<string, unknown>) => string;
};

const order: FieldDef = { name: "order", label: "Sort order", type: "number", min: 0, max: 9999, help: "Lower numbers appear first." };
const md = (name: string, label: string, help?: string): FieldDef => ({ name, label, type: "markdown", max: 20000, help, wide: true });

export const COLLECTIONS: CollectionDef[] = [
  {
    key: "projects",
    label: "Projects",
    singular: "project",
    model: "project",
    group: "Portfolio",
    description: "Portfolio entries with problem, architecture, results and lessons.",
    titleField: "title",
    columns: ["category", "status", "featured", "order"],
    orderBy: [{ order: "asc" }],
    publicPath: (i) => `/projects/${i.slug}`,
    fields: [
      { name: "title", label: "Title", type: "text", required: true, max: 120 },
      { name: "slug", label: "Slug", type: "slug", from: "title", required: true },
      { name: "summary", label: "Summary", type: "textarea", required: true, max: 400, wide: true },
      { name: "category", label: "Category", type: "select", options: PROJECT_CATEGORIES, required: true },
      { name: "status", label: "Status", type: "select", options: PROJECT_STATUSES, required: true },
      { name: "startDate", label: "Start date", type: "date" },
      { name: "endDate", label: "End date", type: "date" },
      { name: "githubUrl", label: "GitHub URL", type: "url" },
      { name: "demoUrl", label: "Live demo URL", type: "url" },
      { name: "videoUrl", label: "Demo video URL", type: "url", help: "YouTube, Vimeo, Loom…" },
      { name: "recognition", label: "Recognition", type: "text", max: 200, help: "Only real awards or results." },
      { name: "coverId", label: "Cover image", type: "media" },
      { name: "gallery", label: "Gallery", type: "gallery", wide: true },
      { name: "skills", label: "Technology", type: "relation", relation: "skills", wide: true },
      { name: "areas", label: "Research areas", type: "relation", relation: "areas", wide: true },
      md("problem", "Problem"),
      md("motivation", "Why I built it"),
      md("architecture", "Architecture", "Mermaid diagrams supported."),
      md("howItWorks", "How it works"),
      md("challenges", "Challenges"),
      md("results", "Results"),
      md("lessons", "Lessons"),
      { name: "featured", label: "Featured on homepage", type: "boolean" },
      { name: "isPlaceholder", label: "Mark as “details pending”", type: "boolean" },
      order,
    ],
  },
  {
    key: "research",
    label: "Research",
    singular: "research entry",
    model: "researchProject",
    group: "Portfolio",
    description: "Research questions, methods, datasets and results.",
    titleField: "title",
    columns: ["status", "institution", "order"],
    orderBy: [{ order: "asc" }],
    publicPath: (i) => `/research/${i.slug}`,
    fields: [
      { name: "title", label: "Title", type: "text", required: true, max: 200 },
      { name: "slug", label: "Slug", type: "slug", from: "title", required: true },
      { name: "abstract", label: "Abstract", type: "textarea", required: true, max: 3000, wide: true },
      { name: "question", label: "Research question", type: "textarea", max: 1000, wide: true },
      { name: "status", label: "Status", type: "select", options: RESEARCH_STATUSES, required: true },
      { name: "institution", label: "Institution", type: "text", max: 200 },
      { name: "startDate", label: "Start date", type: "date" },
      { name: "endDate", label: "End date", type: "date" },
      { name: "collaborators", label: "Collaborators", type: "text", max: 500 },
      { name: "publication", label: "Publication", type: "textarea", max: 1000, help: "Only list real, citable publications." },
      { name: "codeUrl", label: "Code URL", type: "url" },
      { name: "areas", label: "Areas", type: "relation", relation: "areas", wide: true },
      { name: "skills", label: "Methods & tools", type: "relation", relation: "skills", wide: true },
      { name: "projects", label: "Related projects", type: "relation", relation: "projects", wide: true },
      { name: "figures", label: "Figures", type: "gallery", wide: true },
      md("methodology", "Methodology"),
      md("datasets", "Datasets"),
      md("experiments", "Experiments"),
      md("results", "Results"),
      { name: "featured", label: "Featured", type: "boolean" },
      { name: "isPlaceholder", label: "Placeholder / in progress", type: "boolean" },
      order,
    ],
  },
  {
    key: "experience",
    label: "Experience",
    singular: "role",
    model: "experience",
    group: "Portfolio",
    description: "Work, internships, research roles and leadership.",
    titleField: "role",
    columns: ["organization", "type", "period"],
    orderBy: [{ startDate: "desc" }],
    fields: [
      { name: "role", label: "Role", type: "text", required: true, max: 120 },
      { name: "organization", label: "Organization", type: "text", required: true, max: 200 },
      { name: "location", label: "Location", type: "text", max: 120 },
      { name: "type", label: "Type", type: "select", options: EXPERIENCE_TYPES, required: true },
      { name: "startDate", label: "Start date", type: "date", required: true },
      { name: "endDate", label: "End date", type: "date" },
      { name: "current", label: "Current role", type: "boolean" },
      { name: "period", label: "Display period", type: "text", max: 60, help: "Overrides dates when they're approximate, e.g. “Summer 2025”." },
      { name: "summary", label: "Summary", type: "textarea", max: 500, wide: true },
      { name: "highlights", label: "Highlights", type: "textarea", max: 4000, help: "One per line.", wide: true },
      { name: "url", label: "URL", type: "url" },
      { name: "skills", label: "Technology", type: "relation", relation: "skills", wide: true },
      order,
    ],
  },
  {
    key: "education",
    label: "Education",
    singular: "degree",
    model: "education",
    group: "Portfolio",
    description: "Degrees and institutions.",
    titleField: "institution",
    columns: ["degree", "field", "expected"],
    orderBy: [{ order: "asc" }],
    fields: [
      { name: "institution", label: "Institution", type: "text", required: true, max: 200 },
      { name: "degree", label: "Degree", type: "text", required: true, max: 40 },
      { name: "field", label: "Field", type: "text", required: true, max: 120 },
      { name: "location", label: "Location", type: "text", max: 120 },
      { name: "startDate", label: "Start date", type: "date" },
      { name: "endDate", label: "End / expected date", type: "date" },
      { name: "expected", label: "Expected (in progress)", type: "boolean" },
      { name: "notes", label: "Notes", type: "textarea", help: "One per line (honours, scholarships).", max: 2000 },
      order,
    ],
  },
  {
    key: "awards",
    label: "Awards",
    singular: "award",
    model: "award",
    group: "Portfolio",
    description: "Recognition — only real ones.",
    titleField: "title",
    columns: ["issuer", "order"],
    orderBy: [{ order: "asc" }],
    fields: [
      { name: "title", label: "Title", type: "text", required: true, max: 200 },
      { name: "issuer", label: "Issuer", type: "text", required: true, max: 200 },
      { name: "date", label: "Date", type: "date" },
      { name: "description", label: "Description", type: "textarea", max: 1000 },
      { name: "url", label: "URL", type: "url" },
      order,
    ],
  },
  {
    key: "skills",
    label: "Skills",
    singular: "skill",
    model: "skill",
    group: "Portfolio",
    description: "Technologies for the technology universe and favorite-tools orbit.",
    titleField: "name",
    columns: ["category", "proficiency", "favorite"],
    orderBy: [{ category: "asc" }, { order: "asc" }],
    fields: [
      { name: "name", label: "Name", type: "text", required: true, max: 60 },
      { name: "slug", label: "Slug", type: "slug", from: "name", required: true },
      { name: "category", label: "Category", type: "select", options: SKILL_CATEGORIES, required: true },
      { name: "proficiency", label: "Proficiency (1–5)", type: "number", min: 1, max: 5 },
      { name: "usedFor", label: "Used for", type: "textarea", help: "One use per line.", max: 1000 },
      { name: "areas", label: "Research areas", type: "relation", relation: "areas", wide: true },
      { name: "favorite", label: "Show in favorite tools", type: "boolean" },
      order,
    ],
  },
  {
    key: "areas",
    label: "Research areas",
    singular: "area",
    model: "researchArea",
    group: "Taxonomy",
    description: "Nodes of the research graph. Parents form the tree.",
    titleField: "name",
    columns: ["slug", "order"],
    orderBy: [{ order: "asc" }],
    fields: [
      { name: "name", label: "Name", type: "text", required: true, max: 80 },
      { name: "slug", label: "Slug", type: "slug", from: "name", required: true },
      { name: "parentId", label: "Parent area", type: "parent", relation: "areas" },
      { name: "description", label: "Description", type: "textarea", max: 500 },
      order,
    ],
  },
  {
    key: "categories",
    label: "Categories",
    singular: "category",
    model: "category",
    group: "Taxonomy",
    description: "Blog sections. Each post has at most one.",
    titleField: "name",
    columns: ["slug", "posts", "order"],
    orderBy: [{ order: "asc" }],
    fields: [
      { name: "name", label: "Name", type: "text", required: true, max: 60 },
      { name: "slug", label: "Slug", type: "slug", from: "name", required: true },
      { name: "description", label: "Description", type: "textarea", max: 300 },
      order,
    ],
  },
  {
    key: "tags",
    label: "Tags",
    singular: "tag",
    model: "tag",
    group: "Taxonomy",
    description: "Topics. Tags are also created on the fly from the post editor.",
    titleField: "name",
    columns: ["slug", "posts"],
    orderBy: [{ name: "asc" }],
    fields: [
      { name: "name", label: "Name", type: "text", required: true, max: 40 },
      { name: "slug", label: "Slug", type: "slug", from: "name", required: true },
    ],
  },
  {
    key: "now",
    label: "Currently",
    singular: "row",
    model: "nowItem",
    group: "Personal",
    description: "Rows of the homepage “Currently” block.",
    titleField: "label",
    columns: ["value", "order"],
    orderBy: [{ order: "asc" }],
    fields: [
      { name: "label", label: "Label", type: "text", required: true, max: 40 },
      { name: "value", label: "Value", type: "text", required: true, max: 160 },
      { name: "detail", label: "Detail", type: "text", max: 160 },
      { name: "icon", label: "Icon", type: "select", options: ["graduation", "microscope", "hammer", "book", "pin", "music", "spark", "dot"], required: true },
      order,
    ],
  },
  {
    key: "timeline",
    label: "Journey",
    singular: "milestone",
    model: "timelineEvent",
    group: "Personal",
    description: "The interactive timeline on the About page.",
    titleField: "title",
    columns: ["year", "kind"],
    orderBy: [{ year: "asc" }, { order: "asc" }],
    fields: [
      { name: "year", label: "Year", type: "number", required: true, min: 1990, max: 2100 },
      { name: "title", label: "Title", type: "text", required: true, max: 160 },
      { name: "kind", label: "Kind", type: "select", options: TIMELINE_KINDS, required: true },
      { name: "description", label: "Description", type: "textarea", max: 1000 },
      { name: "link", label: "Link", type: "url", help: "Internal paths like /projects/x work too." },
      order,
    ],
  },
  {
    key: "learning",
    label: "Currently learning",
    singular: "topic",
    model: "learningItem",
    group: "Personal",
    description: "Topics in progress.",
    titleField: "topic",
    columns: ["progress", "order"],
    orderBy: [{ order: "asc" }],
    fields: [
      { name: "topic", label: "Topic", type: "text", required: true, max: 80 },
      { name: "note", label: "Note", type: "text", max: 200 },
      { name: "progress", label: "Progress (%)", type: "number", min: 0, max: 100 },
      order,
    ],
  },
  {
    key: "facts",
    label: "Random facts",
    singular: "fact",
    model: "fact",
    group: "Personal",
    description: "The “random fact” widget.",
    titleField: "text",
    columns: ["order"],
    orderBy: [{ order: "asc" }],
    fields: [{ name: "text", label: "Fact", type: "textarea", required: true, max: 300 }, order],
  },
  {
    key: "books",
    label: "Books",
    singular: "book",
    model: "book",
    group: "Personal",
    description: "Bookshelf on the About page.",
    titleField: "title",
    columns: ["author", "status"],
    orderBy: [{ order: "asc" }],
    fields: [
      { name: "title", label: "Title", type: "text", required: true, max: 200 },
      { name: "author", label: "Author", type: "text", required: true, max: 200 },
      { name: "status", label: "Status", type: "select", options: BOOK_STATUSES, required: true },
      { name: "note", label: "Note", type: "textarea", max: 500 },
      { name: "url", label: "URL", type: "url" },
      order,
    ],
  },
  {
    key: "interests",
    label: "Interests",
    singular: "interest",
    model: "interest",
    group: "Personal",
    description: "Hobbies and interests.",
    titleField: "name",
    columns: ["order"],
    orderBy: [{ order: "asc" }],
    fields: [{ name: "name", label: "Name", type: "text", required: true, max: 80 }, { name: "description", label: "Description", type: "textarea", max: 400 }, order],
  },
  {
    key: "goals",
    label: "Goals",
    singular: "goal",
    model: "goal",
    group: "Personal",
    description: "Current goals.",
    titleField: "text",
    columns: ["horizon"],
    orderBy: [{ order: "asc" }],
    fields: [{ name: "text", label: "Goal", type: "textarea", required: true, max: 300 }, { name: "horizon", label: "Horizon", type: "text", required: true, max: 40 }, order],
  },
  {
    key: "social",
    label: "Social links",
    singular: "link",
    model: "socialLink",
    group: "Personal",
    description: "Footer, contact page and structured data.",
    titleField: "label",
    columns: ["platform", "visible", "order"],
    orderBy: [{ order: "asc" }],
    fields: [
      { name: "platform", label: "Platform", type: "select", options: ["github", "linkedin", "email", "x", "spotify", "website", "rss"], required: true },
      { name: "label", label: "Label", type: "text", required: true, max: 40 },
      { name: "url", label: "URL", type: "url", required: true },
      { name: "handle", label: "Handle", type: "text", max: 120 },
      { name: "visible", label: "Visible", type: "boolean" },
      order,
    ],
  },
];

export function getCollection(key: string) {
  return COLLECTIONS.find((c) => c.key === key);
}
