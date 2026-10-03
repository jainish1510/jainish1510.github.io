export const POST_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export const COMMENT_STATUSES = ["PENDING", "APPROVED", "REJECTED", "SPAM"] as const;
export type CommentStatus = (typeof COMMENT_STATUSES)[number];

export const PROJECT_CATEGORIES = ["ML", "RESEARCH", "WEB", "CLOUD", "AI", "SYSTEMS"] as const;
export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export const PROJECT_STATUSES = ["ACTIVE", "COMPLETED", "PROTOTYPE", "ARCHIVED"] as const;
export const RESEARCH_STATUSES = ["ONGOING", "COMPLETED", "PLANNED"] as const;
export const EXPERIENCE_TYPES = ["WORK", "INTERNSHIP", "RESEARCH", "LEADERSHIP"] as const;
export const TIMELINE_KINDS = ["EDUCATION", "RESEARCH", "WORK", "BUILD", "COMMUNITY", "MILESTONE"] as const;
export const BOOK_STATUSES = ["READING", "READ", "QUEUED"] as const;

export const SKILL_CATEGORIES = [
  "LANGUAGES",
  "FRAMEWORKS",
  "ML",
  "CLOUD",
  "DATABASES",
  "INFRASTRUCTURE",
  "RESEARCH",
  "TOOLS",
] as const;
export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

export const SKILL_CATEGORY_LABELS: Record<SkillCategory, string> = {
  LANGUAGES: "Languages",
  FRAMEWORKS: "Frameworks",
  ML: "Machine Learning",
  CLOUD: "Cloud",
  DATABASES: "Databases",
  INFRASTRUCTURE: "Infrastructure",
  RESEARCH: "Research",
  TOOLS: "Tools",
};

export const MEDIA_FOLDERS = ["BLOG", "PROJECTS", "RESEARCH", "PROFILE", "MISC"] as const;
export type MediaFolder = (typeof MEDIA_FOLDERS)[number];

export const MEDIA_LIMITS = {
  maxBytes: 12 * 1024 * 1024,
  /** SVG is deliberately excluded: it can carry script. */
  mimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif", "video/mp4", "video/webm"] as const,
};

export const COMMENT_LIMITS = { name: 80, email: 254, content: 5000, maxDepth: 2 } as const;

/** Repeat views from the same visitor inside this window are not counted. */
export const VIEW_DEDUP_WINDOW_MS = 6 * 60 * 60 * 1000;

export const COOKIE = {
  session: "studio_session",
  visitor: "studio_vid",
} as const;

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
