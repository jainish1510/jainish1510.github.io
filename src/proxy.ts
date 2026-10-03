import { NextResponse, type NextRequest } from "next/server";
import { COOKIE } from "@/lib/constants";
import { mintVisitorId, verifyVisitorId } from "@/lib/security/visitor";

const SECRET = process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32 ? process.env.SESSION_SECRET : "development-only-secret-change-me-0000000000";
const YEAR = 60 * 60 * 24 * 365;

/**
 * Runs before every page request:
 *  1. Optimistic admin gate — no session cookie, no admin page. (The real
 *     authorization check happens server-side in requireAdmin().)
 *  2. Mints the signed anonymous visitor id used for likes, bookmarks and
 *     view de-duplication, and forwards it so this very request can use it.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login") && !request.cookies.get(COOKIE.session)?.value) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  const existing = request.cookies.get(COOKIE.visitor)?.value;
  if (await verifyVisitorId(SECRET, existing)) return NextResponse.next();

  const visitor = await mintVisitorId(SECRET);
  request.cookies.set(COOKIE.visitor, visitor);
  const response = NextResponse.next({ request: { headers: request.headers } });
  response.cookies.set(COOKIE.visitor, visitor, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: YEAR,
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|media/|favicon.ico|icon|apple-icon|opengraph-image|robots.txt|sitemap.xml|rss.xml).*)"],
};
