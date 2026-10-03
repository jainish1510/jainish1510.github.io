"use client";

import { Check, Copy, Film, Loader2, Search, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { deleteMediaAction, listMediaAction, updateMediaAction, type MediaItem } from "@/app/admin/actions/media";
import { uploadMedia } from "@/components/admin/media-picker";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { MEDIA_FOLDERS, type MediaFolder } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";

const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);

export function MediaLibrary({ initial }: { initial: MediaItem[] }) {
  const [items, setItems] = useState(initial);
  const [folder, setFolder] = useState<MediaFolder | "ALL">("ALL");
  const [q, setQ] = useState("");
  const [active, setActive] = useState<MediaItem | null>(null);
  const [uploading, setUploading] = useState(0);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const first = useRef(true);

  const reload = useCallback(async () => setItems(await listMediaAction({ folder, q: q || undefined })), [folder, q]);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(reload, 200);
    return () => clearTimeout(t);
  }, [reload]);

  async function upload(files: FileList | File[]) {
    const list = Array.from(files);
    setUploading(list.length);
    for (const f of list) {
      try {
        await uploadMedia(f, folder === "ALL" ? "MISC" : folder);
      } catch (e) {
        toast.error(`${f.name}: ${(e as Error).message}`);
      }
      setUploading((n) => n - 1);
    }
    toast.success("Upload complete");
    await reload();
  }

  const counts = MEDIA_FOLDERS.map((f) => [f, initial.filter((i) => i.folder === f).length] as const);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void upload(e.dataTransfer.files);
        }}
        className={cn("rounded-xl transition", dragging && "outline outline-2 outline-dashed outline-accent")}
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="flex gap-1 overflow-x-auto">
            {[["ALL", initial.length] as const, ...counts].map(([f, n]) => (
              <button key={f} type="button" onClick={() => setFolder(f)} className={cn("shrink-0 rounded-lg px-3 py-1.5 text-sm capitalize", folder === f ? "bg-surface-2 text-fg" : "text-muted hover:text-fg")}>
                {f.toLowerCase()} <span className="font-mono text-xs text-subtle">{n}</span>
              </button>
            ))}
          </div>
          <div className="relative ml-auto">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-subtle" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="w-52 pl-8" aria-label="Search media" />
          </div>
          <Button variant="primary" onClick={() => input.current?.click()} disabled={uploading > 0}>
            {uploading ? <Loader2 className="animate-spin" /> : <Upload />} Upload
          </Button>
          <input ref={input} type="file" hidden multiple accept="image/png,image/jpeg,image/webp,image/gif,image/avif,video/mp4,video/webm" onChange={(e) => e.target.files && upload(e.target.files)} />
        </div>
        {items.length === 0 ? (
          <EmptyState title="No media here." description="Drop files anywhere on this panel to upload." />
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((m) => (
              <li key={m.id}>
                <button type="button" onClick={() => setActive(m)} className={cn("group w-full overflow-hidden rounded-xl border text-left transition", active?.id === m.id ? "border-accent" : "border-line hover:border-line-strong")}>
                  <div className="relative aspect-[4/3] bg-surface-2">
                    {m.mimeType.startsWith("image/") ? (
                      <Image src={m.path} alt={m.alt} fill sizes="240px" className="object-cover" />
                    ) : (
                      <span className="grid size-full place-items-center text-muted">
                        <Film className="size-6" />
                      </span>
                    )}
                    {!m.alt && m.mimeType.startsWith("image/") ? <Badge tone="warm" className="absolute left-2 top-2">no alt</Badge> : null}
                  </div>
                  <div className="px-3 py-2">
                    <p className="truncate text-xs text-fg-2">{m.originalName}</p>
                    <p className="font-mono text-[0.625rem] text-subtle">
                      {m.width && m.height ? `${m.width}×${m.height} · ` : ""}
                      {kb(m.size)}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <aside className="xl:sticky xl:top-6 xl:self-start">
        {active ? <MediaDetails key={active.id} item={active} onChanged={reload} onDeleted={() => (setActive(null), reload())} /> : <div className="rounded-xl border border-dashed border-line-strong p-6 text-center text-sm text-muted">Select a file to edit its alt text, caption and folder.</div>}
      </aside>
    </div>
  );
}

function MediaDetails({ item, onChanged, onDeleted }: { item: MediaItem; onChanged: () => void; onDeleted: () => void }) {
  const [alt, setAlt] = useState(item.alt);
  const [caption, setCaption] = useState(item.caption ?? "");
  const [folder, setFolder] = useState(item.folder as MediaFolder);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const markdown = item.mimeType.startsWith("video/") ? `::video[${caption || item.originalName}]{src="${item.path}"}` : `![${alt}](${item.path}${caption ? ` "${caption}"` : ""})`;

  return (
    <div className="space-y-4 rounded-xl border border-line bg-surface p-4">
      <div className="relative aspect-video overflow-hidden rounded-lg bg-surface-2">
        {item.mimeType.startsWith("image/") ? <Image src={item.path} alt={alt} fill sizes="320px" className="object-contain" /> : <video src={item.path} controls className="size-full" />}
      </div>
      <dl className="grid grid-cols-2 gap-2 font-mono text-[0.6875rem] text-muted">
        <dt>Type</dt>
        <dd className="text-fg-2">{item.mimeType}</dd>
        <dt>Size</dt>
        <dd className="text-fg-2">{kb(item.size)}</dd>
        {item.width ? (
          <>
            <dt>Dimensions</dt>
            <dd className="text-fg-2">
              {item.width}×{item.height}
            </dd>
          </>
        ) : null}
        <dt>Uploaded</dt>
        <dd className="text-fg-2">{formatDate(item.createdAt, "short")}</dd>
        <dt>Used by</dt>
        <dd className="text-fg-2">{item.usage} item(s)</dd>
      </dl>
      <Field label="Alt text" htmlFor="m-alt" hint="Describe the image for screen readers.">
        <Input id="m-alt" value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={300} />
      </Field>
      <Field label="Caption" htmlFor="m-caption">
        <Textarea id="m-caption" value={caption} onChange={(e) => setCaption(e.target.value)} className="min-h-16" />
      </Field>
      <Field label="Folder" htmlFor="m-folder">
        <Select id="m-folder" value={folder} onChange={(e) => setFolder(e.target.value as MediaFolder)}>
          {MEDIA_FOLDERS.map((f) => (
            <option key={f} value={f}>
              {f.toLowerCase()}
            </option>
          ))}
        </Select>
      </Field>
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(markdown);
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        }}
        className="flex w-full items-center gap-2 truncate rounded-lg border border-line px-3 py-2 text-left font-mono text-[0.6875rem] text-muted hover:text-fg"
      >
        {copied ? <Check className="size-3.5 shrink-0 text-success" /> : <Copy className="size-3.5 shrink-0" />}
        <span className="truncate">{markdown}</span>
      </button>
      <div className="flex justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-danger"
          onClick={async () => {
            if (!confirm(item.usage ? `This file is used by ${item.usage} item(s). Delete anyway?` : "Delete this file permanently?")) return;
            await deleteMediaAction(item.id);
            toast.success("Deleted");
            onDeleted();
          }}
        >
          <Trash2 /> Delete
        </Button>
        <Button
          variant="primary"
          size="sm"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            const r = await updateMediaAction(item.id, { alt, caption, folder });
            setSaving(false);
            if (r.ok) {
              toast.success("Saved");
              onChanged();
            } else toast.error(Object.values(r.errors)[0]);
          }}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
