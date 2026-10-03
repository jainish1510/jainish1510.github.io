import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db/client";
import type { MediaFolder } from "@/lib/constants";
import { bus } from "@/lib/events/bus";
import { deleteMediaFile, storeUpload } from "@/lib/media/storage";

export async function listMedia(filter: { folder?: MediaFolder | "ALL"; q?: string; kind?: "image" | "video" } = {}) {
  const where: Prisma.MediaWhereInput = {
    ...(filter.folder && filter.folder !== "ALL" ? { folder: filter.folder } : {}),
    ...(filter.kind ? { mimeType: { startsWith: `${filter.kind}/` } } : {}),
    ...(filter.q ? { OR: [{ originalName: { contains: filter.q } }, { alt: { contains: filter.q } }, { caption: { contains: filter.q } }] } : {}),
  };
  return db.media.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { postCovers: true, projectCovers: true, projectGalleries: true, researchFigures: true } } },
  });
}

export async function createMedia(bytes: Uint8Array, meta: { originalName: string; folder: MediaFolder; alt?: string; caption?: string | null }) {
  const stored = await storeUpload(bytes, meta.folder);
  const media = await db.media.create({
    data: {
      ...stored,
      originalName: meta.originalName.replace(/[^\w.\- ]/g, "_").slice(0, 200) || stored.filename,
      folder: meta.folder,
      alt: meta.alt ?? "",
      caption: meta.caption ?? null,
    },
  });
  await bus.emit("media.changed", { id: media.id });
  return media;
}

export async function updateMedia(id: string, data: { alt: string; caption: string | null; folder: MediaFolder }) {
  const media = await db.media.update({ where: { id }, data });
  await bus.emit("media.changed", { id });
  return media;
}

export async function deleteMedia(id: string) {
  const media = await db.media.delete({ where: { id } });
  await deleteMediaFile(media.path);
  await bus.emit("media.changed", { id });
  return media;
}
