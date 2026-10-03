"use client";

import { Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { GitHubIcon } from "@/components/brand/icons";
import { Skeleton } from "@/components/ui/primitives";
import { relativeTime } from "@/lib/utils";

type Repo = { name: string; description: string | null; url: string; stars: number; language: string | null; pushedAt: string };
type Snapshot = { username: string; profileUrl: string; repos: Repo[]; totalStars: number; publicRepos: number; days: { date: string; count: number }[]; totalEvents: number; fetchedAt: number };

const API = "https://api.github.com";
const TTL = 60 * 60 * 1000; // an hour — keeps us far below GitHub's unauthenticated rate limit

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { headers: { Accept: "application/vnd.github+json" } });
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  return (await res.json()) as T;
}

async function fetchSnapshot(username: string): Promise<Snapshot> {
  const [user, repos, ...pages] = await Promise.all([
    get<{ public_repos: number; html_url: string }>(`/users/${username}`),
    get<{ name: string; description: string | null; html_url: string; stargazers_count: number; language: string | null; pushed_at: string; fork: boolean }[]>(`/users/${username}/repos?sort=pushed&per_page=100`),
    ...[1, 2, 3].map((p) => get<{ created_at: string; type: string; payload?: { size?: number } }[]>(`/users/${username}/events/public?per_page=100&page=${p}`).catch(() => [])),
  ]);
  const counts = new Map<string, number>();
  for (const e of pages.flat()) {
    const day = e.created_at.slice(0, 10);
    counts.set(day, (counts.get(day) ?? 0) + (e.type === "PushEvent" ? Math.max(1, e.payload?.size ?? 1) : 1));
  }
  const days = Array.from({ length: 26 * 7 }, (_, i) => {
    const date = new Date(Date.now() - (26 * 7 - 1 - i) * 86400000).toISOString().slice(0, 10);
    return { date, count: counts.get(date) ?? 0 };
  });
  const own = repos.filter((r) => !r.fork);
  return {
    username,
    profileUrl: user.html_url,
    publicRepos: user.public_repos,
    totalStars: own.reduce((s, r) => s + r.stargazers_count, 0),
    repos: own.slice(0, 6).map((r) => ({ name: r.name, description: r.description, url: r.html_url, stars: r.stargazers_count, language: r.language, pushedAt: r.pushed_at })),
    days,
    totalEvents: days.reduce((s, d) => s + d.count, 0),
    fetchedAt: Date.now(),
  };
}

/**
 * Loaded in the visitor's browser from GitHub's public API (no token, no
 * server). The last good answer is kept in localStorage and shown if GitHub
 * is unreachable or rate-limited.
 */
export function GitHubWidget({ username }: { username: string }) {
  const [data, setData] = useState<(Snapshot & { stale?: boolean }) | null>(null);
  const [failed, setFailed] = useState(false);
  const key = `studio-github-${username}`;

  useEffect(() => {
    let cancelled = false;
    let cached: Snapshot | null = null;
    try {
      cached = JSON.parse(localStorage.getItem(key) ?? "null") as Snapshot | null;
    } catch {
      /* ignore */
    }
    if (cached && Date.now() - cached.fetchedAt < TTL) {
      setData(cached);
      return;
    }
    fetchSnapshot(username)
      .then((snap) => {
        if (cancelled) return;
        setData(snap);
        try {
          localStorage.setItem(key, JSON.stringify(snap));
        } catch {
          /* ignore */
        }
      })
      .catch(() => {
        if (cancelled) return;
        if (cached) setData({ ...cached, stale: true });
        else setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [username, key]);

  const weeks = useMemo(() => {
    if (!data) return [];
    const out: { date: string; count: number }[][] = [];
    for (let i = 0; i < data.days.length; i += 7) out.push(data.days.slice(i, i + 7));
    return out;
  }, [data]);
  const max = Math.max(1, ...(data?.days.map((d) => d.count) ?? [1]));

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between">
        <p className="eyebrow flex items-center gap-2">
          <GitHubIcon className="size-3.5" /> GitHub
        </p>
        <a href={`https://github.com/${username}`} target="_blank" rel="noopener noreferrer" data-cursor="external" className="font-mono text-[0.6875rem] text-muted hover:text-fg">
          @{username} ↗
        </a>
      </div>
      {!data && !failed ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ) : failed || !data ? (
        <p className="mt-4 text-sm text-muted">Currently unavailable.</p>
      ) : (
        <>
          {data.stale ? <p className="mt-3 text-xs text-warm">Currently unavailable. Showing the last available information.</p> : null}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              [data.totalEvents, "public events / 90d"],
              [data.publicRepos, "repositories"],
              [data.totalStars, "stars"],
            ].map(([v, l]) => (
              <div key={l as string}>
                <p className="font-mono text-xl tabular-nums text-fg">{v}</p>
                <p className="text-[0.6875rem] text-subtle">{l}</p>
              </div>
            ))}
          </div>
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
      )}
    </div>
  );
}
