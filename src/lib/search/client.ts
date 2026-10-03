import { SearchIndex, type SearchDocument } from "./engine";

/** Loads /search-index.json once per page visit and keeps the built index in memory. */
let pending: Promise<SearchIndex> | null = null;

export function loadSearchIndex(): Promise<SearchIndex> {
  pending ??= fetch("/search-index.json")
    .then((r) => {
      if (!r.ok) throw new Error(`search index ${r.status}`);
      return r.json() as Promise<SearchDocument[]>;
    })
    .then((docs) => new SearchIndex(docs))
    .catch((e) => {
      pending = null; // allow a retry
      throw e;
    });
  return pending;
}
