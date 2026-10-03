import type { Metadata } from "next";
import { SocialIcon } from "@/components/brand/icons";
import { ContactForm } from "@/components/portfolio/contact-form";
import { LocalClock } from "@/components/widgets/local-clock";
import { listSocialLinks } from "@/lib/repositories/personal";
import { getSettings } from "@/lib/settings";

export const revalidate = 60;
export const metadata: Metadata = { title: "Contact", description: "Get in touch about research, engineering or collaboration.", alternates: { canonical: "/contact" } };

export default async function ContactPage() {
  const [settings, socials] = await Promise.all([getSettings(), listSocialLinks()]);
  return (
    <div className="container-page pt-32 md:pt-44">
      <div className="grid gap-16 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="eyebrow">Contact</p>
          <h1 className="mt-5 text-balance text-4xl font-medium leading-[1.05] tracking-[-0.04em] sm:text-6xl">Say hello.</h1>
          {settings["contact.blurb"] ? <p className="mt-6 max-w-md text-lg leading-relaxed text-fg-2">{settings["contact.blurb"]}</p> : null}
          {settings["contact.availability"] ? <p className="mt-4 text-sm text-muted">{settings["contact.availability"]}</p> : null}
          <ul className="mt-12 divide-y divide-line border-y border-line">
            {socials
              .filter((s) => s.platform !== "rss")
              .map((s) => (
                <li key={s.id}>
                  <a href={s.url} target={s.url.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" data-cursor="external" className="group flex items-center justify-between py-4">
                    <span className="flex items-center gap-3 text-fg">
                      <SocialIcon platform={s.platform} className="size-4 text-muted group-hover:text-fg" />
                      {s.label}
                    </span>
                    <span className="font-mono text-xs text-subtle group-hover:text-fg-2">{s.handle} ↗</span>
                  </a>
                </li>
              ))}
          </ul>
          <div className="mt-8 max-w-xs">
            <LocalClock timezone={settings["location.timezone"]} label={settings["location.label"]} />
          </div>
        </div>
        <ContactForm />
      </div>
    </div>
  );
}
