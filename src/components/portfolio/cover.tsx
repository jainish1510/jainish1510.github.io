import Image from "next/image";
import { cn, hashString } from "@/lib/utils";

type CoverMedia = { path: string; alt: string; width: number | null; height: number | null } | null | undefined;

/** Uploaded cover via next/image, or a deterministic gradient when none exists. */
export function Cover({ media, seed, className, sizes, priority, imgClassName }: { media: CoverMedia; seed: string; className?: string; sizes: string; priority?: boolean; imgClassName?: string }) {
  if (media) {
    return (
      <div className={cn("relative overflow-hidden bg-surface", className)}>
        <Image
          src={media.path}
          alt={media.alt}
          fill
          sizes={sizes}
          priority={priority}
          className={cn("object-cover", imgClassName)}
        />
      </div>
    );
  }
  const hue = hashString(seed) % 360;
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ background: `radial-gradient(120% 90% at 20% 10%, hsl(${hue} 50% 30% / 0.55), transparent 60%), radial-gradient(80% 80% at 90% 90%, hsl(${(hue + 60) % 360} 40% 25% / 0.4), transparent 60%), var(--surface)` }}
      aria-hidden
    >
      <div className="grid-bg absolute inset-0 opacity-60" />
    </div>
  );
}
