/**
 * Tiny typed observer. Domain code emits facts ("post.published"); listeners
 * registered elsewhere decide what to do (revalidate pages, refresh the
 * search index, log analytics). Repositories stay free of framework imports.
 */
export type DomainEvents = {
  "post.saved": { id: string; slug: string; previousSlug?: string; status: string };
  "post.published": { id: string; slug: string };
  "post.deleted": { id: string; slug: string };
  "comment.created": { id: string; postId: string; status: string };
  "comment.moderated": { ids: string[]; status: string };
  "content.changed": { collection: string };
  "media.changed": { id?: string };
};

type Listener<K extends keyof DomainEvents> = (payload: DomainEvents[K]) => void | Promise<void>;

class EventBus {
  private listeners = new Map<keyof DomainEvents, Set<Listener<never>>>();

  on<K extends keyof DomainEvents>(event: K, listener: Listener<K>) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(listener as Listener<never>);
    return () => this.listeners.get(event)?.delete(listener as Listener<never>);
  }

  async emit<K extends keyof DomainEvents>(event: K, payload: DomainEvents[K]) {
    const set = this.listeners.get(event);
    if (!set) return;
    await Promise.allSettled([...set].map((l) => (l as Listener<K>)(payload)));
  }

  clear() {
    this.listeners.clear();
  }
}

const g = globalThis as unknown as { __studioBus?: EventBus };
export const bus = g.__studioBus ?? (g.__studioBus = new EventBus());
