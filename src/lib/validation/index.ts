import { z } from "zod";
import { COMMENT_LIMITS, MEDIA_FOLDERS, POST_STATUSES } from "@/lib/constants";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

export const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens");

export const postInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  subtitle: optionalText(300),
  slug: slugSchema,
  excerpt: optionalText(500),
  content: z.string().max(200_000, "Post is too long (200k characters max)"),
  status: z.enum(POST_STATUSES),
  featured: z.boolean().default(false),
  categoryId: optionalText(40),
  coverId: optionalText(40),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  areaIds: z.array(z.string().max(40)).max(12).default([]),
  publishedAt: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v ? new Date(v) : null))
    .refine((d) => d === null || !Number.isNaN(d.getTime()), "Invalid date"),
  seoTitle: optionalText(120),
  seoDescription: optionalText(300),
});
export type PostInput = z.infer<typeof postInputSchema>;

export const commentInputSchema = z.object({
  postId: z.string().min(1).max(40),
  parentId: z.string().max(40).optional().nullable(),
  name: z.string().trim().min(1, "Please add your name").max(COMMENT_LIMITS.name, `Name must be ${COMMENT_LIMITS.name} characters or fewer`),
  email: z
    .string()
    .trim()
    .max(COMMENT_LIMITS.email)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || z.email().safeParse(v).success, "That email doesn't look right"),
  content: z
    .string()
    .trim()
    .min(2, "Comment is too short")
    .max(COMMENT_LIMITS.content, `Comments are limited to ${COMMENT_LIMITS.content.toLocaleString()} characters`),
  /** Honeypot — real readers never see or fill this field. */
  website: z.string().max(0).optional().default(""),
  /** Milliseconds the form was open; instant submissions are bots. */
  elapsed: z.number().int().nonnegative().optional(),
});
export type CommentInput = z.infer<typeof commentInputSchema>;

export const contactInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.email().max(254),
  message: z.string().trim().min(10, "A little more detail, please").max(5000),
  website: z.string().max(0).optional().default(""),
});

export const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(256),
});

export const mediaUpdateSchema = z.object({
  alt: z.string().trim().max(300).default(""),
  caption: optionalText(500),
  folder: z.enum(MEDIA_FOLDERS),
});

export const commentModerationSchema = z.object({
  ids: z.array(z.string().max(40)).min(1).max(200),
  action: z.enum(["APPROVED", "REJECTED", "SPAM", "PENDING", "DELETE"]),
});

export function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    out[key] ??= issue.message;
  }
  return out;
}
