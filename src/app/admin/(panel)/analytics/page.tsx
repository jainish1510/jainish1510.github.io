import Link from "next/link";
import { RankBars, TimeSeries } from "@/components/admin/charts";
import { PageHeader } from "@/components/admin/shell";
import { Panel, Stat } from "@/components/admin/stat";
import { getAnalytics, getTotals, type Period } from "@/lib/repositories/analytics";
import { cn, compactNumber } from "@/lib/utils";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const p = Number((await searchParams).period);
  const period: Period = p === 7 || p === 90 ? p : 30;
  const [a, totals] = await Promise.all([getAnalytics(period), getTotals()]);

  return (
    <>
      <PageHeader
        title="Analytics"
        description="First-party, cookie-light analytics from the SQLite database. Views are de-duplicated per reader every 6 hours; bots are excluded."
        actions={
          <div className="flex rounded-lg border border-line p-0.5" role="tablist" aria-label="Time period">
            {[7, 30, 90].map((d) => (
              <Link key={d} href={`/admin/analytics?period=${d}`} role="tab" aria-selected={period === d} className={cn("rounded-md px-3 py-1 text-xs", period === d ? "bg-surface-2 text-fg" : "text-muted hover:text-fg")}>
                {d}d
              </Link>
            ))}
          </div>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Total views" value={compactNumber(totals.views)} hint="all time" />
        <Stat label={`Views · ${period}d`} value={compactNumber(a.summary.views)} trend={a.summary.viewsChange} />
        <Stat label="Likes" value={totals.likes} hint={`${a.summary.likes} in ${period}d`} />
        <Stat label="Bookmarks" value={totals.bookmarks} hint={`${totals.comments} approved comments`} />
      </div>

      <Panel className="mt-6" title={`Views over time · ${period} days`}>
        <TimeSeries data={a.series.views} unit="views" id="views" height={260} />
      </Panel>

      {/* Small multiples instead of a dual-axis chart. */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Likes over time">
          <TimeSeries data={a.series.likes} unit="likes" id="likes" height={170} />
        </Panel>
        <Panel title="Comments over time">
          <TimeSeries data={a.series.comments} unit="comments" id="comments" height={170} />
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Most read articles" className="lg:col-span-2">
          <ol className="divide-y divide-line">
            {a.topPosts.map((post, i) => (
              <li key={post.id} className="flex items-center gap-4 py-2.5 text-sm">
                <span className="w-5 font-mono text-xs text-subtle">{i + 1}</span>
                <Link href={`/admin/posts/${post.id}/edit`} className="min-w-0 flex-1 truncate text-fg-2 hover:text-fg">
                  {post.title}
                </Link>
                <span className="hidden font-mono text-xs text-subtle sm:inline">
                  ♥ {post._count.likes} · 💬 {post._count.comments} · 🔖 {post._count.bookmarks}
                </span>
                <span className="w-14 text-right font-mono text-xs tabular-nums text-fg">{post._count.views.toLocaleString()}</span>
              </li>
            ))}
          </ol>
        </Panel>
        <Panel title="Popular tags (views)">
          <RankBars items={a.topTags} unit="views" />
        </Panel>
        <Panel title="Referrers">
          <RankBars items={a.referrers} unit="views" />
        </Panel>
        <Panel title="Devices">
          <RankBars items={a.devices} unit="views" />
        </Panel>
        <Panel title="Project clicks">
          <RankBars items={a.projectClicks} unit="clicks" />
        </Panel>
      </div>

      <details className="mt-6 rounded-xl border border-line px-5 py-3">
        <summary className="cursor-pointer text-sm text-muted">Daily table ({period} days)</summary>
        <div className="mt-3 max-h-80 overflow-y-auto">
          <table className="w-full font-mono text-xs">
            <thead className="sticky top-0 bg-bg text-left text-subtle">
              <tr>
                <th className="py-1.5 font-normal">Date</th>
                <th className="py-1.5 text-right font-normal">Views</th>
                <th className="py-1.5 text-right font-normal">Likes</th>
                <th className="py-1.5 text-right font-normal">Comments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-fg-2">
              {a.series.views.map((v, i) => (
                <tr key={v.date}>
                  <td className="py-1">{v.date}</td>
                  <td className="py-1 text-right tabular-nums">{v.value}</td>
                  <td className="py-1 text-right tabular-nums">{a.series.likes[i]?.value}</td>
                  <td className="py-1 text-right tabular-nums">{a.series.comments[i]?.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}
