import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { Toaster } from "sonner";
import { CommandPalette } from "@/components/interaction/command-palette";
import { CustomCursor } from "@/components/interaction/cursor";
import { EasterEggs } from "@/components/interaction/easter-eggs";
import { KeyboardShortcuts } from "@/components/interaction/shortcuts";
import { ThemeProvider, themeScript } from "@/components/interaction/theme";
import { env } from "@/lib/env";
import { listSocialLinks } from "@/lib/repositories/personal";
import { getSettings } from "@/lib/settings";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const name = settings["site.name"];
  return {
    metadataBase: new URL(env.siteUrl),
    title: { default: `${name} — Research Studio`, template: `%s · ${name}` },
    description: settings["site.description"],
    applicationName: `${name} — Research Studio`,
    authors: [{ name }],
    creator: name,
    alternates: { canonical: "/", types: { "application/rss+xml": "/rss.xml" } },
    openGraph: { type: "website", siteName: name, locale: "en_US", url: "/" },
    twitter: { card: "summary_large_image" },
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, socials] = await Promise.all([getSettings(), listSocialLinks()]);
  const github = socials.find((s) => s.platform === "github")?.url;

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
          <CommandPalette githubUrl={github} resumeUrl={settings["resume.url"] || undefined} email={settings["contact.email"] || undefined} />
          <KeyboardShortcuts />
          <EasterEggs />
          <CustomCursor />
          <Toaster
            position="bottom-right"
            theme="system"
            toastOptions={{
              className: "!rounded-xl !border-line-strong !bg-surface !text-fg !shadow-2xl !font-sans",
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
