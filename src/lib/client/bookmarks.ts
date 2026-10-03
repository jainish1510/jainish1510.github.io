/** Local mirror of bookmarks for instant UI; the server copy is keyed by visitor id. */
export type LocalBookmark = { id: string; slug: string; title: string; savedAt: number };
const KEY = "studio-bookmarks";

export function readLocalBookmarks(): LocalBookmark[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as LocalBookmark[];
  } catch {
    return [];
  }
}

export function writeLocalBookmark(entry: Omit<LocalBookmark, "savedAt">, saved: boolean) {
  try {
    const list = readLocalBookmarks().filter((b) => b.id !== entry.id);
    if (saved) list.unshift({ ...entry, savedAt: Date.now() });
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable */
  }
}
