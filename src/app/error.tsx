"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <main id="main" className="grid min-h-[70dvh] place-items-center px-6">
      <div className="max-w-md text-center">
        <p className="eyebrow">Something broke</p>
        <h1 className="mt-4 text-3xl font-medium tracking-tight text-fg">Currently unavailable.</h1>
        <p className="mt-3 text-sm text-muted">An unexpected error interrupted this page. It&apos;s been logged{error.digest ? ` (ref ${error.digest})` : ""}.</p>
        <Button variant="primary" className="mt-8" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  );
}
