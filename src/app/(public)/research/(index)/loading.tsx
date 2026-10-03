import { Skeleton } from "@/components/ui/primitives";

/** Shown during route transitions — mirrors the page header + list rhythm. */
export default function Loading() {
  return (
    <div className="container-page pt-32 md:pt-44" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-6 h-12 w-full max-w-2xl" />
      <Skeleton className="mt-3 h-12 w-2/3 max-w-xl" />
      <div className="mt-16 space-y-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-6 border-t border-line pt-6">
            <div className="flex-1 space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </div>
            <Skeleton className="hidden h-28 w-44 sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
