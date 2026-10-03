/**
 * Embed factory. Each provider is a small adapter that recognises a URL and
 * produces a sandboxed iframe source. Only allow-listed hosts are embedded;
 * anything else renders as a plain link.
 */
export type EmbedSpec = {
  provider: string;
  src: string;
  title: string;
  /** width / height */
  aspect: number;
  thumbnail?: string;
};

type EmbedAdapter = { name: string; match: (url: URL) => Omit<EmbedSpec, "title"> | null };

const youtubeId = (url: URL) => {
  if (url.hostname === "youtu.be") return url.pathname.slice(1);
  if (/(^|\.)youtube(-nocookie)?\.com$/.test(url.hostname)) {
    if (url.pathname === "/watch") return url.searchParams.get("v");
    const m = url.pathname.match(/^\/(embed|shorts|live)\/([\w-]{11})/);
    return m?.[2] ?? null;
  }
  return null;
};

export const isYouTubeId = (id: string) => /^[\w-]{11}$/.test(id);

export const youtubeEmbed = (id: string): Omit<EmbedSpec, "title"> => ({
  provider: "youtube",
  src: `https://www.youtube-nocookie.com/embed/${id}?rel=0`,
  aspect: 16 / 9,
  thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
});

const adapters: EmbedAdapter[] = [
  {
    name: "youtube",
    match: (url) => {
      const id = youtubeId(url);
      return id && isYouTubeId(id) ? youtubeEmbed(id) : null;
    },
  },
  {
    name: "vimeo",
    match: (url) => {
      const m = url.hostname.endsWith("vimeo.com") && url.pathname.match(/\/(\d+)/);
      return m ? { provider: "vimeo", src: `https://player.vimeo.com/video/${m[1]}`, aspect: 16 / 9 } : null;
    },
  },
  {
    name: "loom",
    match: (url) => {
      const m = url.hostname.endsWith("loom.com") && url.pathname.match(/\/(share|embed)\/([a-f0-9]+)/);
      return m ? { provider: "loom", src: `https://www.loom.com/embed/${m[2]}`, aspect: 16 / 9 } : null;
    },
  },
  {
    name: "codepen",
    match: (url) => {
      const m = url.hostname === "codepen.io" && url.pathname.match(/^\/([\w-]+)\/(pen|embed)\/([\w]+)/);
      return m
        ? { provider: "codepen", src: `https://codepen.io/${m[1]}/embed/${m[3]}?default-tab=result`, aspect: 4 / 3 }
        : null;
    },
  },
  {
    name: "codesandbox",
    match: (url) => {
      const m = url.hostname === "codesandbox.io" && url.pathname.match(/^\/(s|embed|p\/sandbox)\/([\w-]+)/);
      return m ? { provider: "codesandbox", src: `https://codesandbox.io/embed/${m[2]}`, aspect: 4 / 3 } : null;
    },
  },
  {
    name: "stackblitz",
    match: (url) =>
      url.hostname === "stackblitz.com"
        ? { provider: "stackblitz", src: `https://stackblitz.com${url.pathname}?embed=1`, aspect: 4 / 3 }
        : null,
  },
  {
    name: "observable",
    match: (url) => {
      const m = url.hostname === "observablehq.com" && url.pathname.match(/^\/(@[\w-]+\/[\w-]+)/);
      return m ? { provider: "observable", src: `https://observablehq.com/embed/${m[1]}`, aspect: 16 / 10 } : null;
    },
  },
  {
    name: "figma",
    match: (url) =>
      url.hostname.endsWith("figma.com") && /^\/(file|design|proto)\//.test(url.pathname)
        ? {
            provider: "figma",
            src: `https://www.figma.com/embed?embed_host=studio&url=${encodeURIComponent(url.toString())}`,
            aspect: 16 / 10,
          }
        : null,
  },
];

export function createEmbed(raw: string, title = "Embedded media"): EmbedSpec | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  for (const adapter of adapters) {
    const spec = adapter.match(url);
    if (spec) return { ...spec, title };
  }
  return null;
}

export function isSafeVideoSrc(src: string) {
  return /^\/media\/[a-z0-9-]+\/[\w-]+(\.[\w-]+)*\.(mp4|webm)$/i.test(src) || /^https:\/\/[^\s"']+\.(mp4|webm)(\?.*)?$/i.test(src);
}
