import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { COOKIE, SESSION_TTL_MS } from "@/lib/constants";
import { env } from "@/lib/env";
import { LIMITS, rateLimit } from "@/lib/security/rate-limit";
import { ipHash } from "@/lib/security/request";
import { verifyPassword } from "./password";
import { createSession, deleteSession, findSession } from "./session";

export type AdminUser = { id: string; email: string; name: string; role: string };

/** Memoised per request. */
export const getCurrentUser = cache(async (): Promise<AdminUser | null> => {
  const jar = await cookies();
  const session = await findSession(jar.get(COOKIE.session)?.value);
  return session?.user ?? null;
});

/** Authorization guard for every admin page, action and route handler. */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/admin/login");
  return user;
}

/** Variant for route handlers, where a redirect is the wrong response. */
export async function getAdminOrNull() {
  const user = await getCurrentUser();
  return user && user.role === "ADMIN" ? user : null;
}

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function login(email: string, password: string): Promise<LoginResult> {
  const ip = await ipHash();
  const limited = rateLimit(`login:${ip}`, LIMITS.login.limit, LIMITS.login.windowMs);
  // Also count recent failures in the database so restarts don't reset the limit.
  const recentFailures = await db.loginAttempt.count({
    where: { ipHash: ip, success: false, createdAt: { gt: new Date(Date.now() - LIMITS.login.windowMs) } },
  });
  if (!limited.ok || recentFailures >= LIMITS.login.limit) {
    return { ok: false, error: "Too many attempts. Try again in a few minutes." };
  }

  const normalized = email.trim().toLowerCase();
  const user = await db.user.findUnique({ where: { email: normalized } });
  // Always run a hash comparison so timing doesn't reveal which emails exist.
  const valid = await verifyPassword(
    password,
    user?.passwordHash ?? "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==",
  );
  await db.loginAttempt.create({ data: { ipHash: ip, email: normalized.slice(0, 254), success: Boolean(user && valid) } });
  if (!user || !valid) return { ok: false, error: "Incorrect email or password." };

  const h = await headers();
  const { token } = await createSession(user.id, h.get("user-agent"));
  const jar = await cookies();
  jar.set(COOKIE.session, token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
  return { ok: true };
}

export async function logout() {
  const jar = await cookies();
  await deleteSession(jar.get(COOKIE.session)?.value);
  jar.delete(COOKIE.session);
}
