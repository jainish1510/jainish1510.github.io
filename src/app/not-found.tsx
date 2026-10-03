import Link from "next/link";
import { StudioMark } from "@/components/brand/icons";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="grid min-h-dvh place-items-center px-6">
      <div className="grid-bg pointer-events-none fixed inset-0 opacity-50" aria-hidden />
      <div className="relative max-w-md text-center">
        <StudioMark className="mx-auto size-8 text-fg" />
        <p className="eyebrow mt-8">404 · Off the map</p>
        <h1 className="mt-4 text-4xl font-medium tracking-[-0.035em] text-fg">This page drifted out of the constellation.</h1>
        <p className="mt-4 text-muted">It may have moved, or never existed. Try search, or start from the beginning.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className={buttonVariants({ variant: "primary" })}>
            Go home
          </Link>
          <Link href="/search" className={buttonVariants({ variant: "secondary" })}>
            Search
          </Link>
        </div>
      </div>
    </main>
  );
}
