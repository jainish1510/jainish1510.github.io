"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/primitives";
import { emitUI, isTypingTarget, UI_EVENTS } from "./events";
import { useTheme } from "./theme";

const GOTO: Record<string, string> = { h: "/", a: "/about", p: "/projects", r: "/research", b: "/blog", e: "/experience", c: "/contact", s: "/bookmarks" };

const LIST: { keys: string[]; label: string }[] = [
  { keys: ["⌘", "K"], label: "Command palette" },
  { keys: ["/"], label: "Search" },
  { keys: ["?"], label: "This panel" },
  { keys: ["T"], label: "Toggle theme" },
  { keys: ["G", "H"], label: "Go home" },
  { keys: ["G", "A"], label: "About" },
  { keys: ["G", "P"], label: "Projects" },
  { keys: ["G", "R"], label: "Research" },
  { keys: ["G", "B"], label: "Blog" },
  { keys: ["G", "E"], label: "Experience" },
  { keys: ["G", "S"], label: "Saved articles" },
  { keys: ["Esc"], label: "Close any dialog" },
];

/** Global single-key shortcuts (ignored while typing). */
export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { toggle } = useTheme();
  const pendingG = useRef<number | null>(null);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      if (document.querySelector("[role=dialog]") && e.key !== "?") return;
      const key = e.key.toLowerCase();

      if (pendingG.current !== null) {
        window.clearTimeout(pendingG.current);
        pendingG.current = null;
        const href = GOTO[key];
        if (href) {
          e.preventDefault();
          router.push(href);
        }
        return;
      }
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "/") {
        e.preventDefault();
        emitUI(UI_EVENTS.openPalette);
      } else if (key === "t" && !pathname.startsWith("/admin/posts")) {
        toggle();
      } else if (key === "g") {
        pendingG.current = window.setTimeout(() => (pendingG.current = null), 900);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(UI_EVENTS.openShortcuts, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(UI_EVENTS.openShortcuts, onOpen);
    };
  }, [router, toggle, pathname]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent title="Keyboard shortcuts" description="Everything here works without a mouse.">
        <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
          {LIST.map((s) => (
            <li key={s.label} className="flex items-center justify-between gap-4 border-b border-line py-2 text-sm text-fg-2 last:border-0">
              {s.label}
              <span className="flex gap-1">
                {s.keys.map((k) => (
                  <Kbd key={k}>{k}</Kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 font-mono text-[0.6875rem] text-subtle">Some keys are less documented than others. ↑↑↓↓</p>
      </DialogContent>
    </Dialog>
  );
}
