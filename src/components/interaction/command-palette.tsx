"use client";

import { Command } from "cmdk";
import { Dialog } from "radix-ui";
import {
  ArrowRight,
  AtSign,
  Bookmark,
  Briefcase,
  CornerDownLeft,
  FileText,
  FlaskConical,
  FolderGit2,
  Home,
  Keyboard,
  Loader2,
  Moon,
  Search,
  Sun,
  Terminal,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { GitHubIcon } from "@/components/brand/icons";
import { Kbd } from "@/components/ui/primitives";
import { loadSearchIndex } from "@/lib/search/client";
import type { SearchResult } from "@/lib/search/engine";
import { emitUI, UI_EVENTS } from "./events";
import { useTheme } from "./theme";

type Props = { githubUrl?: string; resumeUrl?: string; email?: string };

const TYPE_LABEL: Record<SearchResult["type"], string> = { post: "Writing", project: "Projects", research: "Research", page: "Pages" };
const TYPE_ICON: Record<SearchResult["type"], ReactNode> = {
  post: <FileText />,
  project: <FolderGit2 />,
  research: <FlaskConical />,
  page: <ArrowRight />,
};

export function CommandPalette({ githubUrl, resumeUrl, email }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState("");
  const router = useRouter();
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = (e: Event) => {
      setQuery(((e as CustomEvent).detail as string | undefined) ?? "");
      setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(UI_EVENTS.openPalette, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(UI_EVENTS.openPalette, onOpen);
    };
  }, []);

  // Search runs in the browser against the prebuilt /search-index.json.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSelected("");
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const index = await loadSearchIndex();
        if (!cancelled) {
          const found = index.search(q, { limit: 8 });
          setResults(found);
          // Without this, the highlight stays on whatever item was first before the results arrived.
          setSelected(found[0] ? `${found[0].title} ${found[0].id}` : "");
        }
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 100);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  const run = useCallback((fn: () => void) => {
    setOpen(false);
    setQuery("");
    requestAnimationFrame(fn);
  }, []);

  const go = (href: string) => run(() => router.push(href));
  const external = (href: string) => run(() => window.open(href, "_blank", "noopener,noreferrer"));

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[TYPE_LABEL[r.type]] ??= []).push(r);
    return acc;
  }, {});

  // Easter egg: typing "sudo" opens developer mode.
  useEffect(() => {
    if (open && query.trim().toLowerCase() === "sudo") run(() => emitUI(UI_EVENTS.openSystem));
  }, [open, query, run]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-[3px] data-[state=open]:animate-[fade-in_0.15s_ease]" />
        <Dialog.Content
          className="fixed left-1/2 top-[10vh] z-[81] w-[min(94vw,40rem)] -translate-x-1/2 overflow-hidden rounded-2xl border border-line-strong bg-surface/95 shadow-[0_40px_80px_-20px_rgb(0_0_0/0.7)] outline-none backdrop-blur-xl data-[state=open]:animate-[dialog-in_0.22s_var(--ease-out-expo)]"
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          <Command label="Command palette" shouldFilter={query.trim().length < 2} value={selected} onValueChange={setSelected} loop className="flex max-h-[min(70vh,34rem)] flex-col">
            <div className="flex items-center gap-3 border-b border-line px-4">
              {loading ? <Loader2 className="size-4 animate-spin text-muted" /> : <Search className="size-4 text-muted" />}
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Search articles, projects, research… or type a command"
                className="h-14 flex-1 bg-transparent text-[0.9375rem] text-fg outline-none placeholder:text-subtle"
              />
              <Kbd>esc</Kbd>
            </div>
            <Command.List className="flex-1 overflow-y-auto overscroll-contain p-2 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[0.625rem] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-subtle">
              <Command.Empty className="px-4 py-10 text-center">
                {loading ? (
                  <span className="text-sm text-muted">Searching…</span>
                ) : (
                  <>
                    <p className="text-sm text-fg">No matching articles.</p>
                    <p className="mt-1 text-xs text-muted">Try another keyword.</p>
                  </>
                )}
              </Command.Empty>

              {Object.entries(grouped).map(([group, items]) => (
                <Command.Group key={group} heading={group}>
                  {items.map((r) => (
                    <Item key={r.id} value={`${r.title} ${r.id}`} icon={TYPE_ICON[r.type]} onSelect={() => go(r.url)} hint={r.category ?? undefined}>
                      <span className="block truncate">{r.title}</span>
                      {r.snippet ? <span className="block truncate text-xs text-muted">{r.snippet}</span> : null}
                    </Item>
                  ))}
                </Command.Group>
              ))}

              {query.trim().length >= 2 && results.length > 0 ? (
                <Command.Group heading="Search">
                  <Item value={`see all results ${query}`} icon={<Search />} onSelect={() => go(`/search/?q=${encodeURIComponent(query)}`)}>
                    See all results for “{query}”
                  </Item>
                </Command.Group>
              ) : null}

              <Command.Group heading="Navigate">
                <Item icon={<Search />} onSelect={() => go("/search")}>Search</Item>
                <Item icon={<Home />} onSelect={() => go("/")} shortcut="G H">Go home</Item>
                <Item icon={<User />} onSelect={() => go("/about")} shortcut="G A">About</Item>
                <Item icon={<FolderGit2 />} onSelect={() => go("/projects")} shortcut="G P">Projects</Item>
                <Item icon={<FlaskConical />} onSelect={() => go("/research")} shortcut="G R">Research</Item>
                <Item icon={<FileText />} onSelect={() => go("/blog")} shortcut="G B">Blog</Item>
                <Item icon={<Briefcase />} onSelect={() => go("/experience")} shortcut="G E">Experience</Item>
                <Item icon={<Bookmark />} onSelect={() => go("/bookmarks")}>Saved articles</Item>
                <Item icon={<AtSign />} onSelect={() => go("/contact")} shortcut="G C">Contact</Item>
              </Command.Group>

              <Command.Group heading="Links">
                {githubUrl ? <Item icon={<GitHubIcon />} onSelect={() => external(githubUrl)}>GitHub</Item> : null}
                {resumeUrl ? <Item icon={<FileText />} onSelect={() => external(resumeUrl)}>Résumé</Item> : null}
                {email ? (
                  <Item icon={<AtSign />} onSelect={() => run(() => navigator.clipboard?.writeText(email))}>
                    Copy email address
                  </Item>
                ) : null}
              </Command.Group>

              <Command.Group heading="Preferences">
                <Item icon={theme === "dark" ? <Sun /> : <Moon />} onSelect={() => run(toggle)} shortcut="T">
                  Toggle theme
                </Item>
                <Item icon={<Keyboard />} onSelect={() => run(() => emitUI(UI_EVENTS.openShortcuts))} shortcut="?">
                  Keyboard shortcuts
                </Item>
                <Item value="developer mode system status sudo" icon={<Terminal />} onSelect={() => run(() => emitUI(UI_EVENTS.openSystem))}>
                  System status
                </Item>
              </Command.Group>
            </Command.List>
            <div className="flex items-center justify-between border-t border-line px-4 py-2.5 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-subtle">
              <span className="flex items-center gap-1.5">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd> navigate
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd>
                  <CornerDownLeft className="size-2.5" />
                </Kbd>
                open
              </span>
            </div>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Item({ children, icon, onSelect, shortcut, hint, value }: { children: ReactNode; icon: ReactNode; onSelect: () => void; shortcut?: string; hint?: string; value?: string }) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-fg-2 transition-colors data-[selected=true]:bg-surface-2 data-[selected=true]:text-fg [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted data-[selected=true]:[&_svg]:text-accent"
    >
      {icon}
      <span className="min-w-0 flex-1">{children}</span>
      {hint ? <span className="font-mono text-[0.625rem] uppercase tracking-wider text-subtle">{hint}</span> : null}
      {shortcut ? (
        <span className="flex gap-1">
          {shortcut.split(" ").map((k) => (
            <Kbd key={k}>{k}</Kbd>
          ))}
        </span>
      ) : null}
    </Command.Item>
  );
}
