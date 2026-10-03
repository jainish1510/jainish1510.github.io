"use client";

import { Bookmark, Heart, Link2, Mail, MessageCircle, Share2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { DropdownMenu } from "radix-ui";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { LinkedInIcon, XIcon } from "@/components/brand/icons";
import { readLocalBookmarks, writeLocalBookmark } from "@/lib/client/bookmarks";
import { cn, compactNumber } from "@/lib/utils";

type State = { likes: number; comments: number; views: number; liked: boolean; saved: boolean };

/**
 * Like / comment / save / share. Every toggle is optimistic: the UI flips
 * immediately, a request goes out, and the previous state is restored with a
 * toast if the server says no. Requests are serialised per control so rapid
 * double-clicks can't produce conflicting writes.
 */
export function EngagementBar({ post, initial, url }: { post: { id: string; slug: string; title: string }; initial: State; url: string }) {
  const [state, setState] = useState<State>(initial);
  const [burst, setBurst] = useState(0);
  const pending = useRef({ like: false, save: false });

  useEffect(() => {
    let cancelled = false;
    const local = readLocalBookmarks().some((b) => b.id === post.id);
    fetch(`/api/posts/${post.id}/engagement`)
      .then((r) => (r.ok ? (r.json() as Promise<State>) : null))
      .then((s) => {
        if (cancelled || !s) return;
        setState({ ...s, saved: s.saved || local });
        // Re-sync a local-only bookmark (e.g. cookies were cleared).
        if (local && !s.saved) void fetch(`/api/posts/${post.id}/bookmark`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ saved: true }) });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [post.id]);

  async function toggleLike() {
    if (pending.current.like) return;
    pending.current.like = true;
    const prev = state;
    const liked = !prev.liked;
    setState({ ...prev, liked, likes: prev.likes + (liked ? 1 : -1) });
    if (liked) setBurst((b) => b + 1);
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ liked }) });
      if (!res.ok) throw new Error(((await res.json()) as { error?: string }).error);
      const data = (await res.json()) as { liked: boolean; count: number };
      setState((s) => ({ ...s, liked: data.liked, likes: data.count }));
    } catch (e) {
      setState(prev);
      toast.error((e as Error).message || "Couldn't save your like. Try again.");
    } finally {
      pending.current.like = false;
    }
  }

  async function toggleSave() {
    if (pending.current.save) return;
    pending.current.save = true;
    const prev = state;
    const saved = !prev.saved;
    setState({ ...prev, saved });
    writeLocalBookmark(post, saved);
    try {
      const res = await fetch(`/api/posts/${post.id}/bookmark`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ saved }) });
      if (!res.ok) throw new Error();
      toast.success(saved ? "Saved to your reading list" : "Removed from saved", saved ? { action: { label: "View", onClick: () => (window.location.href = "/bookmarks") } } : undefined);
    } catch {
      // The local copy keeps working offline; it re-syncs on the next visit.
      if (saved) toast.message("Saved on this device", { description: "We'll sync it when the connection is back." });
    } finally {
      pending.current.save = false;
    }
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
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, url });
        return true;
      } catch {
        return true; // user cancelled
      }
    }
    return false;
  }

  const enc = encodeURIComponent;
  const shareTargets = [
    { label: "X", icon: <XIcon className="size-3.5" />, href: `https://twitter.com/intent/tweet?text=${enc(post.title)}&url=${enc(url)}` },
    { label: "LinkedIn", icon: <LinkedInIcon className="size-3.5" />, href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}` },
    { label: "Reddit", icon: <span className="font-mono text-[0.625rem]">r/</span>, href: `https://www.reddit.com/submit?url=${enc(url)}&title=${enc(post.title)}` },
    { label: "Email", icon: <Mail className="size-3.5" />, href: `mailto:?subject=${enc(post.title)}&body=${enc(url)}` },
  ];

  const btn = "relative flex h-9 items-center gap-2 rounded-full px-3 text-sm text-muted transition hover:bg-surface-2 hover:text-fg";

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Article actions">
      <button type="button" onClick={toggleLike} aria-pressed={state.liked} aria-label={state.liked ? "Unlike" : "Like"} className={cn(btn, state.liked && "text-danger hover:text-danger")}>
        <span className="relative">
          <motion.span key={state.liked ? "on" : "off"} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 15 }} className="block">
            <Heart className={cn("size-4", state.liked && "fill-current")} />
          </motion.span>
          <AnimatePresence>
            {burst ? (
              <motion.span key={burst} aria-hidden initial={{ opacity: 0.7, scale: 0.4 }} animate={{ opacity: 0, scale: 2.4 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} className="absolute inset-0 rounded-full border border-danger" />
            ) : null}
          </AnimatePresence>
        </span>
        <span className="tabular-nums">{compactNumber(state.likes)}</span>
      </button>
      <a href="#comments" className={btn} aria-label={`${state.comments} comments`}>
        <MessageCircle className="size-4" />
        <span className="tabular-nums">{state.comments}</span>
      </a>
      <button type="button" onClick={toggleSave} aria-pressed={state.saved} className={cn(btn, state.saved && "text-accent hover:text-accent")}>
        <Bookmark className={cn("size-4", state.saved && "fill-current")} />
        <span className="hidden sm:inline">{state.saved ? "Saved" : "Save"}</span>
      </button>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          className={btn}
          onPointerDown={async (e) => {
            if (window.matchMedia("(pointer: coarse)").matches && (await nativeShare())) e.preventDefault();
          }}
        >
          <Share2 className="size-4" />
          <span className="hidden sm:inline">Share</span>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content align="end" sideOffset={8} className="z-[70] min-w-44 rounded-xl border border-line-strong bg-surface p-1 shadow-2xl">
            <DropdownMenu.Item onSelect={copyLink} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-fg-2 outline-none data-[highlighted]:bg-surface-2 data-[highlighted]:text-fg">
              <Link2 className="size-3.5" /> Copy link
            </DropdownMenu.Item>
            {shareTargets.map((t) => (
              <DropdownMenu.Item key={t.label} asChild className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-fg-2 outline-none data-[highlighted]:bg-surface-2 data-[highlighted]:text-fg">
                <a href={t.href} target="_blank" rel="noopener noreferrer">
                  {t.icon} {t.label}
                </a>
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <span className="ml-auto hidden pl-3 font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-subtle sm:inline">{compactNumber(state.views)} views</span>
    </div>
  );
}

/** Records one view per visitor per dedup window (server decides). */
export function ViewTracker({ postId }: { postId: string }) {
  useEffect(() => {
    const t = setTimeout(() => {
      void fetch(`/api/posts/${postId}/view`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ referrer: document.referrer || null }) }).catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, [postId]);
  return null;
}
