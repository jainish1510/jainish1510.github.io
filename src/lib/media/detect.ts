/**
 * File-type detection from magic bytes. The browser-supplied MIME type and
 * extension are never trusted for uploads.
 */
export type DetectedType = { mime: string; ext: string; kind: "image" | "video" };

const startsWith = (buf: Uint8Array, bytes: number[], offset = 0) => bytes.every((b, i) => buf[offset + i] === b);
const ascii = (buf: Uint8Array, start: number, end: number) => String.fromCharCode(...buf.subarray(start, end));

export function detectFileType(buf: Uint8Array): DetectedType | null {
  if (buf.length < 12) return null;
  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { mime: "image/png", ext: "png", kind: "image" };
  if (startsWith(buf, [0xff, 0xd8, 0xff])) return { mime: "image/jpeg", ext: "jpg", kind: "image" };
  if (ascii(buf, 0, 6) === "GIF87a" || ascii(buf, 0, 6) === "GIF89a") return { mime: "image/gif", ext: "gif", kind: "image" };
  if (ascii(buf, 0, 4) === "RIFF" && ascii(buf, 8, 12) === "WEBP") return { mime: "image/webp", ext: "webp", kind: "image" };
  if (ascii(buf, 4, 8) === "ftyp") {
    const brand = ascii(buf, 8, 12);
    if (brand === "avif" || brand === "avis") return { mime: "image/avif", ext: "avif", kind: "image" };
    if (["isom", "iso2", "mp41", "mp42", "avc1", "M4V ", "dash"].includes(brand)) return { mime: "video/mp4", ext: "mp4", kind: "video" };
  }
  if (startsWith(buf, [0x1a, 0x45, 0xdf, 0xa3])) return { mime: "video/webm", ext: "webm", kind: "video" };
  return null;
}
