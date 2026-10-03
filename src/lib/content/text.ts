/** Pure text utilities shared by the CMS, search and rendering. */

export function slugify(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** Strip markdown + directive syntax down to readable prose. */
export function stripMarkdown(md: string) {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\$\$[\s\S]*?\$\$/g, " ")
    .replace(/^:{2,}.*$/gm, " ")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\$([^$\n]+)\$/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/[*_~|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const WORDS_PER_MINUTE = 230;

/**
 * Reading time in whole minutes: prose at 230 wpm, code read at roughly a
 * third of that, plus a pause per image/figure/embed.
 */
export function readingTime(md: string) {
  const code = (md.match(/```[\s\S]*?```/g) ?? []).join(" ");
  const codeWords = code.split(/\s+/).filter(Boolean).length;
  const proseWords = stripMarkdown(md).split(/\s+/).filter(Boolean).length;
  const media = (md.match(/!\[|^::(youtube|video|embed|component)/gm) ?? []).length;
  const minutes = proseWords / WORDS_PER_MINUTE + codeWords / (WORDS_PER_MINUTE / 3) + media * (10 / 60);
  return Math.max(1, Math.round(minutes));
}

export function makeExcerpt(md: string, max = 200) {
  const text = stripMarkdown(md);
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,.;:]$/, "") + "…";
}

export function wordCount(md: string) {
  return stripMarkdown(md).split(/\s+/).filter(Boolean).length;
}
