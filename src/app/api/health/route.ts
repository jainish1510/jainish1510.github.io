import { db } from "@/lib/db/client";
import { env } from "@/lib/env";
import { json } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = performance.now();
  let database: "connected" | "unavailable" = "unavailable";
  let posts = 0;
  try {
    posts = await db.post.count({ where: { status: "PUBLISHED" } });
    database = "connected";
  } catch {
    database = "unavailable";
  }
  return json(
    {
      ok: database === "connected",
      database,
      latencyMs: Math.round(performance.now() - started),
      posts,
      integrations: { github: Boolean(env.github.token), spotify: env.spotify.configured },
      uptimeS: Math.round(process.uptime()),
      node: process.versions.node,
    },
    { status: database === "connected" ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
