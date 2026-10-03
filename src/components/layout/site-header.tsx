"use client";

import { Menu, Moon, Search, Sun, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { StudioMark } from "@/components/brand/icons";
import { emitUI, UI_EVENTS } from "@/components/interaction/events";
import { useTheme } from "@/components/interaction/theme";
import { Kbd } from "@/components/ui/primitives";
import type { NavItem } from "@/lib/settings";
import { cn } from "@/lib/utils";

export function SiteHeader({ name, nav }: { name: string; nav: NavItem[] }) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [mac, setMac] = useState(true);

  useEffect(() => {
    setMac(/Mac|iPhone|iPad/.test(navigator.platform));
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background,border-color,backdrop-filter] duration-300",
        scrolled || open ? "surface-glass border-b border-line" : "border-b border-transparent",
      )}
    >
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <Link href="/" className="group flex items-center gap-2.5 text-sm font-medium tracking-tight text-fg" aria-label={`${name} — home`}>
          <StudioMark className="size-5 text-fg transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:rotate-[120deg]" />
          <span>{name}</span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active(item.href) ? "page" : undefined}
              className={cn("relative rounded-md px-3 py-1.5 text-[0.8125rem] transition-colors", active(item.href) ? "text-fg" : "text-muted hover:text-fg")}
            >
              {active(item.href) ? (
                <motion.span layoutId="nav-active" className="absolute inset-0 rounded-md bg-surface-2" transition={{ type: "spring", stiffness: 400, damping: 34 }} />
              ) : null}
              <span className="relative">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => emitUI(UI_EVENTS.openPalette)}
            className="hidden h-8 items-center gap-2.5 rounded-lg border border-line bg-surface/60 pl-2.5 pr-1.5 text-xs text-muted transition hover:border-line-strong hover:text-fg sm:flex"
            aria-label="Open search and command palette"
          >
            <Search className="size-3.5" />
            Search
            <span className="flex gap-0.5">
              <Kbd>{mac ? "⌘" : "Ctrl"}</Kbd>
              <Kbd>K</Kbd>
            </span>
          </button>
          <button
            type="button"
            onClick={() => emitUI(UI_EVENTS.openPalette)}
            className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg sm:hidden"
            aria-label="Search"
          >
            <Search className="size-4" />
          </button>
          <button
            type="button"
            onClick={toggle}
            className="grid size-9 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-fg"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={theme} initial={{ rotate: -60, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 60, opacity: 0 }} transition={{ duration: 0.2 }}>
                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </motion.span>
            </AnimatePresence>
          </button>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="grid size-9 place-items-center rounded-lg text-fg hover:bg-surface-2 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.nav
            id="mobile-nav"
            aria-label="Mobile"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "100dvh" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-line lg:hidden"
          >
            <ul className="container-page flex flex-col py-6">
              {[{ label: "Home", href: "/" }, ...nav].map((item, i) => (
                <motion.li key={item.href} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.04 }}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-baseline justify-between border-b border-line py-4 text-2xl tracking-tight",
                      active(item.href) ? "text-fg" : "text-fg-2",
                    )}
                  >
                    {item.label}
                    <span className="font-mono text-xs text-subtle">0{i + 1}</span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
