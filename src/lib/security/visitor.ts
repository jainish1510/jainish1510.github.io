import { hmac, randomToken, safeEqual } from "./crypto";

/**
 * Anonymous visitor identity: `<id>.<signature>`. Readers never create an
 * account; the signed cookie is what makes a like or bookmark idempotent per
 * browser without letting anyone forge another reader's id.
 */
export async function mintVisitorId(secret: string) {
  const id = randomToken(16);
  return `${id}.${(await hmac(secret, id)).slice(0, 32)}`;
}

export async function verifyVisitorId(secret: string, value: string | undefined | null): Promise<string | null> {
  if (!value) return null;
  const [id, signature] = value.split(".");
  if (!id || !signature || !/^[a-f0-9]{32}$/.test(id)) return null;
  const expected = (await hmac(secret, id)).slice(0, 32);
  return safeEqual(expected, signature) ? id : null;
}
