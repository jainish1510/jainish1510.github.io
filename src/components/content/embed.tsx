"use client";

import { Play } from "lucide-react";
import { useState } from "react";

/**
 * Click-to-load facade: third-party players are only fetched after the reader
 * asks for them, which keeps articles fast and cookie-free until then.
 */
export function Embed({ provider, src, title, poster }: { provider: string; src: string; title: string; poster?: string }) {
  const [active, setActive] = useState(false);

  if (provider === "video") {
    return (
      <figure className="not-prose -mx-1 sm:-mx-6">
        <video
          controls
          preload="metadata"
          playsInline
          poster={poster}
          className="w-full rounded-xl border border-line bg-black"
          aria-label={title}
        >
          <source src={src} />
        </video>
        <figcaption className="mt-3 text-center font-sans text-sm text-muted">{title}</figcaption>
      </figure>
    );
  }

  const autoplaySrc = provider === "youtube" ? `${src}&autoplay=1` : src;

  return (
    <figure className="not-prose -mx-1 sm:-mx-6">
      <div className="relative aspect-video overflow-hidden rounded-xl border border-line bg-surface">
        {active ? (
          <iframe
            src={autoplaySrc}
            title={title}
            className="absolute inset-0 size-full"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            sandbox="allow-scripts allow-same-origin allow-popups allow-presentation allow-forms"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setActive(true)}
            className="group/embed absolute inset-0 flex items-center justify-center"
            aria-label={`Load ${provider} embed: ${title}`}
          >
            {poster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={poster} alt="" loading="lazy" onError={(e) => (e.currentTarget.style.display = "none")} className="absolute inset-0 size-full object-cover opacity-60 transition group-hover/embed:opacity-80" />
            ) : (
              <span className="grid-bg absolute inset-0" />
            )}
            <span className="relative flex items-center gap-3 rounded-full border border-white/15 bg-black/60 px-5 py-2.5 text-sm text-white backdrop-blur transition group-hover/embed:scale-105">
              <Play className="size-4 fill-current" />
              Play · {provider}
            </span>
          </button>
        )}
      </div>
      <figcaption className="mt-3 text-center font-sans text-sm text-muted">{title}</figcaption>
    </figure>
  );
}
