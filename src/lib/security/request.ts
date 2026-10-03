import "server-only";
import { cookies, headers } from "next/headers";
import { COOKIE } from "@/lib/constants";
import { env } from "@/lib/env";
import { sha256 } from "./crypto";
import { verifyVisitorId } from "./visitor";

export { deviceFromUserAgent, isSameOrigin, sanitizePlainText } from "./http";

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

export async function ipHash() {
  return (await sha256(`${env.sessionSecret}:${await clientIp()}`)).slice(0, 24);
}

/** Returns the verified anonymous visitor id (minted by src/proxy.ts). */
export async function visitorId(): Promise<string | null> {
  const jar = await cookies();
  return verifyVisitorId(env.sessionSecret, jar.get(COOKIE.visitor)?.value);
}
