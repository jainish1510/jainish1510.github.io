import { db } from "@/lib/db/client";
import { collectionSchema, toPrismaData } from "@/lib/admin/collection-schema";
import type { CollectionDef } from "@/lib/admin/collections";
import { bus } from "@/lib/events/bus";
import { fieldErrors } from "@/lib/validation";

/**
 * Generic repository over the collection definitions. Prisma delegates share
 * the same method shapes, so one implementation serves every collection.
 */
type Delegate = {
  findMany(args: object): Promise<Record<string, unknown>[]>;
  create(args: object): Promise<Record<string, unknown>>;
  update(args: object): Promise<Record<string, unknown>>;
  delete(args: object): Promise<Record<string, unknown>>;
};

const delegate = (def: CollectionDef) => (db as unknown as Record<string, Delegate>)[def.model]!;

export async function listCollectionItems(def: CollectionDef) {
  const include = Object.fromEntries(def.fields.filter((f) => f.type === "relation" || f.type === "gallery").map((f) => [f.name, { select: { id: true } }]));
  const rows = await delegate(def).findMany({ orderBy: def.orderBy, ...(Object.keys(include).length ? { include } : {}) });
  // Flatten relations to id arrays for the form.
  return rows.map((row) => {
    const out: Record<string, unknown> = { ...row };
    for (const key of Object.keys(include)) out[key] = ((row[key] as { id: string }[]) ?? []).map((r) => r.id);
    return out;
  });
}

export type SaveResult = { ok: true; id: string } | { ok: false; errors: Record<string, string> };

export async function saveCollectionItem(def: CollectionDef, id: string | null, raw: unknown): Promise<SaveResult> {
  const parsed = collectionSchema(def).safeParse(raw);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const values = parsed.data as Record<string, unknown>;
  if (def.key === "areas" && id && values.parentId === id) return { ok: false, errors: { parentId: "An area can't be its own parent." } };
  try {
    const row = id
      ? await delegate(def).update({ where: { id }, data: toPrismaData(def, values, "update") })
      : await delegate(def).create({ data: toPrismaData(def, values, "create") });
    await bus.emit("content.changed", { collection: def.key });
    return { ok: true, id: row.id as string };
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "P2002") return { ok: false, errors: { form: "Something with that name or slug already exists." } };
    throw error;
  }
}

export async function deleteCollectionItem(def: CollectionDef, id: string) {
  await delegate(def).delete({ where: { id } });
  await bus.emit("content.changed", { collection: def.key });
}

export async function relationOptions() {
  const [skills, areas, projects, research, media] = await Promise.all([
    db.skill.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.researchArea.findMany({ select: { id: true, name: true }, orderBy: { order: "asc" } }),
    db.project.findMany({ select: { id: true, title: true }, orderBy: { order: "asc" } }),
    db.researchProject.findMany({ select: { id: true, title: true }, orderBy: { order: "asc" } }),
    db.media.findMany({ where: { mimeType: { startsWith: "image/" } }, select: { id: true, path: true, alt: true }, orderBy: { createdAt: "desc" } }),
  ]);
  return {
    skills: skills.map((s) => ({ id: s.id, label: s.name })),
    areas: areas.map((a) => ({ id: a.id, label: a.name })),
    projects: projects.map((p) => ({ id: p.id, label: p.title })),
    research: research.map((r) => ({ id: r.id, label: r.title })),
    media,
  };
}

export type RelationOptions = Awaited<ReturnType<typeof relationOptions>>;
