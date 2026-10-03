import "server-only";
import { env } from "@/lib/env";
import { getWidget, parseJson, saveWidgetCache } from "@/lib/repositories/personal";

/**
 * Music adapter. `SpotifyProvider` talks to the Web API using a long-lived
 * refresh token; `DemoProvider` serves an admin-configured track so the
 * widget has a designed state when no credentials exist. Both satisfy
 * `MusicProvider`, so the widget never knows which one it is talking to.
 */
export type NowPlaying = {
  source: "spotify" | "demo";
  isPlaying: boolean;
  title: string;
  artist: string;
  album: string;
  albumArt: string | null;
  url: string | null;
  progressMs: number;
  durationMs: number;
  playedAt?: string;
  stale?: boolean;
};

export interface MusicProvider {
  getNowPlaying(): Promise<NowPlaying | null>;
}

type SpotifyTrack = {
  name: string;
  duration_ms: number;
  external_urls: { spotify: string };
  artists: { name: string }[];
  album: { name: string; images: { url: string; width: number }[] };
};

class SpotifyProvider implements MusicProvider {
  private token: { value: string; expiresAt: number } | null = null;

  private async accessToken() {
    if (this.token && this.token.expiresAt > Date.now() + 10_000) return this.token.value;
    const basic = Buffer.from(`${env.spotify.clientId}:${env.spotify.clientSecret}`).toString("base64");
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: env.spotify.refreshToken! }),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`Spotify token → ${res.status}`);
    const json = (await res.json()) as { access_token: string; expires_in: number };
    this.token = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
    return json.access_token;
  }

  private map(track: SpotifyTrack, extra: Partial<NowPlaying>): NowPlaying {
    const art = [...track.album.images].sort((a, b) => a.width - b.width).find((i) => i.width >= 200) ?? track.album.images[0];
    return {
      source: "spotify",
      isPlaying: false,
      title: track.name,
      artist: track.artists.map((a) => a.name).join(", "),
      album: track.album.name,
      albumArt: art?.url ?? null,
      url: track.external_urls.spotify,
      progressMs: 0,
      durationMs: track.duration_ms,
      ...extra,
    };
  }

  async getNowPlaying() {
    const token = await this.accessToken();
    const headers = { Authorization: `Bearer ${token}` };
    const current = await fetch("https://api.spotify.com/v1/me/player/currently-playing", { headers, cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (current.status === 200) {
      const json = (await current.json()) as { is_playing: boolean; progress_ms: number; item: SpotifyTrack | null; currently_playing_type: string };
      if (json.item && json.currently_playing_type === "track") return this.map(json.item, { isPlaying: json.is_playing, progressMs: json.progress_ms });
    }
    const recent = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=1", { headers, cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (!recent.ok) throw new Error(`Spotify recent → ${recent.status}`);
    const json = (await recent.json()) as { items: { track: SpotifyTrack; played_at: string }[] };
    const item = json.items[0];
    return item ? this.map(item.track, { playedAt: item.played_at }) : null;
  }
}

export type SpotifyDemoConfig = { title: string; artist: string; album: string; url?: string; durationMs?: number };

class DemoProvider implements MusicProvider {
  constructor(private config: SpotifyDemoConfig | null) {}
  async getNowPlaying(): Promise<NowPlaying | null> {
    if (!this.config?.title) return null;
    const duration = this.config.durationMs ?? 214000;
    // Progress advances with wall-clock time so the demo state feels alive.
    return {
      source: "demo",
      isPlaying: true,
      title: this.config.title,
      artist: this.config.artist,
      album: this.config.album,
      albumArt: null,
      url: this.config.url ?? null,
      progressMs: Date.now() % duration,
      durationMs: duration,
    };
  }
}

const g = globalThis as unknown as { __spotify?: SpotifyProvider };

export async function getNowPlaying(): Promise<NowPlaying | null> {
  const widget = await getWidget("spotify").catch(() => null);
  if (widget && !widget.enabled) return null;
  if (env.spotify.configured) {
    const provider = (g.__spotify ??= new SpotifyProvider());
    try {
      const result = await provider.getNowPlaying();
      if (result) await saveWidgetCache("spotify", result).catch(() => {});
      return result;
    } catch {
      const cached = parseJson<NowPlaying | null>(widget?.cache, null);
      if (cached) return { ...cached, isPlaying: false, stale: true };
    }
  }
  return new DemoProvider(parseJson<SpotifyDemoConfig | null>(widget?.config, null)).getNowPlaying();
}
