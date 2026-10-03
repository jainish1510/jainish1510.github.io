"use client";

import { useEffect, useState } from "react";
import { SpotifyIcon } from "@/components/brand/icons";
import { Badge, Skeleton } from "@/components/ui/primitives";
import { hashString, relativeTime } from "@/lib/utils";

type Track = { source: "spotify" | "demo"; isPlaying: boolean; title: string; artist: string; album: string; albumArt: string | null; url: string | null; progressMs: number; durationMs: number; playedAt?: string; stale?: boolean };

const fmt = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;

export function SpotifyWidget() {
  const [track, setTrack] = useState<Track | null | undefined>(undefined);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let active = true;
    const load = () =>
      fetch("/api/spotify")
        .then((r) => r.json() as Promise<{ track: Track | null }>)
        .then(({ track }) => {
          if (!active) return;
          setTrack(track);
          setProgress(track?.progressMs ?? 0);
        })
        .catch(() => active && setTrack(null));
    void load();
    const poll = setInterval(load, 30_000);
    return () => {
      active = false;
      clearInterval(poll);
    };
  }, []);

  useEffect(() => {
    if (!track?.isPlaying) return;
    const t = setInterval(() => setProgress((p) => (p + 1000 > track.durationMs ? 0 : p + 1000)), 1000);
    return () => clearInterval(t);
  }, [track]);

  const hue = track ? hashString(track.album) % 360 : 0;

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between">
        <p className="eyebrow flex items-center gap-2">
          <SpotifyIcon className="size-3.5 text-[#1db954]" />
          {track?.isPlaying ? "Now playing" : "Last played"}
        </p>
        {track?.source === "demo" ? <Badge tone="outline" title="Spotify isn't connected — this is the configured demo state.">demo data</Badge> : null}
        {track?.stale ? <Badge tone="warm">cached</Badge> : null}
      </div>
      {track === undefined ? (
        <div className="mt-4 flex gap-4">
          <Skeleton className="size-16 rounded-lg" />
          <div className="flex-1 space-y-2 pt-1">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ) : track === null ? (
        <p className="mt-4 text-sm text-muted">Currently unavailable.</p>
      ) : (
        <div className="mt-4">
          <div className="flex gap-4">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-line" style={{ background: `conic-gradient(from ${hue}deg, hsl(${hue} 45% 35%), hsl(${(hue + 80) % 360} 40% 22%), hsl(${hue} 45% 35%))` }}>
              {track.albumArt ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={track.albumArt} alt={`${track.album} cover`} className="size-full object-cover" />
              ) : (
                <span className="absolute inset-0 m-auto size-3 rounded-full border border-white/30 bg-black/50" aria-hidden />
              )}
              {track.isPlaying ? (
                <span className="absolute bottom-1 right-1 flex h-3 items-end gap-px" aria-hidden>
                  {[0, 1, 2].map((i) => (
                    <i key={i} className="w-0.5 animate-[pulse-dot_0.9s_ease-in-out_infinite] bg-white" style={{ height: `${50 + i * 20}%`, animationDelay: `${i * 0.2}s` }} />
                  ))}
                </span>
              ) : null}
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-fg">{track.title}</p>
              <p className="truncate text-sm text-muted">{track.artist}</p>
              <p className="truncate text-xs text-subtle">{track.album}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-0.5 overflow-hidden rounded-full bg-surface-3" role="progressbar" aria-valuemin={0} aria-valuemax={track.durationMs} aria-valuenow={progress} aria-label="Track progress">
              <div className="h-full bg-fg transition-[width] duration-1000 ease-linear" style={{ width: `${(progress / track.durationMs) * 100}%` }} />
            </div>
            <div className="mt-1.5 flex justify-between font-mono text-[0.625rem] text-subtle">
              <span>{fmt(progress)}</span>
              {track.playedAt ? <span>{relativeTime(track.playedAt)}</span> : null}
              <span>{fmt(track.durationMs)}</span>
            </div>
          </div>
          {track.url ? (
            <a href={track.url} target="_blank" rel="noopener noreferrer" data-cursor="external" className="mt-3 inline-block text-xs text-muted link-underline hover:text-fg">
              Open in Spotify ↗
            </a>
          ) : null}
        </div>
      )}
    </div>
  );
}
