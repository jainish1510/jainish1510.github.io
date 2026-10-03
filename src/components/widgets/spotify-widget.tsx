import { SpotifyIcon } from "@/components/brand/icons";
import { hashString } from "@/lib/utils";

type Track = { title: string; artist: string; album: string; url: string | null };

/**
 * A track you currently like — set in content/widgets.yml. A static site can't
 * ask Spotify "what's playing right now" without exposing secrets, so this is
 * an honest "on repeat" card rather than a fake live player.
 */
export function SpotifyWidget({ track }: { track: Track }) {
  if (!track.title) return null;
  const hue = hashString(track.album || track.title) % 360;
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="eyebrow flex items-center gap-2">
        <SpotifyIcon className="size-3.5 text-[#1db954]" />
        On repeat
      </p>
      <div className="mt-4 flex gap-4">
        <div
          className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-line"
          style={{ background: `conic-gradient(from ${hue}deg, hsl(${hue} 45% 35%), hsl(${(hue + 80) % 360} 40% 22%), hsl(${hue} 45% 35%))` }}
          aria-hidden
        >
          <span className="absolute inset-0 m-auto size-3 rounded-full border border-white/30 bg-black/50" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium text-fg">{track.title}</p>
          <p className="truncate text-sm text-muted">{track.artist}</p>
          <p className="truncate text-xs text-subtle">{track.album}</p>
        </div>
      </div>
      {track.url ? (
        <a href={track.url} target="_blank" rel="noopener noreferrer" data-cursor="external" className="mt-4 inline-block text-xs text-muted link-underline hover:text-fg">
          Open in Spotify ↗
        </a>
      ) : null}
    </div>
  );
}
