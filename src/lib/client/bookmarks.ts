/** Saved articles live in this browser's localStorage — no account, no server. */
export type LocalBookmark = {
  slug: string;
  title: string;
  subtitle?: string | null;
  category?: string | null;
  readingTime?: number;
  date?: string | null;
  savedAt: number;
};
const KEY = "studio-bookmarks";

export function readBookmarks(): LocalBookmark[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? "[]") as LocalBookmark[];
    return Array.isArray(list) ? list.filter((b) => b && typeof b.slug === "string" && typeof b.title === "string") : [];
  } catch {
    return [];
  }
}

export function isBookmarked(slug: string) {
  return readBookmarks().some((b) => b.slug === slug);
}

export function setBookmark(entry: Omit<LocalBookmark, "savedAt">, saved: boolean) {
  try {
    const list = readBookmarks().filter((b) => b.slug !== entry.slug);
    if (saved) list.unshift({ ...entry, savedAt: Date.now() });
    localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new Event("studio:bookmarks"));
    return true;
  } catch {
    return false; // storage blocked (private mode)
  }
}
