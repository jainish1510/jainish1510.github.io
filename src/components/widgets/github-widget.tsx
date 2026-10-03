"use client";

import { Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { GitHubIcon } from "@/components/brand/icons";
import { Skeleton } from "@/components/ui/primitives";
import { relativeTime } from "@/lib/utils";

type Snapshot = {
  username: string;
  profileUrl: string;
  repos: { name: string; description: string | null; url: string; stars: number; language: string | null; pushedAt: string }[];
  totalStars: number;
  publicRepos: number;
  days: { date: string; count: number }[];
  contributionSource: "calendar" | "events";
  totalContributions: number;
  stale?: boolean;
  unavailable?: boolean;
};

export function GitHubWidget() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/github")
      .then((r) => r.json() as Promise<Snapshot>)
      .then(setData)
      .catch(() => setError(true));
  }, []);

  const weeks = useMemo(() => {
    if (!data?.days.length) return [];
    const days = data.days.slice(-26 * 7);
    const out: { date: string; count: number }[][] = [];
    for (let i = 0; i < days.length; i += 7) out.push(days.slice(i, i + 7));
    return out;
  }, [data]);
  const max = Math.max(1, ...(data?.days.map((d) => d.count) ?? [1]));

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between">
        <p className="eyebrow flex items-center gap-2">
          <GitHubIcon className="size-3.5" /> GitHub
        </p>
        {data ? (
          <a href={data.profileUrl} target="_blank" rel="noopener noreferrer" data-cursor="external" className="font-mono text-[0.6875rem] text-muted hover:text-fg">
            @{data.username} ↗
          </a>
        ) : null}
      </div>
      {!data && !error ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ) : error || data?.unavailable ? (
        <p className="mt-4 text-sm text-muted">Currently unavailable.</p>
      ) : data ? (
        <>
          {data.stale ? <p className="mt-3 text-xs text-warm">Currently unavailable. Showing the last available information.</p> : null}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              [data.totalContributions, data.contributionSource === "calendar" ? "contributions / yr" : "public events / 90d"],
              [data.publicRepos, "repositories"],
              [data.totalStars, "stars"],
            ].map(([v, l]) => (
              <div key={l as string}>
                <p className="font-mono text-xl tabular-nums text-fg">{v}</p>
                <p className="text-[0.6875rem] text-subtle">{l}</p>
              </div>
            ))}
          </div>
          {weeks.length ? (
            <div className="mt-4 flex gap-[3px] overflow-hidden" role="img" aria-label={`Activity heatmap, last ${weeks.length} weeks`}>
              {weeks.map((w, i) => (
                <div key={i} className="flex flex-col gap-[3px]">
                  {w.map((d) => (
                    <span
                      key={d.date}
                      title={`${d.date}: ${d.count}`}
                      className="size-[9px] rounded-[2px]"
                      style={{ background: d.count ? `color-mix(in oklab, var(--accent) ${20 + (d.count / max) * 80}%, var(--surface-2))` : "var(--surface-2)" }}
                    />
                  ))}
                </div>
              ))}
            </div>
          ) : null}
          <ul className="mt-5 space-y-2.5">
            {data.repos.slice(0, 4).map((r) => (
              <li key={r.name}>
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="group block">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-fg group-hover:text-accent-strong">{r.name}</span>
                    <span className="flex shrink-0 items-center gap-2 font-mono text-[0.625rem] text-subtle">
                      {r.language}
                      {r.stars ? (
                        <span className="flex items-center gap-0.5">
                          <Star className="size-3" />
                          {r.stars}
                        </span>
                      ) : null}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted">{r.description ?? `Updated ${relativeTime(r.pushedAt)}`}</p>
                </a>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
