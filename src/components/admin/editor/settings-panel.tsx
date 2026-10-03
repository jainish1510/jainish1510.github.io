"use client";

import { ImagePlus, Trash2, X } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { POST_STATUSES, type PostStatus } from "@/lib/constants";
import { slugify } from "@/lib/content/text";
import { cn, relativeTime } from "@/lib/utils";
import type { EditorPost } from "./post-editor";
import { deletePostAction, restoreRevisionAction } from "@/app/admin/actions/posts";
import { Button } from "@/components/ui/button";

export type EditorOptions = {
  categories: { id: string; name: string }[];
  tags: string[];
  areas: { id: string; name: string }[];
};

export function SettingsPanel({
  post,
  errors,
  options,
  update,
  setSlugTouched,
  onPickCover,
  onStatusChange,
  onClose,
}: {
  post: EditorPost;
  errors: Record<string, string>;
  options: EditorOptions;
  update: (p: Partial<EditorPost>) => void;
  setSlugTouched: (v: boolean) => void;
  onPickCover: () => void;
  onStatusChange: (s: PostStatus) => void;
  onClose: () => void;
}) {
  const [tagInput, setTagInput] = useState("");
  const suggestions = tagInput ? options.tags.filter((t) => t.toLowerCase().includes(tagInput.toLowerCase()) && !post.tags.includes(t)).slice(0, 6) : [];

  const addTag = (name: string) => {
    const clean = name.trim().replace(/^#/, "");
    if (!clean || post.tags.some((t) => t.toLowerCase() === clean.toLowerCase()) || post.tags.length >= 12) return;
    update({ tags: [...post.tags, clean] });
    setTagInput("");
  };
  const onTagKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === "Backspace" && !tagInput && post.tags.length) {
      update({ tags: post.tags.slice(0, -1) });
    }
  };

  return (
    <aside aria-label="Post settings" className="fixed inset-y-0 right-0 z-40 w-[min(22rem,92vw)] shrink-0 overflow-y-auto border-l border-line bg-bg-raised lg:sticky lg:top-12 lg:z-auto lg:h-[calc(100dvh-3rem)] lg:w-80">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <p className="text-sm font-medium text-fg">Post settings</p>
        <button type="button" onClick={onClose} aria-label="Close settings" className="rounded-md p-1 text-muted hover:text-fg">
          <X className="size-4" />
        </button>
      </div>
      <div className="space-y-6 p-5">
        <Field label="Status" htmlFor="ps-status" hint={post.id ? "Changes apply immediately." : "Saved with the post."}>
          <Select id="ps-status" value={post.status} onChange={(e) => onStatusChange(e.target.value as PostStatus)}>
            {POST_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="URL slug" htmlFor="ps-slug" error={errors.slug} hint={`/blog/${post.slug || "…"}`}>
          <Input
            id="ps-slug"
            value={post.slug}
            onChange={(e) => {
              setSlugTouched(true);
              update({ slug: slugify(e.target.value) || e.target.value.toLowerCase() });
            }}
          />
        </Field>

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-fg-2">Cover image</p>
          {post.coverPath ? (
            <div className="group relative overflow-hidden rounded-lg border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.coverPath} alt="Cover" className="aspect-[16/9] w-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                <Button size="sm" variant="secondary" onClick={onPickCover}>
                  Replace
                </Button>
                <Button size="sm" variant="ghost" className="text-white" onClick={() => update({ coverId: "", coverPath: "" })}>
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={onPickCover} className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong text-xs text-muted transition hover:border-accent hover:text-fg">
              <ImagePlus className="size-5" /> Choose or upload
            </button>
          )}
          <p className="text-xs text-subtle">Without one, a generative cover is drawn from the slug.</p>
        </div>

        <Field label="Category" htmlFor="ps-category">
          <Select id="ps-category" value={post.categoryId} onChange={(e) => update({ categoryId: e.target.value })}>
            <option value="">— None —</option>
            {options.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>

        <div className="space-y-1.5">
          <label htmlFor="ps-tags" className="text-xs font-medium text-fg-2">
            Tags <span className="text-subtle">({post.tags.length}/12)</span>
          </label>
          <div className="flex flex-wrap gap-1.5 rounded-lg border border-line bg-surface p-1.5 focus-within:border-accent/60">
            {post.tags.map((t) => (
              <span key={t} className="flex items-center gap-1 rounded-md bg-surface-2 py-0.5 pl-2 pr-1 text-xs text-fg-2">
                {t}
                <button type="button" onClick={() => update({ tags: post.tags.filter((x) => x !== t) })} aria-label={`Remove tag ${t}`} className="rounded p-0.5 hover:text-fg">
                  <X className="size-3" />
                </button>
              </span>
            ))}
            <input
              id="ps-tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={onTagKey}
              onBlur={() => tagInput && addTag(tagInput)}
              placeholder={post.tags.length ? "" : "Add tags…"}
              className="min-w-20 flex-1 bg-transparent px-1 text-sm text-fg outline-none placeholder:text-subtle"
            />
          </div>
          {suggestions.length ? (
            <div className="flex flex-wrap gap-1">
              {suggestions.map((s) => (
                <button key={s} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => addTag(s)} className="rounded-md border border-line px-1.5 py-0.5 text-[0.6875rem] text-muted hover:text-fg">
                  + {s}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-fg-2">Research areas</p>
          <div className="flex flex-wrap gap-1">
            {options.areas.map((a) => {
              const on = post.areaIds.includes(a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => update({ areaIds: on ? post.areaIds.filter((x) => x !== a.id) : [...post.areaIds, a.id] })}
                  className={cn("rounded-full border px-2 py-0.5 text-[0.6875rem] transition", on ? "border-accent/60 bg-accent-soft text-accent" : "border-line text-muted hover:text-fg")}
                >
                  {a.name}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-subtle">Connects the post to the research graph.</p>
        </div>

        <Field label="Excerpt" htmlFor="ps-excerpt" hint="Leave empty to generate from the body." error={errors.excerpt}>
          <Textarea id="ps-excerpt" value={post.excerpt} onChange={(e) => update({ excerpt: e.target.value })} maxLength={500} className="min-h-20" />
        </Field>

        <Field label="Publication date" htmlFor="ps-date" hint="Future dates schedule the post." error={errors.publishedAt}>
          <Input id="ps-date" type="datetime-local" value={post.publishedAt} onChange={(e) => update({ publishedAt: e.target.value })} />
        </Field>

        <label className="flex items-center justify-between gap-3 text-sm text-fg-2">
          Featured on the blog
          <Switch checked={post.featured} onCheckedChange={(v) => update({ featured: v })} />
        </label>

        <details className="rounded-lg border border-line px-3 py-2">
          <summary className="cursor-pointer text-xs font-medium text-fg-2">SEO</summary>
          <div className="mt-3 space-y-3 pb-1">
            <Field label="SEO title" htmlFor="ps-seo-title" hint={`${post.seoTitle.length}/120`}>
              <Input id="ps-seo-title" value={post.seoTitle} onChange={(e) => update({ seoTitle: e.target.value })} maxLength={120} placeholder={post.title} />
            </Field>
            <Field label="Meta description" htmlFor="ps-seo-desc" hint={`${post.seoDescription.length}/300`}>
              <Textarea id="ps-seo-desc" value={post.seoDescription} onChange={(e) => update({ seoDescription: e.target.value })} maxLength={300} className="min-h-20" />
            </Field>
          </div>
        </details>

        {post.revisions.length && post.id ? (
          <details className="rounded-lg border border-line px-3 py-2">
            <summary className="cursor-pointer text-xs font-medium text-fg-2">Revisions ({post.revisions.length})</summary>
            <ul className="mt-2 space-y-1">
              {post.revisions.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2 text-xs text-muted">
                  <span>
                    {relativeTime(r.createdAt)} · {r.note ?? "save"}
                  </span>
                  <button
                    type="button"
                    className="text-fg-2 hover:text-fg"
                    onClick={async () => {
                      if (!confirm("Restore this revision? The current content is kept as a revision too.")) return;
                      await restoreRevisionAction(post.id!, r.id);
                      window.location.reload();
                    }}
                  >
                    Restore
                  </button>
                </li>
              ))}
            </ul>
          </details>
        ) : null}

        {post.id ? (
          <form
            action={deletePostAction.bind(null, post.id)}
            onSubmit={(e) => {
              if (!confirm("Delete this post permanently? Comments, likes and views go with it.")) e.preventDefault();
            }}
          >
            <button type="submit" className="flex items-center gap-2 text-xs text-danger hover:underline">
              <Trash2 className="size-3.5" /> Delete post
            </button>
          </form>
        ) : null}
      </div>
    </aside>
  );
}
