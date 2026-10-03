import { ogCard } from "@/lib/og";
import { getSite } from "@/lib/site";

// Written to out/og/site.png at build time (a real .png so GitHub Pages serves the right type).
export const dynamic = "force-static";

export function GET() {
  const s = getSite();
  return ogCard({ eyebrow: s.discipline, title: s.name, subtitle: s.heroIntro, footer: s.roles });
}
