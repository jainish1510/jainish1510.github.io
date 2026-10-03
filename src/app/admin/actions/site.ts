"use server";

import "@/lib/events/register";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { bus } from "@/lib/events/bus";
import { saveSettings, SETTING_DEFS, type SettingKey } from "@/lib/settings";

export async function saveSettingsAction(values: Record<string, string>) {
  await requireAdmin();
  const allowed = new Map<string, (typeof SETTING_DEFS)[number]>(SETTING_DEFS.map((d) => [d.key, d]));
  const clean: Partial<Record<SettingKey, string>> = {};
  for (const [k, v] of Object.entries(values)) {
    const def = allowed.get(k);
    if (!def || typeof v !== "string") continue;
    if (v.length > 20000) return { ok: false as const, error: `${def.label} is too long.` };
    if (def.type === "boolean" && v !== "true" && v !== "false") continue;
    if (def.type === "nav") {
      const items = v
        .split("\n")
        .map((line) => line.split("|").map((s) => s.trim()))
        .filter(([label, href]) => label && href && /^\/[\w\-/]*$/.test(href!))
        .map(([label, href]) => ({ label, href }));
      clean[k as SettingKey] = JSON.stringify(items);
      continue;
    }
    if (k === "location.timezone") {
      try {
        new Intl.DateTimeFormat("en-US", { timeZone: v });
      } catch {
        return { ok: false as const, error: "Unknown time zone." };
      }
    }
    clean[k as SettingKey] = v;
  }
  await saveSettings(clean);
  await bus.emit("content.changed", { collection: "settings" });
  return { ok: true as const };
}

const spotifyConfig = z.object({ title: z.string().max(200), artist: z.string().max(200), album: z.string().max(200), url: z.string().max(500).optional(), durationMs: z.number().int().min(10000).max(3600000).optional() });

export async function saveWidgetAction(key: string, enabled: boolean, config?: unknown) {
  await requireAdmin();
  const data: { enabled: boolean; config?: string } = { enabled };
  if (key === "spotify" && config !== undefined) {
    const parsed = spotifyConfig.safeParse(config);
    if (!parsed.success) return { ok: false as const, error: "Check the demo track fields." };
    data.config = JSON.stringify(parsed.data);
  }
  await db.personalWidget.update({ where: { key }, data });
  await bus.emit("content.changed", { collection: "widgets" });
  return { ok: true as const };
}

export async function markMessageAction(id: string, read: boolean) {
  await requireAdmin();
  await db.contactMessage.update({ where: { id }, data: { read } });
}

export async function deleteMessageAction(id: string) {
  await requireAdmin();
  await db.contactMessage.delete({ where: { id } });
}
