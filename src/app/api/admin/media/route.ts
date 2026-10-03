import { getAdminOrNull } from "@/lib/auth";
import { json, problem } from "@/lib/api";
import { MEDIA_FOLDERS, MEDIA_LIMITS, type MediaFolder } from "@/lib/constants";
import { UploadError } from "@/lib/media/storage";
import { createMedia } from "@/lib/repositories/media";
import { LIMITS, rateLimit } from "@/lib/security/rate-limit";
import { isSameOrigin } from "@/lib/security/request";

/** Admin-only multipart upload. Type is detected from bytes, not the filename. */
export async function POST(request: Request) {
  const admin = await getAdminOrNull();
  if (!admin) return problem(401, "Not signed in.");
  if (!isSameOrigin(request)) return problem(403, "Cross-origin request blocked.");
  if (!rateLimit(`upload:${admin.id}`, LIMITS.upload.limit, LIMITS.upload.windowMs).ok) return problem(429, "Too many uploads.");
  if (Number(request.headers.get("content-length") ?? 0) > MEDIA_LIMITS.maxBytes + 64_000) return problem(413, "File too large.");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return problem(400, "Invalid upload.");
  }
  const file = form.get("file");
  const folder = String(form.get("folder") ?? "MISC") as MediaFolder;
  if (!(file instanceof File)) return problem(400, "No file received.");
  if (!MEDIA_FOLDERS.includes(folder)) return problem(400, "Unknown folder.");
  try {
    const media = await createMedia(new Uint8Array(await file.arrayBuffer()), {
      originalName: file.name,
      folder,
      alt: String(form.get("alt") ?? "").slice(0, 300),
    });
    return json({ media }, { status: 201 });
  } catch (error) {
    if (error instanceof UploadError) return problem(415, error.message);
    throw error;
  }
}
