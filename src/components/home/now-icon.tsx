import { BookOpen, Dot, GraduationCap, Hammer, MapPin, Microscope, Music2, Sparkles } from "lucide-react";

const ICONS = { graduation: GraduationCap, microscope: Microscope, hammer: Hammer, book: BookOpen, pin: MapPin, music: Music2, spark: Sparkles, dot: Dot };

export const NOW_ICON_NAMES = Object.keys(ICONS);

export function NowIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name as keyof typeof ICONS] ?? Dot;
  return <Icon className={className} aria-hidden />;
}
