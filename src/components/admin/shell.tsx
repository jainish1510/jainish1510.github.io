"use client";

import {
  BarChart3,
  BookOpen,
  ExternalLink,
  FileText,
  FolderGit2,
  FlaskConical,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  PenLine,
  Search,
  Settings,
  Sparkles,
  Tags,
  User,
  Briefcase,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { logoutAction } from "@/app/admin/actions/auth";
import { StudioMark } from "@/components/brand/icons";
import { emitUI, isTypingTarget, UI_EVENTS } from "@/components/interaction/events";
import { Kbd } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: ReactNode; badge?: number; exact?: boolean };

export function AdminShell({ user, badges, children }: { user: { name: string; email: string }; badges: { comments: number; messages: number }; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  // "c" = create post, admin-only shortcut.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target) || e.metaKey || e.ctrlKey || document.querySelector("[role=dialog]")) return;
      if (e.key === "c") router.push("/admin/posts/new");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  const groups: { label: string; items: NavItem[] }[] = [
    {
      label: "Publish",
      items: [
        { href: "/admin", label: "Dashboard", icon: <LayoutDashboard />, exact: true },
        { href: "/admin/posts", label: "Posts", icon: <FileText /> },
        { href: "/admin/comments", label: "Comments", icon: <MessageSquare />, badge: badges.comments },
        { href: "/admin/media", label: "Media", icon: <ImageIcon /> },
        { href: "/admin/taxonomy", label: "Tags & categories", icon: <Tags /> },
        { href: "/admin/analytics", label: "Analytics", icon: <BarChart3 /> },
        { href: "/admin/messages", label: "Messages", icon: <Inbox />, badge: badges.messages },
      ],
    },
    {
      label: "Portfolio",
      items: [
        { href: "/admin/content/projects", label: "Projects", icon: <FolderGit2 /> },
        { href: "/admin/content/research", label: "Research", icon: <FlaskConical /> },
        { href: "/admin/content/experience", label: "Experience", icon: <Briefcase /> },
        { href: "/admin/content/skills", label: "Skills", icon: <Sparkles /> },
      ],
    },
    {
      label: "Personal & site",
      items: [
        { href: "/admin/content", label: "Personal content", icon: <User />, exact: true },
        { href: "/admin/widgets", label: "Widgets", icon: <BookOpen /> },
        { href: "/admin/settings", label: "Site settings", icon: <Settings /> },
      ],
    },
  ];

  const isActive = (item: NavItem) => (item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`));

  const nav = (
    <nav aria-label="Admin" className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 pb-4">
      <Link href="/admin/posts/new" className="flex items-center justify-between rounded-lg bg-fg px-3 py-2 text-sm font-medium text-bg transition hover:bg-fg/90">
        <span className="flex items-center gap-2">
          <PenLine className="size-4" /> New post
        </span>
        <Kbd className="border-bg/20 bg-bg/10 text-bg/70">C</Kbd>
      </Link>
      {groups.map((g) => (
        <div key={g.label}>
          <p className="eyebrow mb-1.5 px-3">{g.label}</p>
          <ul className="space-y-0.5">
            {g.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item) ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition [&_svg]:size-4",
                    isActive(item) ? "bg-surface-2 text-fg [&_svg]:text-accent" : "text-muted hover:bg-surface-2/60 hover:text-fg",
                  )}
                >
                  {item.icon}
                  <span className="flex-1">{item.label}</span>
                  {item.badge ? <span className="rounded-full bg-warm-soft px-1.5 font-mono text-[0.625rem] text-warm">{item.badge}</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15.5rem_1fr]">
      <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-line bg-bg-raised transition-transform lg:sticky lg:top-0 lg:h-dvh lg:w-auto lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex h-14 items-center justify-between px-5">
          <Link href="/admin" className="flex items-center gap-2 text-sm font-medium text-fg">
            <StudioMark className="size-5" /> Studio
          </Link>
          <button type="button" onClick={() => setOpen(false)} className="lg:hidden" aria-label="Close menu">
            <X className="size-4 text-muted" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => emitUI(UI_EVENTS.openPalette)}
          className="mx-3 mb-5 flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs text-muted hover:text-fg"
        >
          <Search className="size-3.5" /> Search &amp; commands <Kbd className="ml-auto">⌘K</Kbd>
        </button>
        {nav}
        <div className="border-t border-line p-3">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
            <span className="grid size-7 place-items-center rounded-full border border-line font-mono text-[0.625rem] text-fg">{user.name.slice(0, 2).toUpperCase()}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-fg">{user.name}</p>
              <p className="truncate text-[0.6875rem] text-subtle">{user.email}</p>
            </div>
            <Link href="/" target="_blank" aria-label="View site" className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-fg">
              <ExternalLink className="size-3.5" />
            </Link>
            <form action={logoutAction}>
              <button type="submit" aria-label="Sign out" className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-fg">
                <LogOut className="size-3.5" />
              </button>
            </form>
          </div>
        </div>
      </aside>
      {open ? <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} aria-hidden /> : null}
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-bg/80 px-4 backdrop-blur lg:hidden">
          <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-md p-1.5 text-fg">
            <Menu className="size-4" />
          </button>
          <span className="text-sm font-medium">Studio</span>
        </header>
        <main id="main" className="px-4 py-8 sm:px-8 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-medium tracking-tight text-fg">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
