import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { JsonLd, personSchema } from "@/lib/seo";
import { listSocialLinks } from "@/lib/repositories/personal";
import { getSettings, parseNav } from "@/lib/settings";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [settings, socials] = await Promise.all([getSettings(), listSocialLinks()]);
  return (
    <>
      <JsonLd data={personSchema(settings, socials)} />
      <SiteHeader name={settings["site.name"]} nav={parseNav(settings["nav.items"])} />
      <main id="main" className="relative">
        {children}
      </main>
      <SiteFooter
        name={settings["site.name"]}
        motto={settings["footer.motto"].split("\n").filter(Boolean)}
        socials={socials.filter((s) => s.platform !== "rss").map((s) => ({ platform: s.platform, label: s.label, url: s.url }))}
        location={settings["location.label"]}
      />
    </>
  );
}
