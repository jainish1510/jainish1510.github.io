"use client";

import { Dialog } from "radix-ui";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Item = { src: string; alt: string; caption?: string };

/** Collects every lightbox-able image on the page so arrow keys can page through them. */
function collect(): Item[] {
  return Array.from(document.querySelectorAll<HTMLElement>("[data-lightbox-src]")).map((el) => ({
    src: el.dataset.lightboxSrc!,
    alt: el.dataset.lightboxAlt ?? "",
    caption: el.dataset.lightboxCaption,
  }));
}

export function ArticleImage({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [index, setIndex] = useState(0);

  const show = () => {
    const all = collect();
    setItems(all);
    setIndex(Math.max(0, all.findIndex((i) => i.src === src)));
    setOpen(true);
  };

  const step = useCallback((d: number) => setIndex((i) => (items.length ? (i + d + items.length) % items.length : 0)), [items.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, step]);

  const current = items[index] ?? { src, alt, caption };

  return (
    <span className="not-prose block">
      <button
        type="button"
        onClick={show}
        data-lightbox-src={src}
        data-lightbox-alt={alt}
        data-lightbox-caption={caption}
        data-cursor="zoom"
        aria-label={`Enlarge image${alt ? `: ${alt}` : ""}`}
        className="group/img block w-full overflow-hidden rounded-xl border border-line bg-surface"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- markdown images have unknown dimensions */}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="h-auto w-full transition duration-700 ease-[var(--ease-out-expo)] group-hover/img:scale-[1.015]"
        />
      </button>
      {caption ? <span className="mt-3 block text-center font-sans text-sm text-muted">{caption}</span> : null}

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[90] bg-black/85 backdrop-blur-sm data-[state=open]:animate-in" />
          <Dialog.Content className="fixed inset-0 z-[91] flex flex-col items-center justify-center p-4 outline-none sm:p-10">
            <Dialog.Title className="sr-only">{current.alt || "Image"}</Dialog.Title>
            <Dialog.Description className="sr-only">Use arrow keys to move between images. Press Escape to close.</Dialog.Description>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.src} alt={current.alt} className="max-h-[80vh] max-w-full rounded-lg object-contain" />
            {current.caption ? <p className="mt-4 text-sm text-white/70">{current.caption}</p> : null}
            {items.length > 1 ? (
              <div className="mt-4 flex items-center gap-3 font-mono text-xs text-white/60">
                <button type="button" onClick={() => step(-1)} aria-label="Previous image" className="rounded-full p-2 hover:bg-white/10">
                  <ChevronLeft className="size-4" />
                </button>
                {index + 1} / {items.length}
                <button type="button" onClick={() => step(1)} aria-label="Next image" className="rounded-full p-2 hover:bg-white/10">
                  <ChevronRight className="size-4" />
                </button>
              </div>
            ) : null}
            <Dialog.Close className="absolute right-4 top-4 rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white" aria-label="Close">
              <X className="size-5" />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </span>
  );
}
