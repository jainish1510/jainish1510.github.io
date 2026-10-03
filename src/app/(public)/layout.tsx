import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { listSocialLinks } from "@/lib/repositories/personal";
import { JsonLd, personSchema } from "@/lib/seo";
import { getSite } from "@/lib/site";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const site = getSite();
  const socials = listSocialLinks();
  return (
    <>
      <JsonLd data={personSchema(site, socials)} />
      <SiteHeader name={site.name} nav={site.nav} />
      <main id="main" className="relative">
        {children}
      </main>
      <SiteFooter
        name={site.name}
        motto={site.footerMotto}
        socials={socials.filter((s) => s.platform !== "rss").map((s) => ({ platform: s.platform, label: s.label, url: s.url }))}
        location={site.location}
      />
    </>
  );
}
