"use client";

import { Archive, ExternalLink, Eye, MoreHorizontal, Pencil, Rocket, Undo2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { DropdownMenu } from "radix-ui";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { setPostStatusAction } from "@/app/admin/actions/posts";
import { Input, Select } from "@/components/ui/form";
import { Badge, EmptyState } from "@/components/ui/primitives";
import type { PostStatus } from "@/lib/constants";
import { cn, compactNumber, formatDate, relativeTime } from "@/lib/utils";

type Row = {
  id: string;
  slug: string;
  title: string;
  status: string;
  featured: boolean;
  isDemo: boolean;
  publishedAt: string | null;
  updatedAt: string;
  readingTime: number;
  category: { name: string } | null;
  _count: { views: number; likes: number; comments: number };
};

const TONE = { PUBLISHED: "success", DRAFT: "warm", ARCHIVED: "outline" } as const;

export function PostsTable({ posts, counts, categories, filters }: { posts: Row[]; counts: Record<PostStatus, number>; categories: { id: string; name: string }[]; filters: { status: string; q: string; category: string; sort: string } }) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(filters.q);
  const [pending, start] = useTransition();

  const set = (patch: Partial<typeof filters>) => {
    const next = { ...filters, ...patch };
    const sp = new URLSearchParams();
    if (next.status && next.status !== "ALL") sp.set("status", next.status);
    if (next.q) sp.set("q", next.q);
    if (next.category) sp.set("category", next.category);
    if (next.sort && next.sort !== "updated") sp.set("sort", next.sort);
    start(() => router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`));
  };

  useEffect(() => {
    if (q === filters.q) return;
    const t = setTimeout(() => set({ q }), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function changeStatus(id: string, status: PostStatus) {
    await setPostStatusAction(id, status);
    toast.success(`Moved to ${status.toLowerCase()}`);
    router.refresh();
  }

  const total = counts.DRAFT + counts.PUBLISHED + counts.ARCHIVED;
  const tabs: [string, string, number][] = [
    ["ALL", "All", total],
    ["PUBLISHED", "Published", counts.PUBLISHED],
    ["DRAFT", "Drafts", counts.DRAFT],
    ["ARCHIVED", "Archived", counts.ARCHIVED],
  ];

  return (
    <div className={cn("transition-opacity", pending && "opacity-60")}>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-1 overflow-x-auto" role="tablist">
          {tabs.map(([key, label, n]) => (
            <button key={key} role="tab" aria-selected={filters.status === key} type="button" onClick={() => set({ status: key })} className={cn("shrink-0 rounded-lg px-3 py-1.5 text-sm", filters.status === key ? "bg-surface-2 text-fg" : "text-muted hover:text-fg")}>
              {label} <span className="font-mono text-xs text-subtle">{n}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search posts…" className="w-full lg:w-56" aria-label="Search posts" />
          <Select value={filters.category} onChange={(e) => set({ category: e.target.value })} className="w-40" aria-label="Category">
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select value={filters.sort} onChange={(e) => set({ sort: e.target.value })} className="w-36" aria-label="Sort">
            <option value="updated">Last edited</option>
            <option value="published">Published</option>
            <option value="views">Most viewed</option>
          </Select>
        </div>
      </div>

      {posts.length === 0 ? (
        <EmptyState title="No posts match." description="Try a different filter, or write something new." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead className="hidden bg-surface text-left md:table-header-group">
              <tr className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-subtle">
                <th className="px-4 py-2.5 font-normal">Post</th>
                <th className="px-4 py-2.5 font-normal">Status</th>
                <th className="px-4 py-2.5 text-right font-normal">Views</th>
                <th className="px-4 py-2.5 text-right font-normal">Likes</th>
                <th className="px-4 py-2.5 text-right font-normal">Comments</th>
                <th className="px-4 py-2.5 font-normal">Updated</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {posts.map((p) => (
                <tr key={p.id} className="group relative flex flex-col gap-1 px-4 py-3 hover:bg-surface/60 md:table-row md:p-0">
                  <td className="md:px-4 md:py-3">
                    <Link href={`/admin/posts/${p.id}/edit`} className="font-medium text-fg hover:text-accent-strong">
                      {p.title}
                    </Link>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-subtle">
                      {p.category?.name ?? "Uncategorised"} · {p.readingTime} min
                      {p.featured ? <Badge tone="accent">featured</Badge> : null}
                      {p.isDemo ? <Badge tone="outline">demo</Badge> : null}
                    </div>
                  </td>
                  <td className="md:px-4 md:py-3">
                    <Badge tone={TONE[p.status as keyof typeof TONE] ?? "neutral"}>{p.status.toLowerCase()}</Badge>
                    {p.status === "PUBLISHED" && p.publishedAt && new Date(p.publishedAt) > new Date() ? <Badge tone="warm" className="ml-1">scheduled</Badge> : null}
                  </td>
                  <td className="font-mono text-xs tabular-nums text-fg-2 md:px-4 md:py-3 md:text-right">
                    <span className="md:hidden">Views </span>
                    {p.status === "PUBLISHED" ? compactNumber(p._count.views) : "–"}
                  </td>
                  <td className="hidden font-mono text-xs tabular-nums text-fg-2 md:table-cell md:px-4 md:py-3 md:text-right">{p._count.likes}</td>
                  <td className="hidden font-mono text-xs tabular-nums text-fg-2 md:table-cell md:px-4 md:py-3 md:text-right">{p._count.comments}</td>
                  <td className="text-xs text-muted md:px-4 md:py-3" title={formatDate(p.updatedAt)}>
                    {relativeTime(p.updatedAt)}
                  </td>
                  <td className="absolute right-4 md:static md:px-2">
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger aria-label={`Actions for ${p.title}`} className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-fg">
                        <MoreHorizontal className="size-4" />
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content align="end" className="z-50 min-w-44 rounded-xl border border-line-strong bg-surface p-1 text-sm shadow-2xl">
                          {[
                            { label: "Edit", icon: <Pencil />, onSelect: () => router.push(`/admin/posts/${p.id}/edit`) },
                            { label: "Preview", icon: <Eye />, onSelect: () => window.open(`/admin/posts/${p.id}/preview`, "_blank") },
                            ...(p.status === "PUBLISHED" ? [{ label: "View live", icon: <ExternalLink />, onSelect: () => window.open(`/blog/${p.slug}`, "_blank") }] : []),
                            ...(p.status !== "PUBLISHED" ? [{ label: "Publish", icon: <Rocket />, onSelect: () => changeStatus(p.id, "PUBLISHED") }] : []),
                            ...(p.status === "PUBLISHED" ? [{ label: "Revert to draft", icon: <Undo2 />, onSelect: () => changeStatus(p.id, "DRAFT") }] : []),
                            ...(p.status !== "ARCHIVED" ? [{ label: "Archive", icon: <Archive />, onSelect: () => changeStatus(p.id, "ARCHIVED") }] : []),
                          ].map((item) => (
                            <DropdownMenu.Item key={item.label} onSelect={item.onSelect} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-fg-2 outline-none data-[highlighted]:bg-surface-2 data-[highlighted]:text-fg [&_svg]:size-3.5">
                              {item.icon} {item.label}
                            </DropdownMenu.Item>
                          ))}
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
