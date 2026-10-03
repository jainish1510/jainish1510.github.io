/**
 * In-process full-text search. The corpus is small (tens to hundreds of
 * documents), so a weighted inverted index rebuilt on content change beats
 * running an external engine. Pure and framework-free for unit testing.
 *
 * Scoring per query term, per field:  exact token = 1.0, prefix = 0.7,
 * one-edit typo (terms ≥ 5 chars) = 0.4 — multiplied by the field weight.
 * Documents must match every query term (AND), so results narrow as you type.
 */
export type SearchDocType = "post" | "project" | "research" | "page";

export type SearchDocument = {
  id: string;
  type: SearchDocType;
  title: string;
  subtitle?: string | null;
  url: string;
  tags?: string[];
  category?: string | null;
  body?: string;
  date?: string | null;
};

export type SearchResult = {
  id: string;
  type: SearchDocType;
  title: string;
  subtitle?: string | null;
  url: string;
  category?: string | null;
  snippet: string;
  score: number;
};

const FIELD_WEIGHTS = { title: 10, tags: 6, category: 5, subtitle: 4, body: 1 } as const;
type Field = keyof typeof FIELD_WEIGHTS;

const STOP_WORDS = new Set("a an and are as at be by for from how i in is it of on or that the this to was what when why with".split(" "));

export function tokenize(text: string): string[] {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9+#]+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

/** True when a and b are within one insertion, deletion or substitution. */
export function withinOneEdit(a: string, b: string) {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else {
      i++;
      j++;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

type Indexed = { doc: SearchDocument; fields: Record<Field, Set<string>> };

export class SearchIndex {
  private items: Indexed[];
  private vocabulary: string[];

  constructor(docs: SearchDocument[]) {
    this.items = docs.map((doc) => ({
      doc,
      fields: {
        title: new Set(tokenize(doc.title)),
        subtitle: new Set(tokenize(doc.subtitle ?? "")),
        tags: new Set(tokenize((doc.tags ?? []).join(" "))),
        category: new Set(tokenize(doc.category ?? "")),
        body: new Set(tokenize(doc.body ?? "")),
      },
    }));
    const vocab = new Set<string>();
    for (const item of this.items) for (const set of Object.values(item.fields)) for (const t of set) vocab.add(t);
    this.vocabulary = [...vocab];
  }

  get size() {
    return this.items.length;
  }

  /** Expand a query term into matching vocabulary tokens with a match quality. */
  private expand(term: string) {
    const matches = new Map<string, number>();
    for (const token of this.vocabulary) {
      if (token === term) matches.set(token, 1);
      else if (token.startsWith(term)) matches.set(token, 0.7);
      else if (term.length >= 5 && withinOneEdit(term, token)) matches.set(token, 0.4);
    }
    return matches;
  }

  search(query: string, opts: { limit?: number; types?: SearchDocType[] } = {}): SearchResult[] {
    const terms = tokenize(query);
    if (!terms.length) return [];
    const expansions = terms.map((t) => this.expand(t));
    const results: SearchResult[] = [];

    for (const item of this.items) {
      if (opts.types && !opts.types.includes(item.doc.type)) continue;
      let total = 0;
      let allMatched = true;
      for (const expansion of expansions) {
        let best = 0;
        for (const [field, weight] of Object.entries(FIELD_WEIGHTS) as [Field, number][]) {
          for (const [token, quality] of expansion) {
            if (item.fields[field].has(token)) best = Math.max(best, weight * quality);
          }
        }
        if (best === 0) {
          allMatched = false;
          break;
        }
        total += best;
      }
      if (!allMatched) continue;
      // Light recency boost so newer writing wins ties.
      if (item.doc.date) {
        const ageDays = (Date.now() - new Date(item.doc.date).getTime()) / 86400000;
        total += Math.max(0, 1 - ageDays / 730);
      }
      results.push({
        id: item.doc.id,
        type: item.doc.type,
        title: item.doc.title,
        subtitle: item.doc.subtitle,
        url: item.doc.url,
        category: item.doc.category,
        snippet: makeSnippet(item.doc, terms),
        score: Math.round(total * 100) / 100,
      });
    }
    return results.sort((a, b) => b.score - a.score).slice(0, opts.limit ?? 20);
  }
}

export function makeSnippet(doc: SearchDocument, terms: string[], radius = 80) {
  const source = doc.body || doc.subtitle || "";
  const lower = source.toLowerCase();
  let at = -1;
  for (const t of terms) {
    at = lower.indexOf(t);
    if (at >= 0) break;
  }
  if (at < 0) return source.slice(0, radius * 2).trim() + (source.length > radius * 2 ? "…" : "");
  const start = Math.max(0, at - radius);
  const end = Math.min(source.length, at + radius);
  return `${start > 0 ? "…" : ""}${source.slice(start, end).trim()}${end < source.length ? "…" : ""}`;
}
