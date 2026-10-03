import { db } from "@/lib/db/client";
import { SESSION_TTL_MS } from "@/lib/constants";
import { randomToken, sha256 } from "@/lib/security/crypto";

/**
 * Opaque database sessions: the cookie holds a random token, the database
 * holds only its SHA-256. Revoking a session is deleting a row.
 */
export async function createSession(userId: string, userAgent?: string | null) {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.session.create({
    data: { userId, tokenHash: await sha256(token), userAgent: userAgent?.slice(0, 255), expiresAt },
  });
  return { token, expiresAt };
}

export async function findSession(token: string | undefined | null) {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: await sha256(token) },
    include: { user: { select: { id: true, email: true, name: true, role: true } } },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return session;
}

export async function deleteSession(token: string | undefined | null) {
  if (!token) return;
  await db.session.deleteMany({ where: { tokenHash: await sha256(token) } });
}

export async function purgeExpiredSessions() {
  await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}
