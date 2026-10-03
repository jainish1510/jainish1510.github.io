import { z } from "zod";
import { slugSchema } from "@/lib/validation";
import type { CollectionDef, FieldDef } from "./collections";

const urlLike = z
  .string()
  .trim()
  .max(500)
  .refine((v) => /^(https?:\/\/|mailto:|\/)/.test(v), "Use an https://, mailto: or /relative link");

const id = z.string().regex(/^[a-z0-9]{10,40}$/i);

/** Factory: field definition → zod schema. Empty optional values become null. */
function fieldSchema(f: FieldDef): z.ZodType {
  const optional = (s: z.ZodType) =>
    f.required ? s : z.preprocess((v) => (v === "" || v === undefined ? null : v), s.nullable());
  switch (f.type) {
    case "text":
    case "textarea":
    case "markdown":
      return optional(z.string().trim().min(f.required ? 1 : 0, `${f.label} is required`).max(f.max ?? 2000));
    case "slug":
      return slugSchema;
    case "url":
      return optional(urlLike);
    case "number":
      return z.preprocess((v) => (v === "" || v === null || v === undefined ? (f.required ? undefined : 0) : Number(v)), z.number().int().min(f.min ?? -1e9).max(f.max ?? 1e9));
    case "boolean":
      return z.boolean().default(false);
    case "select":
      return optional(z.enum(f.options as [string, ...string[]]));
    case "date":
      return optional(
        z
          .string()
          .refine((v) => !Number.isNaN(new Date(v).getTime()), "Invalid date")
          .transform((v) => new Date(v.length === 10 ? `${v}T12:00:00Z` : v)),
      );
    case "media":
    case "parent":
      return optional(id);
    case "relation":
    case "gallery":
      return z.array(id).max(100).default([]);
  }
}

export function collectionSchema(def: CollectionDef) {
  return z.object(Object.fromEntries(def.fields.map((f) => [f.name, fieldSchema(f)])));
}

/** Turn validated values into Prisma create/update data (relations → set/connect). */
export function toPrismaData(def: CollectionDef, values: Record<string, unknown>, mode: "create" | "update") {
  const data: Record<string, unknown> = {};
  for (const f of def.fields) {
    const v = values[f.name];
    if (f.type === "relation" || f.type === "gallery") {
      const ids = (v as string[]).map((x) => ({ id: x }));
      data[f.name] = mode === "create" ? { connect: ids } : { set: ids };
    } else {
      data[f.name] = v;
    }
  }
  return data;
}
