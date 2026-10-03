"use client";

import { Ban, Check, CornerDownRight, ExternalLink, Loader2, ShieldAlert, Trash2, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { moderateAction, replyAction } from "@/app/admin/actions/comments";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/form";
import { Badge, EmptyState } from "@/components/ui/primitives";
import type { CommentStatus } from "@/lib/constants";
import { cn, relativeTime } from "@/lib/utils";

type Row = {
  id: string;
  authorName: string;
  authorEmail: string | null;
  content: string;
  status: string;
  isAuthor: boolean;
  isDemo: boolean;
  spamScore: number;
  createdAt: string;
  post: { title: string; slug: string };
  parent: { authorName: string; content: string } | null;
  likes: number;
  replies: number;
};

type Action = "APPROVED" | "REJECTED" | "SPAM" | "PENDING" | "DELETE";
const TONE = { PENDING: "warm", APPROVED: "success", REJECTED: "outline", SPAM: "danger" } as const;

export function CommentModeration({ comments, counts, posts, filters }: { comments: Row[]; counts: Record<CommentStatus, number>; posts: { id: string; title: string }[]; filters: { status: string; post: string; order: string; q: string } }) {
  const router = useRouter();
  const pathname = usePathname();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [replying, setReplying] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [pending, start] = useTransition();

  const set = (patch: Partial<typeof filters>) => {
    const n = { ...filters, ...patch };
    const sp = new URLSearchParams();
    sp.set("status", n.status);
    if (n.post) sp.set("post", n.post);
    if (n.order !== "newest") sp.set("order", n.order);
    start(() => router.replace(`${pathname}?${sp}`));
  };

  const act = (ids: string[], action: Action) =>
    start(async () => {
      if (action === "DELETE" && !confirm(`Delete ${ids.length} comment(s) permanently? Replies are deleted too.`)) return;
      await moderateAction(ids, action);
      setSelected(new Set());
      toast.success(`${ids.length} comment${ids.length > 1 ? "s" : ""} ${action === "DELETE" ? "deleted" : `→ ${action.toLowerCase()}`}`);
      router.refresh();
    });

  const sendReply = (id: string) =>
    start(async () => {
      const r = await replyAction(id, reply);
      if (!r.ok) return void toast.error(r.error);
      setReply("");
      setReplying(null);
      toast.success("Reply published");
      router.refresh();
    });

  const tabs: [string, string, number | null][] = [
    ["PENDING", "Pending", counts.PENDING],
    ["APPROVED", "Approved", counts.APPROVED],
    ["SPAM", "Spam", counts.SPAM],
    ["REJECTED", "Rejected", counts.REJECTED],
    ["ALL", "All", null],
  ];

  return (
    <div className={cn(pending && "opacity-70 transition-opacity")}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tabs.slice(0, 4).map(([k, label, n]) => (
          <button key={k} type="button" onClick={() => set({ status: k })} className={cn("rounded-xl border p-4 text-left transition", filters.status === k ? "border-accent/50 bg-accent-soft" : "border-line bg-surface hover:border-line-strong")}>
            <p className="eyebrow">{label}</p>
            <p className="mt-1 font-mono text-2xl tabular-nums text-fg">{n}</p>
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="flex gap-1" role="tablist">
          {tabs.map(([k, label]) => (
            <button key={k} role="tab" aria-selected={filters.status === k} type="button" onClick={() => set({ status: k })} className={cn("rounded-lg px-3 py-1.5 text-sm", filters.status === k ? "bg-surface-2 text-fg" : "text-muted hover:text-fg")}>
              {label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <Select value={filters.post} onChange={(e) => set({ post: e.target.value })} className="w-56" aria-label="Filter by post">
            <option value="">All posts</option>
            {posts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </Select>
          <Select value={filters.order} onChange={(e) => set({ order: e.target.value })} className="w-32" aria-label="Order">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </Select>
        </div>
      </div>

      {selected.size ? (
        <div className="sticky top-16 z-10 mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-line-strong bg-surface px-4 py-2 shadow-xl lg:top-4">
          <span className="text-sm text-fg">{selected.size} selected</span>
          <Button size="sm" variant="secondary" onClick={() => act([...selected], "APPROVED")}>
            <Check /> Approve
          </Button>
          <Button size="sm" variant="secondary" onClick={() => act([...selected], "REJECTED")}>
            <X /> Reject
          </Button>
          <Button size="sm" variant="secondary" onClick={() => act([...selected], "SPAM")}>
            <ShieldAlert /> Spam
          </Button>
          <Button size="sm" variant="ghost" className="text-danger" onClick={() => act([...selected], "DELETE")}>
            <Trash2 /> Delete
          </Button>
          <button type="button" className="ml-auto text-xs text-muted" onClick={() => setSelected(new Set())}>
            Clear
          </button>
        </div>
      ) : null}

      {comments.length === 0 ? (
        <EmptyState className="mt-6" title={filters.status === "PENDING" ? "Nothing waiting for review." : "No comments here."} description={filters.status === "PENDING" ? "New comments land here before they go public." : undefined} />
      ) : (
        <ul className="mt-4 divide-y divide-line overflow-hidden rounded-xl border border-line">
          <li className="flex items-center gap-3 bg-surface px-4 py-2">
            <input
              type="checkbox"
              aria-label="Select all"
              checked={selected.size === comments.length}
              onChange={(e) => setSelected(e.target.checked ? new Set(comments.map((c) => c.id)) : new Set())}
              className="accent-[var(--accent)]"
            />
            <span className="eyebrow">{comments.length} comments</span>
          </li>
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3 px-4 py-4 hover:bg-surface/50">
              <input
                type="checkbox"
                aria-label={`Select comment by ${c.authorName}`}
                checked={selected.has(c.id)}
                onChange={(e) => {
                  const n = new Set(selected);
                  if (e.target.checked) n.add(c.id);
                  else n.delete(c.id);
                  setSelected(n);
                }}
                className="mt-1 accent-[var(--accent)]"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-sm font-medium text-fg">{c.authorName}</span>
                  {c.authorEmail ? <span className="text-subtle">{c.authorEmail}</span> : null}
                  <Badge tone={TONE[c.status as keyof typeof TONE] ?? "neutral"}>{c.status.toLowerCase()}</Badge>
                  {c.isAuthor ? <Badge tone="accent">you</Badge> : null}
                  {c.isDemo ? <Badge tone="outline">demo</Badge> : null}
                  {c.spamScore > 0 ? <Badge tone={c.spamScore >= 4 ? "danger" : "warm"}>spam score {c.spamScore}</Badge> : null}
                  <span className="text-subtle">{relativeTime(c.createdAt)}</span>
                </div>
                <Link href={`/blog/${c.post.slug}#comments`} target="_blank" className="mt-1 inline-flex items-center gap-1 text-xs text-muted hover:text-fg">
                  on {c.post.title} <ExternalLink className="size-3" />
                </Link>
                {c.parent ? (
                  <p className="mt-2 border-l border-line pl-3 text-xs text-subtle">
                    ↳ replying to {c.parent.authorName}: “{c.parent.content.slice(0, 120)}”
                  </p>
                ) : null}
                <p className="mt-2 whitespace-pre-line break-words text-sm text-fg-2">{c.content}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {c.status !== "APPROVED" ? (
                    <Button size="sm" variant="secondary" onClick={() => act([c.id], "APPROVED")}>
                      <Check /> Approve
                    </Button>
                  ) : null}
                  {c.status !== "REJECTED" ? (
                    <Button size="sm" variant="ghost" onClick={() => act([c.id], "REJECTED")}>
                      <Ban /> Reject
                    </Button>
                  ) : null}
                  {c.status !== "SPAM" ? (
                    <Button size="sm" variant="ghost" onClick={() => act([c.id], "SPAM")}>
                      <ShieldAlert /> Spam
                    </Button>
                  ) : null}
                  <Button size="sm" variant="ghost" onClick={() => setReplying(replying === c.id ? null : c.id)}>
                    <CornerDownRight /> Reply
                  </Button>
                  <Button size="sm" variant="ghost" className="text-danger" onClick={() => act([c.id], "DELETE")}>
                    <Trash2 /> Delete
                  </Button>
                </div>
                {replying === c.id ? (
                  <div className="mt-3 space-y-2">
                    <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply as the author (approves this comment)…" autoFocus aria-label="Reply" />
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setReplying(null)}>
                        Cancel
                      </Button>
                      <Button size="sm" variant="primary" onClick={() => sendReply(c.id)} disabled={pending}>
                        {pending ? <Loader2 className="animate-spin" /> : null} Publish reply
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
