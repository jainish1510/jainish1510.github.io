import { ogCard, OG_SIZE } from "@/lib/og";
import { getSettings } from "@/lib/settings";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Jainish Patel — Research Studio";

export default async function Image() {
  const s = await getSettings();
  return ogCard({ eyebrow: s["site.discipline"], title: s["site.name"], subtitle: s["hero.intro"], footer: s["site.roles"] });
}
