import Link from "next/link";
import { SocialIcon } from "@/components/brand/icons";
import { FooterField } from "./footer-field";

export function SiteFooter({ name, motto, socials, location }: { name: string; motto: string[]; socials: { platform: string; label: string; url: string }[]; location: string }) {
  const year = new Date().getFullYear();
  return (
    <footer className="relative mt-32 overflow-hidden border-t border-line">
      <FooterField />
      <div className="container-page relative py-20">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-fg">{name}</p>
            <div className="mt-6 space-y-1 text-3xl font-medium tracking-[-0.03em] text-fg-2 md:text-4xl">
              {motto.map((line, i) => (
                <p key={line} style={{ opacity: 1 - i * 0.22 }}>
                  {line}
                </p>
              ))}
            </div>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-muted md:grid-cols-1">
            <p className="eyebrow col-span-2 mb-2 md:col-span-1">Explore</p>
            {[
              ["About", "/about"],
              ["Projects", "/projects"],
              ["Research", "/research"],
              ["Writing", "/blog"],
              ["Experience", "/experience"],
              ["Saved", "/bookmarks"],
            ].map(([label, href]) => (
              <Link key={href} href={href!} className="link-underline w-fit hover:text-fg">
                {label}
              </Link>
            ))}
          </nav>
          <div className="space-y-2 text-sm text-muted">
            <p className="eyebrow mb-2">Elsewhere</p>
            {socials.map((s) => (
              <a
                key={s.url}
                href={s.url}
                target={s.url.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                data-cursor={s.url.startsWith("http") ? "external" : undefined}
                className="group flex w-fit items-center gap-2.5 hover:text-fg"
              >
                <SocialIcon platform={s.platform} className="size-3.5 opacity-70 group-hover:opacity-100" />
                <span className="link-underline">{s.label}</span>
              </a>
            ))}
            <a href="/rss.xml" className="group flex w-fit items-center gap-2.5 hover:text-fg">
              <SocialIcon platform="rss" className="size-3.5 opacity-70" />
              <span className="link-underline">RSS</span>
            </a>
          </div>
        </div>
        <div className="mt-20 flex flex-col gap-3 border-t border-line pt-6 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {name}
          </p>
          <p>{location} · Built with Next.js, SQLite &amp; WebGL</p>
          <p className="hidden sm:block">
            Press <span className="text-muted">?</span> for shortcuts
          </p>
        </div>
      </div>
    </footer>
  );
}
