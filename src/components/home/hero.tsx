"use client";

import gsap from "gsap";
import { ArrowDown, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { HeroVisual } from "@/components/three/hero-visual";
import { buttonVariants } from "@/components/ui/button";
import { LiveDot } from "@/components/ui/primitives";
import { useReducedMotion } from "@/hooks/use-media";

/**
 * Cinematic opening. GSAP drives the one sequenced timeline on the site:
 * letters rise out of a mask, then the supporting lines settle in order.
 */
export function Hero({ name, discipline, roles, intro, location }: { name: string; discipline: string; roles: string; intro: string; location: string }) {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || !root.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.from("[data-hero-char]", { yPercent: 115, duration: 1.4, stagger: 0.035 })
        .from("[data-hero-fade]", { opacity: 0, y: 14, duration: 1, stagger: 0.09 }, "-=1.0")
        .from("[data-hero-line]", { scaleX: 0, transformOrigin: "left center", duration: 1.2 }, "-=1.1");
    }, root);
    return () => ctx.revert();
  }, [reduced]);

  const words = name.toUpperCase().split(" ");

  return (
    <section ref={root} className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden pb-14 pt-28 md:pb-20">
      <HeroVisual />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-bg via-bg/70 to-transparent" />

      <div className="container-page pointer-events-none relative z-10 [&_a]:pointer-events-auto">
        <p data-hero-fade className="eyebrow mb-8 flex items-center gap-3">
          <LiveDot />
          {discipline}
          <span className="h-px w-8 bg-line-strong" />
          {location}
        </p>
        <h1 className="text-[clamp(3.25rem,13vw,10.5rem)] font-semibold leading-[0.86] tracking-[-0.055em] text-fg" aria-label={name}>
          {words.map((word, wi) => (
            <span key={wi} className="block overflow-hidden pb-[0.04em]" aria-hidden>
              {word.split("").map((ch, ci) => (
                <span key={ci} data-hero-char className="inline-block will-change-transform">
                  {ch}
                </span>
              ))}
            </span>
          ))}
        </h1>
        <div data-hero-line className="mt-10 h-px w-full bg-line-strong" />
        <div className="mt-8 grid gap-8 md:grid-cols-[1fr_1.2fr] md:items-end">
          <p data-hero-fade className="font-mono text-xs uppercase tracking-[0.18em] text-fg-2">
            {roles}
          </p>
          <div className="space-y-7">
            <p data-hero-fade className="max-w-xl text-balance text-xl leading-snug tracking-[-0.01em] text-fg-2 md:text-2xl">
              {intro}
            </p>
            <div data-hero-fade className="flex flex-wrap items-center gap-3">
              <Link href="/projects" className={buttonVariants({ variant: "primary", size: "lg" })}>
                Explore the work <ArrowRight />
              </Link>
              <Link href="/blog" className={buttonVariants({ variant: "ghost", size: "lg" })}>
                Read the writing
              </Link>
            </div>
          </div>
        </div>
      </div>
      <a
        href="#now"
        data-hero-fade
        aria-label="Scroll to content"
        className="absolute bottom-6 right-6 hidden size-10 place-items-center rounded-full border border-line text-muted transition hover:border-line-strong hover:text-fg md:grid"
      >
        <ArrowDown className="size-4 animate-bounce [animation-duration:2.4s]" />
      </a>
    </section>
  );
}
