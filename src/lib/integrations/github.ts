import "server-only";
import { env } from "@/lib/env";
import { getWidget, parseJson, saveWidgetCache } from "@/lib/repositories/personal";

/**
 * GitHub adapter. Normalises the REST + GraphQL APIs into one shape the
 * widget understands. With a token it reads the real contribution calendar;
 * without one it approximates activity from public events. On any failure
 * the last successful payload (stored in SQLite) is served with `stale: true`.
 */
export type GitHubRepo = { name: string; description: string | null; url: string; stars: number; language: string | null; pushedAt: string };
export type GitHubDay = { date: string; count: number };
export type GitHubSnapshot = {
  username: string;
  profileUrl: string;
  repos: GitHubRepo[];
  totalStars: number;
  publicRepos: number;
  days: GitHubDay[];
  contributionSource: "calendar" | "events";
  totalContributions: number;
  fetchedAt: string;
  stale?: boolean;
  unavailable?: boolean;
};

const API = "https://api.github.com";

async function gh<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "jainish-studio",
      ...(env.github.token ? { Authorization: `Bearer ${env.github.token}` } : {}),
      ...init?.headers,
    },
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`GitHub ${path} → ${res.status}`);
  return (await res.json()) as T;
}

async function calendar(username: string): Promise<GitHubDay[]> {
  const query = `query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{weeks{contributionDays{date contributionCount}}}}}}`;
  const data = await gh<{ data?: { user?: { contributionsCollection: { contributionCalendar: { weeks: { contributionDays: { date: string; contributionCount: number }[] }[] } } } } }>(
    "/graphql",
    { method: "POST", body: JSON.stringify({ query, variables: { login: username } }) },
  );
  const weeks = data.data?.user?.contributionsCollection.contributionCalendar.weeks ?? [];
  return weeks.flatMap((w) => w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount })));
}

async function eventsActivity(username: string): Promise<GitHubDay[]> {
  const pages = await Promise.all([1, 2, 3].map((page) => gh<{ created_at: string; type: string; payload?: { size?: number } }[]>(`/users/${username}/events/public?per_page=100&page=${page}`).catch(() => [])));
  const counts = new Map<string, number>();
  for (const e of pages.flat()) {
    const day = e.created_at.slice(0, 10);
    counts.set(day, (counts.get(day) ?? 0) + (e.type === "PushEvent" ? Math.max(1, e.payload?.size ?? 1) : 1));
  }
  const days: GitHubDay[] = [];
  for (let i = 364; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    days.push({ date, count: counts.get(date) ?? 0 });
  }
  return days;
}

export async function getGitHubSnapshot(): Promise<GitHubSnapshot> {
  const username = env.github.username;
  try {
    const [user, repos] = await Promise.all([
      gh<{ public_repos: number; html_url: string }>(`/users/${username}`),
      gh<{ name: string; description: string | null; html_url: string; stargazers_count: number; language: string | null; pushed_at: string; fork: boolean }[]>(
        `/users/${username}/repos?sort=pushed&per_page=100`,
      ),
    ]);
    let days: GitHubDay[];
    let contributionSource: GitHubSnapshot["contributionSource"] = "events";
    if (env.github.token) {
      try {
        days = await calendar(username);
        contributionSource = "calendar";
      } catch {
        days = await eventsActivity(username);
      }
    } else {
      days = await eventsActivity(username);
    }
    const own = repos.filter((r) => !r.fork);
    const snapshot: GitHubSnapshot = {
      username,
      profileUrl: user.html_url,
      publicRepos: user.public_repos,
      totalStars: own.reduce((s, r) => s + r.stargazers_count, 0),
      repos: own.slice(0, 6).map((r) => ({ name: r.name, description: r.description, url: r.html_url, stars: r.stargazers_count, language: r.language, pushedAt: r.pushed_at })),
      days,
      contributionSource,
      totalContributions: days.reduce((s, d) => s + d.count, 0),
      fetchedAt: new Date().toISOString(),
    };
    await saveWidgetCache("github", snapshot).catch(() => {});
    return snapshot;
  } catch {
    const widget = await getWidget("github").catch(() => null);
    const cached = parseJson<GitHubSnapshot | null>(widget?.cache, null);
    if (cached) return { ...cached, stale: true };
    return {
      username,
      profileUrl: `https://github.com/${username}`,
      repos: [],
      totalStars: 0,
      publicRepos: 0,
      days: [],
      contributionSource: "events",
      totalContributions: 0,
      fetchedAt: new Date().toISOString(),
      unavailable: true,
    };
  }
}
