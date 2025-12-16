import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loader wyświetlany podczas ładowania sesji nauki
 */
export function StudySkeleton() {
  return (
    <div className="flex flex-col items-center gap-6" aria-busy="true" aria-label="Ładowanie sesji nauki">
      {/* Progress bar skeleton */}
      <div className="w-full max-w-md space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-2 w-full" />
      </div>

      {/* Card skeleton */}
      <Skeleton className="h-64 w-full max-w-md rounded-xl" />

      {/* Rating buttons skeleton - 2x2 grid */}
      <div className="grid w-full max-w-md grid-cols-2 gap-3">
        <Skeleton className="h-12 rounded-md" />
        <Skeleton className="h-12 rounded-md" />
        <Skeleton className="h-12 rounded-md" />
        <Skeleton className="h-12 rounded-md" />
      </div>
    </div>
  );
}

