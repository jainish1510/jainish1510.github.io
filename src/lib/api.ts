import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/security/rate-limit";
import { ipHash, isSameOrigin, visitorId } from "@/lib/security/request";

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function problem(status: number, message: string, extra?: object) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

type GuardOptions = { limit?: { key: string; limit: number; windowMs: number }; mutation?: boolean; requireVisitor?: boolean };

/**
 * Shared preamble for public route handlers: CSRF origin check for
 * mutations, per-IP rate limiting, and the signed visitor id.
 */
export async function guard(request: Request, opts: GuardOptions) {
  if (opts.mutation && !isSameOrigin(request)) return { error: problem(403, "Cross-origin request blocked.") } as const;
  const ip = await ipHash();
  if (opts.limit) {
    const r = rateLimit(`${opts.limit.key}:${ip}`, opts.limit.limit, opts.limit.windowMs);
    if (!r.ok) {
      return { error: problem(429, "Too many requests — slow down a little.", { retryAfterMs: r.retryAfterMs }) } as const;
    }
  }
  const vid = await visitorId();
  if (opts.requireVisitor && !vid) return { error: problem(400, "Missing visitor identity. Enable cookies and reload.") } as const;
  return { ip, visitorId: vid } as const;
}

export async function readJson<T extends z.ZodType>(request: Request, schema: T, maxBytes = 20_000): Promise<{ data: z.infer<T> } | { error: NextResponse }> {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > maxBytes) return { error: problem(413, "Request body too large.") };
  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > maxBytes) return { error: problem(413, "Request body too large.") };
    body = JSON.parse(text);
  } catch {
    return { error: problem(400, "Invalid JSON.") };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: problem(422, first?.message ?? "Invalid input.", { field: first?.path.join(".") }) };
  }
  return { data: parsed.data };
}
