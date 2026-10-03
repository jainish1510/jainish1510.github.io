/** Pure request helpers (no Next.js imports — unit-testable). */

export function deviceFromUserAgent(ua: string | null | undefined): "desktop" | "mobile" | "tablet" | "bot" {
  const s = (ua ?? "").toLowerCase();
  if (/bot|crawler|spider|crawling|headless|preview/.test(s)) return "bot";
  if (/ipad|tablet|playbook|silk/.test(s) || (/android/.test(s) && !/mobile/.test(s))) return "tablet";
  if (/mobi|iphone|android/.test(s)) return "mobile";
  return "desktop";
}

/**
 * CSRF defence for JSON route handlers: mutations must come from our own
 * origin. (Server Actions already get this check from Next.js.)
 */
export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return request.headers.get("sec-fetch-site") === "same-origin";
  try {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function sanitizePlainText(input: string, max: number) {
  return input
    .normalize("NFKC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩]/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);
}
