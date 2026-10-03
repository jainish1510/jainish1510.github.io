import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { imageSize } from "image-size";
import { MEDIA_LIMITS, type MediaFolder } from "@/lib/constants";
import { randomToken } from "@/lib/security/crypto";
import { detectFileType } from "./detect";

/**
 * Uploads live in data/uploads (next to the SQLite file) and are served by
 * src/app/media/[...path]/route.ts. This keeps all mutable state in one
 * directory that is easy to back up, and works with `next start`, which
 * does not serve files added to /public after the build.
 */
export const UPLOAD_ROOT = path.resolve(/* turbopackIgnore: true */ process.cwd(), process.env.UPLOAD_DIR ?? "data/uploads");

export class UploadError extends Error {}

export type StoredFile = {
  filename: string;
  path: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
};

export async function storeUpload(bytes: Uint8Array, folder: MediaFolder): Promise<StoredFile> {
  if (bytes.byteLength === 0) throw new UploadError("The file is empty.");
  if (bytes.byteLength > MEDIA_LIMITS.maxBytes) throw new UploadError(`Files must be under ${MEDIA_LIMITS.maxBytes / 1024 / 1024} MB.`);
  const type = detectFileType(bytes);
  if (!type || !(MEDIA_LIMITS.mimeTypes as readonly string[]).includes(type.mime)) {
    throw new UploadError("Unsupported file type. Use PNG, JPEG, WebP, GIF, AVIF, MP4 or WebM.");
  }
  let width: number | null = null;
  let height: number | null = null;
  if (type.kind === "image") {
    try {
      const dims = imageSize(bytes);
      width = dims.width ?? null;
      height = dims.height ?? null;
    } catch {
      throw new UploadError("The image appears to be corrupted.");
    }
  }
  const dir = folder.toLowerCase();
  const filename = `${Date.now().toString(36)}-${randomToken(6)}.${type.ext}`;
  await mkdir(path.join(UPLOAD_ROOT, dir), { recursive: true });
  await writeFile(path.join(UPLOAD_ROOT, dir, filename), bytes);
  return { filename, path: `/media/${dir}/${filename}`, mimeType: type.mime, size: bytes.byteLength, width, height };
}

const SAFE_SEGMENT = /^[a-z0-9][a-z0-9._-]*$/i;

/** Resolve a public /media path to a file on disk, refusing traversal. */
export function resolveMediaPath(segments: string[]) {
  if (segments.length !== 2 || !segments.every((s) => SAFE_SEGMENT.test(s) && !s.includes(".."))) return null;
  const full = path.join(UPLOAD_ROOT, ...segments);
  return full.startsWith(UPLOAD_ROOT + path.sep) ? full : null;
}

export async function readMediaFile(segments: string[]) {
  const full = resolveMediaPath(segments);
  if (!full) return null;
  try {
    const info = await stat(/* turbopackIgnore: true */ full);
    return { data: await readFile(/* turbopackIgnore: true */ full), size: info.size, mtime: info.mtime };
  } catch {
    return null;
  }
}

export async function deleteMediaFile(publicPath: string) {
  const segments = publicPath.replace(/^\/media\//, "").split("/");
  const full = resolveMediaPath(segments);
  if (full) await unlink(full).catch(() => {});
}
