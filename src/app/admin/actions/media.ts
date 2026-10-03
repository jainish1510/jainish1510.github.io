"use server";

import "@/lib/events/register";
import { requireAdmin } from "@/lib/auth";
import type { MediaFolder } from "@/lib/constants";
import { deleteMedia, listMedia, updateMedia } from "@/lib/repositories/media";
import { fieldErrors, mediaUpdateSchema } from "@/lib/validation";

export async function listMediaAction(filter: { folder?: MediaFolder | "ALL"; q?: string; kind?: "image" | "video" } = {}) {
  await requireAdmin();
  const items = await listMedia(filter);
  return items.map((m) => ({
    id: m.id,
    path: m.path,
    originalName: m.originalName,
    mimeType: m.mimeType,
    size: m.size,
    width: m.width,
    height: m.height,
    alt: m.alt,
    caption: m.caption,
    folder: m.folder,
    createdAt: m.createdAt.toISOString(),
    usage: m._count.postCovers + m._count.projectCovers + m._count.projectGalleries + m._count.researchFigures,
  }));
}

export type MediaItem = Awaited<ReturnType<typeof listMediaAction>>[number];

export async function updateMediaAction(id: string, raw: unknown) {
  await requireAdmin();
  const parsed = mediaUpdateSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, errors: fieldErrors(parsed.error) };
  await updateMedia(id, parsed.data);
  return { ok: true as const };
}

export async function deleteMediaAction(id: string) {
  await requireAdmin();
  await deleteMedia(id);
  return { ok: true as const };
}
