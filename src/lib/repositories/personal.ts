import { db } from "@/lib/db/client";

export const listNowItems = () => db.nowItem.findMany({ orderBy: { order: "asc" } });
export const listTimeline = () => db.timelineEvent.findMany({ orderBy: [{ year: "asc" }, { order: "asc" }] });
export const listLearning = () => db.learningItem.findMany({ orderBy: { order: "asc" } });
export const listFacts = () => db.fact.findMany({ orderBy: { order: "asc" } });
export const listBooks = () => db.book.findMany({ orderBy: [{ order: "asc" }] });
export const listInterests = () => db.interest.findMany({ orderBy: { order: "asc" } });
export const listGoals = () => db.goal.findMany({ orderBy: { order: "asc" } });
export const listSocialLinks = () => db.socialLink.findMany({ where: { visible: true }, orderBy: { order: "asc" } });

export async function getWidget(key: string) {
  return db.personalWidget.findUnique({ where: { key } });
}

export async function listWidgets() {
  return db.personalWidget.findMany({ orderBy: { order: "asc" } });
}

export async function saveWidgetCache(key: string, payload: unknown) {
  await db.personalWidget.updateMany({ where: { key }, data: { cache: JSON.stringify(payload), cachedAt: new Date() } });
}

export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
