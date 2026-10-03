"use client";

import { ExternalLink, ImagePlus, Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { deleteCollectionAction, saveCollectionAction } from "@/app/admin/actions/collections";
import { MediaPicker } from "@/components/admin/media-picker";
import { Markdown } from "@/components/content/markdown";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { Switch } from "@/components/ui/switch";
import { getCollection, type FieldDef } from "@/lib/admin/collections";
import { slugify } from "@/lib/content/text";
import type { RelationOptions } from "@/lib/repositories/collections";
import { cn } from "@/lib/utils";

type Item = Record<string, unknown> & { id: string };
type Values = Record<string, unknown>;

function emptyValues(fields: FieldDef[]): Values {
  return Object.fromEntries(
    fields.map((f) => [f.name, f.type === "boolean" ? (f.name === "visible" ? true : false) : f.type === "relation" || f.type === "gallery" ? [] : f.type === "number" ? (f.name === "proficiency" ? 3 : 0) : ""]),
  );
}

function toFormValues(fields: FieldDef[], item: Item): Values {
  return Object.fromEntries(
    fields.map((f) => {
      const v = item[f.name];
      if (f.type === "date") return [f.name, typeof v === "string" ? v.slice(0, 10) : ""];
      if (v === null || v === undefined) return [f.name, f.type === "relation" || f.type === "gallery" ? [] : f.type === "boolean" ? false : ""];
      return [f.name, v];
    }),
  );
}

function cell(v: unknown) {
  if (typeof v === "boolean") return v ? <Badge tone="accent">yes</Badge> : <span className="text-subtle">—</span>;
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) return new Date(v).toLocaleDateString();
  if (v === null || v === undefined || v === "") return <span className="text-subtle">—</span>;
  return String(v).toLowerCase() === String(v) || typeof v === "number" ? String(v) : String(v);
}

export function CollectionManager({ collectionKey, items, options }: { collectionKey: string; items: Item[]; options: RelationOptions }) {
  const def = getCollection(collectionKey)!;
  const router = useRouter();
  const [editing, setEditing] = useState<{ id: string | null; values: Values } | null>(null);
  const [q, setQ] = useState("");
  const filtered = useMemo(() => (q ? items.filter((i) => String(i[def.titleField] ?? "").toLowerCase().includes(q.toLowerCase())) : items), [items, q, def.titleField]);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-subtle" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${def.label.toLowerCase()}…`} className="w-64 pl-8" aria-label="Search" />
        </div>
        <span className="text-xs text-subtle">{items.length} total</span>
        <Button variant="primary" className="ml-auto" onClick={() => setEditing({ id: null, values: emptyValues(def.fields) })}>
          <Plus /> New {def.singular}
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={`No ${def.label.toLowerCase()} yet.`} description="Create the first one." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-surface">
              <tr className="text-left font-mono text-[0.625rem] uppercase tracking-[0.12em] text-subtle">
                <th className="px-4 py-2.5 font-normal">{def.fields.find((f) => f.name === def.titleField)?.label}</th>
                {def.columns.map((c) => (
                  <th key={c} className="hidden px-4 py-2.5 font-normal md:table-cell">
                    {def.fields.find((f) => f.name === c)?.label ?? c}
                  </th>
                ))}
                <th className="w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-surface/60">
                  <td className="max-w-md px-4 py-2.5">
                    <button type="button" onClick={() => setEditing({ id: item.id, values: toFormValues(def.fields, item) })} className="line-clamp-2 text-left text-fg hover:text-accent-strong">
                      {String(item[def.titleField] ?? "Untitled")}
                    </button>
                    {item.isPlaceholder ? <Badge tone="warm" className="mt-1">placeholder</Badge> : null}
                  </td>
                  {def.columns.map((c) => (
                    <td key={c} className="hidden px-4 py-2.5 text-xs text-muted md:table-cell">
                      {cell(item[c])}
                    </td>
                  ))}
                  <td className="px-2 py-2.5 text-right">
                    {def.publicPath ? (
                      <Link href={def.publicPath(item)} target="_blank" className="inline-block rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-fg" aria-label="View on site">
                        <ExternalLink className="size-3.5" />
                      </Link>
                    ) : null}
                    <button type="button" onClick={() => setEditing({ id: item.id, values: toFormValues(def.fields, item) })} className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-fg" aria-label="Edit">
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Delete"
                      className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-danger"
                      onClick={async () => {
                        if (!confirm(`Delete “${String(item[def.titleField])}”?`)) return;
                        const r = await deleteCollectionAction(def.key, item.id);
                        if (r.ok) {
                          toast.success("Deleted");
                          router.refresh();
                        } else toast.error(r.error);
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {editing ? (
          <ItemForm
            key={editing.id ?? "new"}
            collectionKey={collectionKey}
            id={editing.id}
            initial={editing.values}
            options={options}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              router.refresh();
            }}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}

function ItemForm({ collectionKey, id, initial, options, onClose, onSaved }: { collectionKey: string; id: string | null; initial: Values; options: RelationOptions; onClose: () => void; onSaved: () => void }) {
  const def = getCollection(collectionKey)!;
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(id));
  const set = (name: string, v: unknown) =>
    setValues((prev) => {
      const next = { ...prev, [name]: v };
      for (const f of def.fields) if (f.type === "slug" && f.from === name && !slugTouched) next[f.name] = slugify(String(v));
      return next;
    });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const r = await saveCollectionAction(def.key, id, values);
    setSaving(false);
    if (r.ok) {
      toast.success(`${def.singular[0]!.toUpperCase()}${def.singular.slice(1)} saved`);
      onSaved();
    } else {
      setErrors(r.errors);
      toast.error(Object.values(r.errors)[0] ?? "Check the form");
    }
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50" onClick={onClose} aria-hidden />
      <motion.form
        role="dialog"
        aria-modal="true"
        aria-label={`${id ? "Edit" : "New"} ${def.singular}`}
        onSubmit={submit}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 40 }}
        className="fixed inset-y-0 right-0 z-50 flex w-[min(44rem,100vw)] flex-col border-l border-line-strong bg-bg-raised shadow-2xl"
        noValidate
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-base font-medium text-fg">
            {id ? "Edit" : "New"} {def.singular}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1 text-muted hover:text-fg">
            <X className="size-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {errors.form ? <p className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{errors.form}</p> : null}
          <div className="grid gap-5 sm:grid-cols-2">
            {def.fields.map((f) => (
              <div key={f.name} className={cn(f.wide || f.type === "markdown" || f.type === "textarea" ? "sm:col-span-2" : "")}>
                <FieldInput field={f} value={values[f.name]} error={errors[f.name]} options={options} onChange={(v) => (f.type === "slug" && setSlugTouched(true), set(f.name, v))} />
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-6 py-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : null} Save
          </Button>
        </div>
      </motion.form>
    </>
  );
}

function FieldInput({ field: f, value, error, options, onChange }: { field: FieldDef; value: unknown; error?: string; options: RelationOptions; onChange: (v: unknown) => void }) {
  const id = `f-${f.name}`;
  const [preview, setPreview] = useState(false);
  const [picker, setPicker] = useState(false);
  const label = `${f.label}${f.required ? " *" : ""}`;

  switch (f.type) {
    case "boolean":
      return (
        <label className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2.5 text-sm text-fg-2">
          {f.label}
          <Switch checked={Boolean(value)} onCheckedChange={onChange} />
        </label>
      );
    case "select":
      return (
        <Field label={label} htmlFor={id} error={error} hint={f.help}>
          <Select id={id} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
            {!f.required ? <option value="">—</option> : <option value="" disabled>Choose…</option>}
            {f.options!.map((o) => (
              <option key={o} value={o}>
                {o.charAt(0) + o.slice(1).toLowerCase()}
              </option>
            ))}
          </Select>
        </Field>
      );
    case "textarea":
      return (
        <Field label={label} htmlFor={id} error={error} hint={f.help}>
          <Textarea id={id} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} maxLength={f.max} />
        </Field>
      );
    case "markdown":
      return (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor={id} className="text-xs font-medium text-fg-2">
              {label} <span className="font-normal text-subtle">· markdown</span>
            </label>
            <button type="button" onClick={() => setPreview((p) => !p)} className="text-xs text-muted hover:text-fg">
              {preview ? "Edit" : "Preview"}
            </button>
          </div>
          {preview ? (
            <div className="rounded-lg border border-line bg-bg p-4">
              <Markdown source={String(value ?? "") || "_Nothing yet._"} className="text-base" />
            </div>
          ) : (
            <Textarea id={id} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className="min-h-32 font-mono text-[0.8125rem]" />
          )}
          {f.help ? <p className="text-xs text-subtle">{f.help}</p> : null}
          {error ? <p className="text-xs text-danger">{error}</p> : null}
        </div>
      );
    case "number":
      return (
        <Field label={label} htmlFor={id} error={error} hint={f.help}>
          <Input id={id} type="number" min={f.min} max={f.max} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
        </Field>
      );
    case "date":
      return (
        <Field label={label} htmlFor={id} error={error} hint={f.help}>
          <Input id={id} type="date" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
        </Field>
      );
    case "relation": {
      const list = options[f.relation!];
      const selected = new Set((value as string[]) ?? []);
      return (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-fg-2">{f.label}</p>
          <div className="flex max-h-40 flex-wrap gap-1 overflow-y-auto rounded-lg border border-line p-2">
            {list.map((o) => {
              const on = selected.has(o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onChange(on ? [...selected].filter((x) => x !== o.id) : [...selected, o.id])}
                  className={cn("rounded-full border px-2 py-0.5 text-xs transition", on ? "border-accent/60 bg-accent-soft text-accent" : "border-line text-muted hover:text-fg")}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>
      );
    }
    case "parent":
      return (
        <Field label={label} htmlFor={id} error={error}>
          <Select id={id} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
            <option value="">— None (top level) —</option>
            {options[f.relation!].map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
      );
    case "media":
    case "gallery": {
      const ids = f.type === "media" ? (value ? [String(value)] : []) : ((value as string[]) ?? []);
      const media = ids.map((x) => options.media.find((m) => m.id === x)).filter(Boolean) as RelationOptions["media"];
      return (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-fg-2">{f.label}</p>
          <div className="flex flex-wrap gap-2">
            {media.map((m) => (
              <div key={m.id} className="group relative size-20 overflow-hidden rounded-lg border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.path} alt={m.alt} className="size-full object-cover" />
                <button type="button" onClick={() => onChange(f.type === "media" ? "" : ids.filter((x) => x !== m.id))} aria-label="Remove" className="absolute right-1 top-1 rounded bg-black/70 p-0.5 text-white opacity-0 group-hover:opacity-100">
                  <X className="size-3" />
                </button>
              </div>
            ))}
            {f.type === "gallery" || !media.length ? (
              <button type="button" onClick={() => setPicker(true)} className="grid size-20 place-items-center rounded-lg border border-dashed border-line-strong text-muted hover:border-accent hover:text-fg" aria-label={`Add ${f.label}`}>
                <ImagePlus className="size-5" />
              </button>
            ) : null}
          </div>
          <MediaPicker
            open={picker}
            onOpenChange={setPicker}
            kind="image"
            folder="PROJECTS"
            onSelect={(m) => {
              if (!options.media.some((x) => x.id === m.id)) options.media.unshift({ id: m.id, path: m.path, alt: m.alt });
              onChange(f.type === "media" ? m.id : [...ids, m.id]);
            }}
          />
        </div>
      );
    }
    default:
      return (
        <Field label={label} htmlFor={id} error={error} hint={f.help}>
          <Input id={id} type={f.type === "url" ? "url" : "text"} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} maxLength={f.max} />
        </Field>
      );
  }
}
