import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { Toaster } from "sonner";
import { CommandPalette } from "@/components/interaction/command-palette";
import { CustomCursor } from "@/components/interaction/cursor";
import { EasterEggs } from "@/components/interaction/easter-eggs";
import { KeyboardShortcuts } from "@/components/interaction/shortcuts";
import { ThemeProvider, themeScript } from "@/components/interaction/theme";
import { listSocialLinks } from "@/lib/repositories/personal";
import { getSite, siteUrl } from "@/lib/site";
import "./globals.css";

export function generateMetadata(): Metadata {
  const site = getSite();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: `${site.name} — Research Studio`, template: `%s · ${site.name}` },
    description: site.description,
    applicationName: `${site.name} — Research Studio`,
    authors: [{ name: site.name }],
    creator: site.name,
    alternates: { canonical: "/", types: { "application/rss+xml": "/rss.xml" } },
    openGraph: { type: "website", siteName: site.name, locale: "en_US", url: "/", images: [{ url: "/og/site.png", width: 1200, height: 630, alt: site.name }] },
    twitter: { card: "summary_large_image", images: ["/og/site.png"] },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#08090a" },
    { media: "(prefers-color-scheme: light)", color: "#f7f7f5" },
  ],
  colorScheme: "dark light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const site = getSite();
  const github = listSocialLinks().find((s) => s.platform === "github")?.url;

  return (
    <html lang="en" data-theme="dark" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="grain">
        <ThemeProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-fg focus:px-4 focus:py-2 focus:text-sm focus:text-bg"
          >
            Skip to content
          </a>
          {children}
          <CommandPalette githubUrl={github} resumeUrl={site.resumeUrl || undefined} email={site.email || undefined} />
          <KeyboardShortcuts />
          <EasterEggs />
          <CustomCursor />
          <Toaster position="bottom-right" theme="system" toastOptions={{ className: "!rounded-xl !border-line-strong !bg-surface !text-fg !shadow-2xl !font-sans" }} />
        </ThemeProvider>
      </body>
    </html>
  );
}
