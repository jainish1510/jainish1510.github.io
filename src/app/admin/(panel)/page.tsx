import { ArrowRight, PenLine } from "lucide-react";
import Link from "next/link";
import { TimeSeries } from "@/components/admin/charts";
import { PageHeader } from "@/components/admin/shell";
import { Panel, Stat } from "@/components/admin/stat";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import { requireAdmin } from "@/lib/auth";
import { adminListComments } from "@/lib/repositories/comments";
import { getAnalytics, getTotals } from "@/lib/repositories/analytics";
import { adminListPosts, postStatusCounts } from "@/lib/repositories/posts";
import { db } from "@/lib/db/client";
import { compactNumber, relativeTime } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireAdmin();
  const [counts, totals, analytics, recent, pending, media, demo] = await Promise.all([
    postStatusCounts(),
    getTotals(),
    getAnalytics(30),
    adminListPosts({ sort: "updated" }),
    adminListComments({ status: "PENDING" }),
    db.media.count(),
    db.view.count({ where: { metadata: { contains: '"demo":true' } } }),
  ]);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <>
      <PageHeader
        title={`${greeting}, ${user.name.split(" ")[0]}.`}
        description={`${counts.DRAFT} drafts waiting · ${totals.pending} comments to moderate · ${totals.messages} unread messages`}
        actions={
          <Link href="/admin/posts/new" className={buttonVariants({ variant: "primary" })}>
            <PenLine /> Write
          </Link>
        }
      />
      {demo ? (
        <p className="mb-6 rounded-lg border border-line bg-surface px-4 py-2.5 text-xs text-muted">
          Includes {demo.toLocaleString()} seeded demo views. Run <code className="font-mono text-fg-2">npm run db:seed -- --no-demo</code> for a clean slate.
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Published posts" value={counts.PUBLISHED} hint={`${counts.ARCHIVED} archived`} />
        <Stat label="Drafts" value={counts.DRAFT} hint="autosaved" />
        <Stat label="Total views" value={compactNumber(totals.views)} trend={analytics.summary.viewsChange} />
        <Stat label="Comments" value={totals.comments} hint={`${totals.pending} pending`} />
        <Stat label="Likes" value={totals.likes} />
        <Stat label="Bookmarks" value={totals.bookmarks} />
        <Stat label="Media files" value={media} />
        <Stat label="Views (30d)" value={compactNumber(analytics.summary.views)} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel
          title="Views · last 30 days"
          action={
            <Link href="/admin/analytics" className="text-xs text-muted hover:text-fg">
              Analytics →
            </Link>
          }
        >
          <TimeSeries data={analytics.series.views} unit="views" id="dash-views" />
        </Panel>
        <Panel
          title="Moderation queue"
          action={
            <Link href="/admin/comments?status=PENDING" className="text-xs text-muted hover:text-fg">
              Open →
            </Link>
          }
        >
          {pending.length ? (
            <ul className="divide-y divide-line">
              {pending.slice(0, 4).map((c) => (
                <li key={c.id} className="py-2.5">
                  <p className="text-xs text-muted">
                    <span className="text-fg-2">{c.authorName}</span> on {c.post.title} · {relativeTime(c.createdAt)}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-fg-2">{c.content}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-muted">Inbox zero. Nothing to moderate.</p>
          )}
        </Panel>
      </div>

      <Panel
        className="mt-6"
        title="Recent posts"
        action={
          <Link href="/admin/posts" className="flex items-center gap-1 text-xs text-muted hover:text-fg">
            All posts <ArrowRight className="size-3" />
          </Link>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left font-mono text-[0.625rem] uppercase tracking-[0.12em] text-subtle">
                <th className="pb-2 font-normal">Post</th>
                <th className="pb-2 font-normal">Status</th>
                <th className="pb-2 text-right font-normal">Views</th>
                <th className="hidden pb-2 text-right font-normal sm:table-cell">Edited</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {recent.slice(0, 6).map((p) => (
                <tr key={p.id}>
                  <td className="py-2.5 pr-4">
                    <Link href={`/admin/posts/${p.id}/edit`} className="text-fg hover:text-accent-strong">
                      {p.title}
                    </Link>
                  </td>
                  <td className="py-2.5">
                    <Badge tone={p.status === "PUBLISHED" ? "success" : p.status === "DRAFT" ? "warm" : "outline"}>{p.status.toLowerCase()}</Badge>
                  </td>
                  <td className="py-2.5 text-right font-mono text-xs tabular-nums text-fg-2">{p.status === "PUBLISHED" ? p._count.views.toLocaleString() : "–"}</td>
                  <td className="hidden py-2.5 text-right text-xs text-muted sm:table-cell">{relativeTime(p.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Media library", "/admin/media", "Upload images & video"],
          ["Tags & categories", "/admin/taxonomy", "Organise the archive"],
          ["Projects", "/admin/content/projects", "Portfolio entries"],
          ["Site settings", "/admin/settings", "Bio, homepage, nav"],
        ].map(([label, href, hint]) => (
          <Link key={href} href={href!} className="group rounded-xl border border-line p-4 transition hover:border-line-strong hover:bg-surface">
            <p className="text-sm text-fg group-hover:text-accent-strong">{label}</p>
            <p className="text-xs text-muted">{hint}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
