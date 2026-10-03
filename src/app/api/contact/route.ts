import { guard, json, readJson } from "@/lib/api";
import { db } from "@/lib/db/client";
import { LIMITS } from "@/lib/security/rate-limit";
import { sanitizePlainText } from "@/lib/security/request";
import { contactInputSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const g = await guard(request, { mutation: true, limit: { key: "contact", ...LIMITS.contact } });
  if ("error" in g) return g.error;
  const body = await readJson(request, contactInputSchema, 12_000);
  if ("error" in body) return body.error;
  if (body.data.website) return json({ ok: true }); // honeypot
  await db.contactMessage.create({
    data: {
      name: sanitizePlainText(body.data.name, 80),
      email: body.data.email.toLowerCase(),
      message: sanitizePlainText(body.data.message, 5000),
      ipHash: g.ip,
    },
  });
  return json({ ok: true }, { status: 201 });
}
