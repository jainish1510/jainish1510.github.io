"use client";

import { ChevronDown, CornerDownRight, Heart, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/form";
import { Badge, Skeleton } from "@/components/ui/primitives";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { COMMENT_LIMITS } from "@/lib/constants";
import type { PublicComment } from "@/lib/repositories/comments";
import { cn, hashString, initials, relativeTime } from "@/lib/utils";

function countAll(list: PublicComment[]): number {
  return list.reduce((n, c) => n + 1 + countAll(c.replies), 0);
}

export function Comments({ postId, authorName }: { postId: string; authorName: string }) {
  const [comments, setComments] = useState<PublicComment[] | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      if (!res.ok) throw new Error();
      setComments(((await res.json()) as { comments: PublicComment[] }).comments);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [postId]);

  useEffect(() => {
    void load();
  }, [load]);

  const total = comments ? countAll(comments) : 0;

  return (
    <section id="comments" aria-labelledby="comments-heading" className="scroll-mt-24">
      <div className="flex items-baseline justify-between border-b border-line pb-4">
        <h2 id="comments-heading" className="eyebrow !text-fg">
          {comments ? `${total} ${total === 1 ? "Comment" : "Comments"}` : "Comments"}
        </h2>
        <span className="text-xs text-subtle">Moderated · be kind</span>
      </div>

      <div className="mt-8">
        <CommentForm postId={postId} onPosted={load} />
      </div>

      <div className="mt-12">
        {failed ? (
          <p className="rounded-xl border border-line p-6 text-sm text-muted">
            Comments are currently unavailable.{" "}
            <button type="button" onClick={load} className="text-fg underline underline-offset-4">
              Retry
            </button>
          </p>
        ) : comments === null ? (
          <div className="space-y-6" aria-label="Loading comments">
            {[0, 1].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="size-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-lg tracking-tight text-fg">No comments yet.</p>
            <p className="mt-1 text-sm text-muted">Start the conversation.</p>
          </div>
        ) : (
          <ol className="space-y-8">
            {comments.map((c) => (
              <CommentNode key={c.id} comment={c} postId={postId} authorName={authorName} onPosted={load} />
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

function Avatar({ name, author }: { name: string; author?: boolean }) {
  const hue = hashString(name) % 360;
  return (
    <span
      aria-hidden
      className={cn("grid size-9 shrink-0 place-items-center rounded-full border font-mono text-[0.6875rem] font-medium", author ? "border-accent/50 text-accent" : "border-line text-fg-2")}
      style={author ? { background: "var(--accent-soft)" } : { background: `hsl(${hue} 30% 50% / 0.14)` }}
    >
      {initials(name)}
    </span>
  );
}

function CommentNode({ comment, postId, authorName, onPosted }: { comment: PublicComment; postId: string; authorName: string; onPosted: () => void }) {
  const [replying, setReplying] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [like, setLike] = useState({ liked: comment.liked, count: comment.likes });
  const busy = useRef(false);

  async function toggleLike() {
    if (busy.current) return;
    busy.current = true;
    const prev = like;
    const liked = !prev.liked;
    setLike({ liked, count: prev.count + (liked ? 1 : -1) });
    try {
      const res = await fetch(`/api/comments/${comment.id}/like`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ liked }) });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { liked: boolean; count: number };
      setLike({ liked: data.liked, count: data.count });
    } catch {
      setLike(prev);
      toast.error("Couldn't update the like.");
    } finally {
      busy.current = false;
    }
  }

  const replyCount = countAll(comment.replies);

  return (
    <li className="group/comment">
      <article className="flex gap-4" aria-label={`Comment by ${comment.authorName}`}>
        <Avatar name={comment.authorName} author={comment.isAuthor} />
        <div className="min-w-0 flex-1">
          <header className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-medium text-fg">{comment.isAuthor ? authorName : comment.authorName}</span>
            {comment.isAuthor ? <Badge tone="accent">author</Badge> : null}
            {comment.isDemo && !comment.isAuthor ? <Badge tone="outline">demo</Badge> : null}
            <time dateTime={comment.createdAt} title={new Date(comment.createdAt).toLocaleString()} className="text-xs text-subtle">
              {relativeTime(comment.createdAt)}
            </time>
          </header>
          <p className="mt-1.5 whitespace-pre-line break-words text-[0.9375rem] leading-relaxed text-fg-2">{comment.content}</p>
          <div className="mt-2 flex items-center gap-1 text-xs text-muted">
            <button type="button" onClick={toggleLike} aria-pressed={like.liked} aria-label={like.liked ? "Unlike comment" : "Like comment"} className={cn("flex items-center gap-1.5 rounded-full px-2 py-1 transition hover:bg-surface-2 hover:text-fg", like.liked && "text-danger hover:text-danger")}>
              <Heart className={cn("size-3.5", like.liked && "fill-current")} />
              <span className="tabular-nums">{like.count}</span>
            </button>
            <button type="button" onClick={() => setReplying((r) => !r)} aria-expanded={replying} className="rounded-full px-2 py-1 transition hover:bg-surface-2 hover:text-fg">
              Reply
            </button>
            {replyCount ? (
              <button type="button" onClick={() => setCollapsed((c) => !c)} aria-expanded={!collapsed} className="flex items-center gap-1 rounded-full px-2 py-1 transition hover:bg-surface-2 hover:text-fg">
                <ChevronDown className={cn("size-3.5 transition", collapsed && "-rotate-90")} />
                {collapsed ? `Show ${replyCount} ${replyCount === 1 ? "reply" : "replies"}` : "Hide replies"}
              </button>
            ) : null}
          </div>
          <AnimatePresence initial={false}>
            {replying ? (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="pt-4">
                  <CommentForm
                    postId={postId}
                    parentId={comment.id}
                    compact
                    onCancel={() => setReplying(false)}
                    onPosted={() => {
                      setReplying(false);
                      onPosted();
                    }}
                  />
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </article>
      <AnimatePresence initial={false}>
        {comment.replies.length && !collapsed ? (
          <motion.ol initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="ml-[1.1rem] mt-6 space-y-6 overflow-hidden border-l border-line pl-5 sm:pl-7">
            {comment.replies.map((r) => (
              <CommentNode key={r.id} comment={r} postId={postId} authorName={authorName} onPosted={onPosted} />
            ))}
          </motion.ol>
        ) : null}
      </AnimatePresence>
    </li>
  );
}

function CommentForm({ postId, parentId, compact, onPosted, onCancel }: { postId: string; parentId?: string; compact?: boolean; onPosted: () => void; onCancel?: () => void }) {
  const [identity, setIdentity] = useLocalStorage("studio-commenter", { name: "", email: "" });
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const openedAt = useRef(Date.now());
  const honeypot = useRef<HTMLInputElement>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setNotice(null);
    if (!identity.name.trim()) return setNotice({ tone: "error", text: "Please add your name." });
    if (content.trim().length < 2) return setNotice({ tone: "error", text: "Write a little more first." });
    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: parentId ?? null,
          name: identity.name,
          email: identity.email || null,
          content,
          website: honeypot.current?.value ?? "",
          elapsed: Date.now() - openedAt.current,
        }),
      });
      const data = (await res.json()) as { status?: string; message?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setContent("");
      setNotice({ tone: "ok", text: data.message ?? "Thanks!" });
      if (data.status === "APPROVED") onPosted();
    } catch (err) {
      setNotice({ tone: "error", text: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  }

  const id = parentId ? `reply-${parentId}` : "comment";

  return (
    <form onSubmit={submit} className={cn("rounded-2xl border border-line bg-surface p-4 sm:p-5", compact && "bg-bg-raised")} noValidate>
      {!compact ? <p className="mb-4 text-sm font-medium text-fg">Share your thoughts</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-name`} className="sr-only">
            Name
          </label>
          <Input id={`${id}-name`} placeholder="Name" autoComplete="name" required maxLength={COMMENT_LIMITS.name} value={identity.name} onChange={(e) => setIdentity({ ...identity, name: e.target.value })} />
        </div>
        <div>
          <label htmlFor={`${id}-email`} className="sr-only">
            Email (optional, never shown)
          </label>
          <Input id={`${id}-email`} type="email" placeholder="Email (optional, never shown)" autoComplete="email" maxLength={COMMENT_LIMITS.email} value={identity.email} onChange={(e) => setIdentity({ ...identity, email: e.target.value })} />
        </div>
      </div>
      {/* Honeypot: hidden from people and assistive tech, irresistible to bots. */}
      <div aria-hidden className="absolute left-[-10000px] h-px w-px overflow-hidden">
        <label htmlFor={`${id}-website`}>Website</label>
        <input ref={honeypot} id={`${id}-website`} name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <label htmlFor={`${id}-content`} className="sr-only">
        Comment
      </label>
      <Textarea
        id={`${id}-content`}
        className="mt-3 min-h-28 resize-y"
        placeholder={parentId ? "Write a reply…" : "Write a comment…"}
        maxLength={COMMENT_LIMITS.content}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className={cn("text-xs", notice ? (notice.tone === "ok" ? "text-success" : "text-danger") : "text-subtle")} role="status" aria-live="polite">
          {notice?.text ?? `${content.length.toLocaleString()} / ${COMMENT_LIMITS.content.toLocaleString()} · plain text`}
        </p>
        <div className="flex gap-2">
          {onCancel ? (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" variant="primary" size="sm" disabled={submitting}>
            {submitting ? <Loader2 className="animate-spin" /> : parentId ? <CornerDownRight /> : null}
            {parentId ? "Reply" : "Comment"}
          </Button>
        </div>
      </div>
    </form>
  );
}
