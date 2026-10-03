"use client";

import { ArrowLeft, Check, Columns2, Eye, Loader2, PanelRight, PenLine, Rocket, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type ClipboardEvent, type DragEvent, type KeyboardEvent } from "react";
import { toast } from "sonner";
import { savePostAction, setPostStatusAction } from "@/app/admin/actions/posts";
import type { MediaItem } from "@/app/admin/actions/media";
import { MediaPicker, uploadMedia } from "@/components/admin/media-picker";
import { Markdown } from "@/components/content/markdown";
import { REGISTERED_COMPONENTS } from "@/components/content/component-slot";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input, Select } from "@/components/ui/form";
import { Badge, Kbd } from "@/components/ui/primitives";
import type { PostStatus } from "@/lib/constants";
import { createEmbed } from "@/lib/content/embeds";
import { insertBlock, prefixLines, SNIPPETS, wrapSelection, type EditResult } from "@/lib/content/editing";
import { readingTime, slugify, wordCount } from "@/lib/content/text";
import { cn, relativeTime } from "@/lib/utils";
import { PublishDialog } from "./publish-dialog";
import { SettingsPanel, type EditorOptions } from "./settings-panel";
import { Toolbar, type ToolbarAction } from "./toolbar";

export type EditorPost = {
  id: string | null;
  title: string;
  subtitle: string;
  slug: string;
  excerpt: string;
  content: string;
  status: PostStatus;
  featured: boolean;
  categoryId: string;
  coverId: string;
  coverPath: string;
  tags: string[];
  areaIds: string[];
  publishedAt: string;
  seoTitle: string;
  seoDescription: string;
  updatedAt: string | null;
  revisions: { id: string; note: string | null; createdAt: string; title: string }[];
};

type SaveState = "saved" | "dirty" | "saving" | "error";
type View = "write" | "split" | "preview";

const payload = (p: EditorPost) => ({
  title: p.title,
  subtitle: p.subtitle,
  slug: p.slug || slugify(p.title) || "untitled",
  excerpt: p.excerpt,
  content: p.content,
  status: p.status,
  featured: p.featured,
  categoryId: p.categoryId || null,
  coverId: p.coverId || null,
  tags: p.tags,
  areaIds: p.areaIds,
  publishedAt: p.publishedAt || null,
  seoTitle: p.seoTitle,
  seoDescription: p.seoDescription,
});

export function PostEditor({ initial, options }: { initial: EditorPost; options: EditorOptions }) {
  const router = useRouter();
  const [post, setPost] = useState(initial);
  const [savedStatus, setSavedStatus] = useState<PostStatus>(initial.status);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [lastSaved, setLastSaved] = useState<string | null>(initial.updatedAt);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [view, setView] = useState<View>("split");
  const [panel, setPanel] = useState(true);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [picker, setPicker] = useState<null | { kind?: "image" | "video"; purpose: "inline" | "cover" | "gallery" | "video" }>(null);
  const [embedOpen, setEmbedOpen] = useState(false);
  const [componentOpen, setComponentOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [backup, setBackup] = useState<{ content: string; title: string; at: number } | null>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const saving = useRef(false);
  const deferred = useDeferredValue(post.content);
  const backupKey = `studio-editor-backup-${initial.id ?? "new"}`;

  useEffect(() => {
    if (window.matchMedia("(max-width: 1023px)").matches) {
      setView("write");
      setPanel(false);
    }
    try {
      const raw = localStorage.getItem(backupKey);
      if (raw) {
        const b = JSON.parse(raw) as { content: string; title: string; at: number };
        const serverTime = initial.updatedAt ? new Date(initial.updatedAt).getTime() : 0;
        if (b.at > serverTime + 2000 && b.content !== initial.content) setBackup(b);
      }
    } catch {
      /* ignore */
    }
  }, [backupKey, initial.updatedAt, initial.content]);

  const update = useCallback((patch: Partial<EditorPost>) => {
    setPost((p) => {
      const next = { ...p, ...patch };
      try {
        localStorage.setItem(`studio-editor-backup-${p.id ?? "new"}`, JSON.stringify({ content: next.content, title: next.title, at: Date.now() }));
      } catch {
        /* ignore */
      }
      return next;
    });
    setSaveState("dirty");
  }, []);

  // Auto-generate the slug from the title until the author edits it.
  useEffect(() => {
    if (!slugTouched) setPost((p) => ({ ...p, slug: slugify(p.title) }));
  }, [post.title, slugTouched]);

  const save = useCallback(
    async (mode: "autosave" | "manual" | "publish", override?: Partial<EditorPost>) => {
      if (saving.current) return false;
      const current = { ...post, ...override };
      if (!current.title.trim()) {
        if (mode !== "autosave") setErrors({ title: "Give the post a title first." });
        return false;
      }
      saving.current = true;
      setSaveState("saving");
      const result = await savePostAction(current.id, payload(current), mode);
      saving.current = false;
      if (!result.ok) {
        setErrors(result.errors);
        setSaveState("error");
        if (mode !== "autosave") toast.error(Object.values(result.errors)[0] ?? "Couldn't save");
        return false;
      }
      setErrors({});
      setSaveState("saved");
      setLastSaved(result.savedAt);
      setSavedStatus(result.status);
      setPost((p) => ({ ...p, id: result.id, slug: result.slug, status: result.status }));
      try {
        localStorage.removeItem(backupKey);
      } catch {
        /* ignore */
      }
      if (!current.id) window.history.replaceState(null, "", `/admin/posts/${result.id}/edit`);
      if (mode === "manual") toast.success(result.status === "PUBLISHED" ? "Changes are live" : "Draft saved");
      if (mode === "publish") {
        toast.success("Published", { action: { label: "View", onClick: () => window.open(`/blog/${result.slug}`, "_blank") } });
        router.refresh();
      }
      return true;
    },
    [post, router, backupKey],
  );

  // Autosave drafts only — published posts change only on an explicit "Update".
  useEffect(() => {
    if (saveState !== "dirty" || savedStatus !== "DRAFT" || !post.title.trim()) return;
    const t = setTimeout(() => void save("autosave"), 2500);
    return () => clearTimeout(t);
  }, [post, saveState, savedStatus, save]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (saveState === "dirty" || saveState === "saving") e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [saveState]);

  // ─── Text editing ──────────────────────────────────────────────────────
  const apply = useCallback(
    (fn: (value: string, start: number, end: number) => EditResult) => {
      const el = textarea.current;
      if (!el) return;
      const r = fn(el.value, el.selectionStart, el.selectionEnd);
      update({ content: r.value });
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(r.selectionStart, r.selectionEnd);
      });
    },
    [update],
  );

  const insert = useCallback((block: string, cursorOffset?: number) => apply((v, s, e) => insertBlock(v, s, e, block, cursorOffset)), [apply]);

  const onAction = (a: ToolbarAction) => {
    switch (a) {
      case "h2":
        return apply((v, s, e) => prefixLines(v, s, e, "## "));
      case "h3":
        return apply((v, s, e) => prefixLines(v, s, e, "### "));
      case "bold":
        return apply((v, s, e) => wrapSelection(v, s, e, "**"));
      case "italic":
        return apply((v, s, e) => wrapSelection(v, s, e, "*"));
      case "underline":
        return apply((v, s, e) => wrapSelection(v, s, e, "++"));
      case "code":
        return apply((v, s, e) => wrapSelection(v, s, e, "`", "`", "code"));
      case "link":
        return apply((v, s, e) => wrapSelection(v, s, e, "[", "](https://)", "link text"));
      case "quote":
        return apply((v, s, e) => prefixLines(v, s, e, "> "));
      case "ul":
        return apply((v, s, e) => prefixLines(v, s, e, "- "));
      case "ol":
        return apply((v, s, e) => prefixLines(v, s, e, (i) => `${i + 1}. `));
      case "divider":
        return insert(SNIPPETS.divider());
      case "codeblock":
        return insert(SNIPPETS.codeBlock(), 6);
      case "math":
        return apply((v, s, e) => wrapSelection(v, s, e, "$", "$", "x^2"));
      case "mathblock":
        return insert(SNIPPETS.mathBlock());
      case "table":
        return insert(SNIPPETS.table());
      case "mermaid":
        return insert(SNIPPETS.mermaid());
      case "callout":
        return insert(SNIPPETS.callout());
      case "image":
        return setPicker({ kind: "image", purpose: "inline" });
      case "gallery":
        return setPicker({ kind: "image", purpose: "gallery" });
      case "video":
        return setEmbedOpen(true);
      case "component":
        return setComponentOpen(true);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && !e.shiftKey) {
      const map: Record<string, ToolbarAction> = { b: "bold", i: "italic", u: "underline", e: "code", k: "link" };
      const action = map[e.key.toLowerCase()];
      if (action) {
        e.preventDefault();
        e.stopPropagation();
        onAction(action);
      }
    }
    if (e.key === "Tab") {
      e.preventDefault();
      apply((v, s, en) => ({ value: v.slice(0, s) + "  " + v.slice(en), selectionStart: s + 2, selectionEnd: s + 2 }));
    }
  };

  // Global editor shortcuts: ⌘S save, ⌘⇧P cycle view, ⌘⇧Enter publish.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void save("manual");
      } else if (mod && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setView((v) => (v === "write" ? "split" : v === "split" ? "preview" : "write"));
      } else if (mod && e.shiftKey && e.key === "Enter") {
        e.preventDefault();
        setPublishOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  async function uploadAndInsert(files: FileList | File[]) {
    for (const file of Array.from(files)) {
      if (!/^(image|video)\//.test(file.type)) continue;
      const id = toast.loading(`Uploading ${file.name}…`);
      try {
        const m = await uploadMedia(file, "BLOG");
        insert(m.mimeType.startsWith("video/") ? SNIPPETS.video(m.path, file.name) : SNIPPETS.image(m.path, file.name.replace(/\.\w+$/, "")));
        toast.success("Uploaded", { id });
      } catch (err) {
        toast.error((err as Error).message, { id });
      }
    }
  }

  const onPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    if (e.clipboardData.files.length) {
      e.preventDefault();
      void uploadAndInsert(e.clipboardData.files);
    }
  };
  const onDrop = (e: DragEvent<HTMLTextAreaElement>) => {
    if (e.dataTransfer.files.length) {
      e.preventDefault();
      void uploadAndInsert(e.dataTransfer.files);
    }
  };

  const galleryRef = useRef<string[]>([]);
  const onPick = (m: MediaItem) => {
    if (!picker) return;
    if (picker.purpose === "cover") update({ coverId: m.id, coverPath: m.path });
    else if (picker.purpose === "gallery") {
      galleryRef.current.push(SNIPPETS.image(m.path, m.alt || m.originalName));
      toast.message(`${galleryRef.current.length} image(s) in gallery`, {
        action: {
          label: "Insert gallery",
          onClick: () => {
            insert(SNIPPETS.gallery(galleryRef.current));
            galleryRef.current = [];
          },
        },
        description: "Pick more images, or insert now.",
      });
      setTimeout(() => setPicker({ kind: "image", purpose: "gallery" }), 50);
    } else if (picker.purpose === "video") insert(SNIPPETS.video(m.path, m.caption ?? m.originalName));
    else insert(SNIPPETS.image(m.path, m.alt || m.originalName, m.caption ?? undefined));
  };

  const stats = useMemo(() => ({ words: wordCount(post.content), minutes: readingTime(post.content) }), [post.content]);
  const changesPending = savedStatus === "PUBLISHED" && saveState === "dirty";

  return (
    <div className="-mx-4 -my-8 flex min-h-[calc(100dvh-3.5rem)] flex-col sm:-mx-8 lg:-mx-10 lg:-my-10 lg:min-h-dvh">
      {/* Top bar */}
      <div className="sticky top-14 z-20 flex flex-wrap items-center gap-2 border-b border-line bg-bg/90 px-4 py-2 backdrop-blur lg:top-0 lg:px-6">
        <Link href="/admin/posts" className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-fg" aria-label="Back to posts">
          <ArrowLeft className="size-4" />
        </Link>
        <Badge tone={savedStatus === "PUBLISHED" ? "success" : savedStatus === "ARCHIVED" ? "outline" : "warm"}>{savedStatus.toLowerCase()}</Badge>
        <span className="flex items-center gap-1.5 text-xs text-muted" role="status" aria-live="polite">
          {saveState === "saving" ? (
            <>
              <Loader2 className="size-3 animate-spin" /> Saving…
            </>
          ) : saveState === "error" ? (
            <>
              <TriangleAlert className="size-3 text-danger" /> Not saved
            </>
          ) : changesPending ? (
            <>
              <span className="size-1.5 rounded-full bg-warm" /> Unpublished changes
            </>
          ) : saveState === "dirty" ? (
            <>
              <span className="size-1.5 rounded-full bg-muted" /> Editing…
            </>
          ) : lastSaved ? (
            <>
              <Check className="size-3 text-success" /> Saved {relativeTime(lastSaved)}
            </>
          ) : (
            "New post"
          )}
        </span>

        <div className="ml-auto flex items-center gap-1.5">
          <div className="hidden items-center rounded-lg border border-line p-0.5 sm:flex" role="tablist" aria-label="Editor view">
            {(
              [
                ["write", <PenLine key="w" />, "Write"],
                ["split", <Columns2 key="s" />, "Split"],
                ["preview", <Eye key="p" />, "Preview"],
              ] as const
            ).map(([v, icon, label]) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                title={`${label} (⌘⇧P)`}
                className={cn("flex items-center gap-1.5 rounded-md px-2 py-1 text-xs [&_svg]:size-3.5", view === v ? "bg-surface-2 text-fg" : "text-muted hover:text-fg")}
              >
                {icon}
                <span className="hidden md:inline">{label}</span>
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setView((v) => (v === "preview" ? "write" : "preview"))} className="rounded-md p-1.5 text-muted sm:hidden" aria-label="Toggle preview">
            <Eye className="size-4" />
          </button>
          <button type="button" onClick={() => setPanel((p) => !p)} aria-pressed={panel} className={cn("rounded-md p-1.5 hover:bg-surface-2", panel ? "text-fg" : "text-muted")} aria-label="Post settings">
            <PanelRight className="size-4" />
          </button>
          {post.id ? (
            <Link href={`/admin/posts/${post.id}/preview`} target="_blank" className="hidden rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-fg sm:block" title="Full-page preview">
              <Eye className="size-4" />
            </Link>
          ) : null}
          <Button size="sm" variant="secondary" onClick={() => save("manual")} disabled={saveState === "saving"}>
            {savedStatus === "PUBLISHED" ? "Update" : "Save draft"}
            <Kbd className="ml-1 hidden md:inline-flex">⌘S</Kbd>
          </Button>
          {savedStatus !== "PUBLISHED" ? (
            <Button size="sm" variant="accent" onClick={() => setPublishOpen(true)}>
              <Rocket /> Publish
            </Button>
          ) : null}
        </div>
      </div>

      {backup ? (
        <div className="flex flex-wrap items-center gap-3 border-b border-warm/30 bg-warm-soft px-6 py-2 text-sm text-fg">
          <TriangleAlert className="size-4 text-warm" /> Found unsaved local changes from {relativeTime(new Date(backup.at))}.
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              update({ content: backup.content, title: backup.title });
              setBackup(null);
            }}
          >
            Restore
          </Button>
          <Button size="sm" variant="ghost" onClick={() => (localStorage.removeItem(backupKey), setBackup(null))}>
            Discard
          </Button>
        </div>
      ) : null}
      {errors.form ? <p className="border-b border-danger/30 bg-danger/10 px-6 py-2 text-sm text-danger">{errors.form}</p> : null}

      <div className="flex min-h-0 flex-1">
        {/* Editor */}
        <div className={cn("min-w-0 flex-1 overflow-y-auto", view === "preview" && "hidden")}>
          <div className="mx-auto max-w-3xl px-4 py-8 lg:px-10">
            <label htmlFor="post-title" className="sr-only">
              Title
            </label>
            <textarea
              id="post-title"
              rows={1}
              value={post.title}
              onChange={(e) => update({ title: e.target.value.replace(/\n/g, "") })}
              placeholder="Untitled"
              aria-invalid={!!errors.title}
              className="field-sizing-content w-full resize-none bg-transparent text-3xl font-semibold tracking-[-0.03em] text-fg outline-none placeholder:text-subtle md:text-4xl"
            />
            {errors.title ? <p className="text-xs text-danger">{errors.title}</p> : null}
            <label htmlFor="post-subtitle" className="sr-only">
              Subtitle
            </label>
            <input
              id="post-subtitle"
              value={post.subtitle}
              onChange={(e) => update({ subtitle: e.target.value })}
              placeholder="Subtitle — one line that earns the click"
              className="mt-2 w-full bg-transparent font-serif text-xl italic text-muted outline-none placeholder:text-subtle"
            />
            <div className="sticky top-[6.5rem] z-10 -mx-2 mt-6 border-y border-line bg-bg/95 px-1 py-1 backdrop-blur lg:top-12">
              <Toolbar onAction={onAction} />
            </div>
            <label htmlFor="post-content" className="sr-only">
              Body (Markdown)
            </label>
            <textarea
              id="post-content"
              ref={textarea}
              value={post.content}
              onChange={(e) => update({ content: e.target.value })}
              onKeyDown={onKeyDown}
              onPaste={onPaste}
              onDrop={onDrop}
              spellCheck
              placeholder={"Start writing…\n\nMarkdown, $math$, ```code```, ::youtube{id=\"…\"}, :::callout and ::component{name=\"…\"} are all supported.\nPaste or drop images to upload them."}
              className="field-sizing-content mt-4 min-h-[60vh] w-full resize-none bg-transparent font-mono text-[0.875rem] leading-7 text-fg-2 outline-none placeholder:text-subtle"
            />
          </div>
          <div className="sticky bottom-0 flex justify-between border-t border-line bg-bg/90 px-6 py-1.5 font-mono text-[0.6875rem] text-subtle backdrop-blur">
            <span>
              {stats.words.toLocaleString()} words · {stats.minutes} min read
            </span>
            <span className="hidden sm:inline">⌘S save · ⌘⇧P view · ⌘⇧↵ publish</span>
          </div>
        </div>

        {/* Live preview */}
        {view !== "write" ? (
          <div className={cn("min-w-0 flex-1 overflow-y-auto border-l border-line bg-bg-raised", view === "preview" && "border-l-0")} aria-label="Live preview">
            <div className="mx-auto max-w-[44rem] px-5 py-10">
              <p className="eyebrow mb-6 flex items-center gap-2">
                <Eye className="size-3" /> Live preview
              </p>
              {post.coverPath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.coverPath} alt="" className="mb-8 aspect-[16/8] w-full rounded-xl border border-line object-cover" />
              ) : null}
              <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-fg">{post.title || "Untitled"}</h1>
              {post.subtitle ? <p className="mt-4 font-serif text-xl italic text-muted">{post.subtitle}</p> : null}
              <hr className="my-8 border-line" />
              <Markdown source={deferred} />
            </div>
          </div>
        ) : null}

        {panel ? (
          <SettingsPanel
            post={post}
            errors={errors}
            options={options}
            update={update}
            setSlugTouched={setSlugTouched}
            onPickCover={() => setPicker({ kind: "image", purpose: "cover" })}
            onStatusChange={async (status) => {
              if (!post.id) return update({ status });
              await setPostStatusAction(post.id, status);
              setSavedStatus(status);
              setPost((p) => ({ ...p, status }));
              toast.success(`Moved to ${status.toLowerCase()}`);
              router.refresh();
            }}
            onClose={() => setPanel(false)}
          />
        ) : null}
      </div>

      <MediaPicker open={!!picker} onOpenChange={(o) => !o && setPicker(null)} onSelect={onPick} kind={picker?.kind} />
      <EmbedDialog
        open={embedOpen}
        onOpenChange={setEmbedOpen}
        onInsert={(snippet) => insert(snippet)}
        onPickVideo={() => {
          setEmbedOpen(false);
          setPicker({ kind: "video", purpose: "video" });
        }}
      />
      <Dialog open={componentOpen} onOpenChange={setComponentOpen}>
        <DialogContent title="Insert interactive component" description="Code-split React components registered in component-slot.tsx.">
          <ul className="space-y-1">
            {REGISTERED_COMPONENTS.map((name) => (
              <li key={name}>
                <button
                  type="button"
                  onClick={() => {
                    insert(SNIPPETS.component(name));
                    setComponentOpen(false);
                  }}
                  className="w-full rounded-lg border border-line px-3 py-2 text-left font-mono text-sm text-fg-2 hover:border-line-strong hover:text-fg"
                >
                  {name}
                </button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
      <PublishDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        post={post}
        onPublish={async () => {
          const ok = await save("publish", { status: "PUBLISHED" });
          if (ok) setPublishOpen(false);
        }}
        busy={saveState === "saving"}
      />
    </div>
  );
}

function EmbedDialog({ open, onOpenChange, onInsert, onPickVideo }: { open: boolean; onOpenChange: (o: boolean) => void; onInsert: (s: string) => void; onPickVideo: () => void }) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const spec = url ? createEmbed(url.trim(), title || "Embedded media") : null;
  const isVideoFile = /^https:\/\/.+\.(mp4|webm)(\?.*)?$/i.test(url.trim());
  const submit = () => {
    if (spec?.provider === "youtube") {
      const id = spec.src.match(/embed\/([\w-]{11})/)?.[1];
      if (id) onInsert(SNIPPETS.youtube(id, title || "Video"));
    } else if (spec) onInsert(SNIPPETS.embed(url.trim(), title || spec.provider));
    else if (isVideoFile) onInsert(SNIPPETS.video(url.trim(), title || "Video"));
    else return;
    setUrl("");
    setTitle("");
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Video or embed" description="YouTube, Vimeo, Loom, CodePen, CodeSandbox, StackBlitz, Observable, Figma — or a direct .mp4/.webm URL.">
        <div className="space-y-3">
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" aria-label="URL" autoFocus onKeyDown={(e) => e.key === "Enter" && submit()} />
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Caption (optional)" aria-label="Caption" />
          <p className="text-xs text-muted">
            {url ? (spec ? `Recognised: ${spec.provider}` : isVideoFile ? "Recognised: video file" : "Not an allow-listed provider — it won't embed.") : " "}
          </p>
          <div className="flex justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={onPickVideo}>
              Use an uploaded video…
            </Button>
            <Button variant="primary" size="sm" onClick={submit} disabled={!spec && !isVideoFile}>
              Insert
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
