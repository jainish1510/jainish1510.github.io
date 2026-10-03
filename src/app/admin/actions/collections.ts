"use server";

import "@/lib/events/register";
import { requireAdmin } from "@/lib/auth";
import { getCollection } from "@/lib/admin/collections";
import { deleteCollectionItem, saveCollectionItem } from "@/lib/repositories/collections";

export async function saveCollectionAction(key: string, id: string | null, values: unknown) {
  await requireAdmin();
  const def = getCollection(key);
  if (!def) return { ok: false as const, errors: { form: "Unknown collection." } };
  return saveCollectionItem(def, id, values);
}

export async function deleteCollectionAction(key: string, id: string) {
  await requireAdmin();
  const def = getCollection(key);
  if (!def) throw new Error("Unknown collection");
  try {
    await deleteCollectionItem(def, id);
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Couldn't delete — it may still be referenced elsewhere." };
  }
}
