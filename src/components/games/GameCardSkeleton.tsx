import { Skeleton } from "@/components/ui/skeleton";

export const GameCardSkeleton = () => {
  return (
    <div className="p-5 rounded-xl bg-card border border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-28" />
      </div>

      {/* Teams */}
      <div className="space-y-4">
        {/* Away team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-10 w-[70px]" />
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-border/30" />

        {/* Home team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-10 w-[70px]" />
          </div>
        </div>
      </div>

      {/* Total row */}
      <div className="flex items-center justify-between mt-5 pt-4 border-t border-border/50">
        <Skeleton className="h-4 w-10" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-12 w-20" />
          <Skeleton className="h-12 w-20" />
        </div>
      </div>

      {/* Create Alert button */}
      <div className="mt-5 pt-4 border-t border-border/50">
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
};
