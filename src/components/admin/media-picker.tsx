"use client";

import { Loader2, Search, Upload } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { listMediaAction, type MediaItem } from "@/app/admin/actions/media";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input, Select } from "@/components/ui/form";
import { MEDIA_FOLDERS, type MediaFolder } from "@/lib/constants";
import { cn } from "@/lib/utils";

export async function uploadMedia(file: File, folder: MediaFolder, alt = ""): Promise<MediaItem> {
  const form = new FormData();
  form.set("file", file);
  form.set("folder", folder);
  form.set("alt", alt);
  const res = await fetch("/api/admin/media", { method: "POST", body: form });
  const data = (await res.json()) as { media?: MediaItem & { createdAt: string }; error?: string };
  if (!res.ok || !data.media) throw new Error(data.error ?? "Upload failed");
  return { ...data.media, usage: 0 };
}

/** Choose from the media library or upload in place. */
export function MediaPicker({
  open,
  onOpenChange,
  onSelect,
  kind,
  folder: defaultFolder = "BLOG",
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSelect: (m: MediaItem) => void;
  kind?: "image" | "video";
  folder?: MediaFolder;
}) {
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [q, setQ] = useState("");
  const [folder, setFolder] = useState<MediaFolder | "ALL">("ALL");
  const [uploading, setUploading] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setItems(await listMediaAction({ folder, q: q || undefined, kind }));
  }, [folder, q, kind]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(load, 150);
    return () => clearTimeout(t);
  }, [open, load]);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const media = await uploadMedia(file, folder === "ALL" ? defaultFolder : folder);
        toast.success(`Uploaded ${file.name}`);
        if (files.length === 1) {
          onSelect(media);
          onOpenChange(false);
        }
      }
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Media library" description="Pick an existing file or upload a new one." className="w-[min(94vw,56rem)]">
        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-48 flex-1">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-subtle" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, alt text…" className="pl-8" aria-label="Search media" />
          </div>
          <Select value={folder} onChange={(e) => setFolder(e.target.value as MediaFolder | "ALL")} className="w-36" aria-label="Folder">
            <option value="ALL">All folders</option>
            {MEDIA_FOLDERS.map((f) => (
              <option key={f} value={f}>
                {f.toLowerCase()}
              </option>
            ))}
          </Select>
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="flex h-9 items-center gap-2 rounded-lg bg-fg px-3 text-sm font-medium text-bg"
            disabled={uploading}
          >
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} Upload
          </button>
          <input ref={input} type="file" hidden multiple accept={kind === "video" ? "video/mp4,video/webm" : kind === "image" ? "image/*" : "image/*,video/mp4,video/webm"} onChange={(e) => onFiles(e.target.files)} />
        </div>
        <div
          className="mt-4 grid max-h-[55vh] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-4"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void onFiles(e.dataTransfer.files);
          }}
        >
          {items === null ? (
            Array.from({ length: 8 }, (_, i) => <div key={i} className="skeleton aspect-[4/3]" />)
          ) : items.length === 0 ? (
            <p className="col-span-full py-12 text-center text-sm text-muted">No media yet — drop files here to upload.</p>
          ) : (
            items.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  onSelect(m);
                  onOpenChange(false);
                }}
                className={cn("group overflow-hidden rounded-lg border border-line text-left transition hover:border-accent")}
              >
                <div className="relative aspect-[4/3] bg-surface-2">
                  {m.mimeType.startsWith("image/") ? (
                    <Image src={m.path} alt={m.alt} fill sizes="200px" className="object-cover" />
                  ) : (
                    <video src={m.path} className="size-full object-cover" muted preload="metadata" />
                  )}
                </div>
                <p className="truncate px-2 py-1.5 text-[0.6875rem] text-muted group-hover:text-fg">{m.originalName}</p>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
