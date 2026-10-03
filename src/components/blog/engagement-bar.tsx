"use client";

import { Bookmark, Link2, Mail, MessageCircle, Share2 } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LinkedInIcon, XIcon } from "@/components/brand/icons";
import { isBookmarked, setBookmark, type LocalBookmark } from "@/lib/client/bookmarks";
import { cn } from "@/lib/utils";

type Post = Omit<LocalBookmark, "savedAt">;

/**
 * Save + share. Saving is stored in this browser (localStorage), so it works
 * on a static site with no account. Sharing uses the native sheet on phones
 * and a menu on desktop.
 */
export function EngagementBar({ post, url, readingTime, commentsEnabled }: { post: Post; url: string; readingTime: number; commentsEnabled: boolean }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const sync = () => setSaved(isBookmarked(post.slug));
    sync();
    window.addEventListener("studio:bookmarks", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("studio:bookmarks", sync);
      window.removeEventListener("storage", sync);
    };
  }, [post.slug]);

  function toggleSave() {
    const next = !saved;
    if (!setBookmark(post, next)) return void toast.error("Couldn't save — your browser is blocking storage.");
    setSaved(next);
    toast.success(next ? "Saved to your reading list" : "Removed from saved", next ? { action: { label: "View", onClick: () => (window.location.href = "/bookmarks/") } } : undefined);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("✓ Link copied");
    } catch {
      toast.error("Couldn't copy — select the address bar instead.");
    }
  }

  async function nativeShare() {
    if (!navigator.share) return false;
    try {
      await navigator.share({ title: post.title, url });
    } catch {
      /* cancelled */
    }
    return true;
  }

  const enc = encodeURIComponent;
  const targets = [
    { label: "X", icon: <XIcon className="size-3.5" />, href: `https://twitter.com/intent/tweet?text=${enc(post.title)}&url=${enc(url)}` },
    { label: "LinkedIn", icon: <LinkedInIcon className="size-3.5" />, href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}` },
    { label: "Reddit", icon: <span className="font-mono text-[0.625rem]">r/</span>, href: `https://www.reddit.com/submit?url=${enc(url)}&title=${enc(post.title)}` },
    { label: "Email", icon: <Mail className="size-3.5" />, href: `mailto:?subject=${enc(post.title)}&body=${enc(url)}` },
  ];
  const btn = "relative flex h-9 items-center gap-2 rounded-full px-3 text-sm text-muted transition hover:bg-surface-2 hover:text-fg";

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Article actions">
      <button type="button" onClick={toggleSave} aria-pressed={saved} className={cn(btn, saved && "text-accent hover:text-accent")}>
        <Bookmark className={cn("size-4", saved && "fill-current")} />
        <span>{saved ? "Saved" : "Save"}</span>
      </button>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          className={btn}
          onPointerDown={async (e) => {
            if (window.matchMedia("(pointer: coarse)").matches && (await nativeShare())) e.preventDefault();
          }}
        >
          <Share2 className="size-4" />
          <span>Share</span>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content align="start" sideOffset={8} className="z-[70] min-w-44 rounded-xl border border-line-strong bg-surface p-1 shadow-2xl">
            <DropdownMenu.Item onSelect={copyLink} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-fg-2 outline-none data-[highlighted]:bg-surface-2 data-[highlighted]:text-fg">
              <Link2 className="size-3.5" /> Copy link
            </DropdownMenu.Item>
            {targets.map((t) => (
              <DropdownMenu.Item key={t.label} asChild className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-fg-2 outline-none data-[highlighted]:bg-surface-2 data-[highlighted]:text-fg">
                <a href={t.href} target="_blank" rel="noopener noreferrer">
                  {t.icon} {t.label}
                </a>
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      {commentsEnabled ? (
        <a href="#comments" className={btn}>
          <MessageCircle className="size-4" />
          <span>Discuss</span>
        </a>
      ) : null}
      <span className="ml-auto hidden pl-3 font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-subtle sm:inline">{readingTime} min read</span>
    </div>
  );
}
