import { Calendar, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export type EmptyGamesStateVariant =
  | "globalNoLive"
  | "leagueWindowEmpty"
  | "filtered";

interface EmptyGamesStateProps {
  variant: EmptyGamesStateVariant;
  onClearFilters?: () => void;
  onShowUpcoming?: () => void;
}

export const EmptyGamesState = ({
  variant,
  onClearFilters,
  onShowUpcoming,
}: EmptyGamesStateProps) => {
  const isFiltered = variant === "filtered";
  const isGlobalNoLive = variant === "globalNoLive";

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mb-6">
        {isFiltered ? (
          <Filter className="w-8 h-8 text-muted-foreground" />
        ) : (
          <Calendar className="w-8 h-8 text-muted-foreground" />
        )}
      </div>

      <h3 className="text-xl font-semibold mb-2">
        {isFiltered
          ? "No games match your filters"
          : isGlobalNoLive
            ? "No live games right now"
            : "No league games in the next 3 days"}
      </h3>

      <p className="text-muted-foreground max-w-md mb-6">
        {isFiltered
          ? "Try adjusting your filters or search query to find more games."
          : isGlobalNoLive
            ? "Live games are currently unavailable. You can switch to upcoming games to keep browsing."
            : "We could not find games for the selected league in the live + next 3 day window."}
      </p>

      {isFiltered && onClearFilters && (
        <Button variant="outline" onClick={onClearFilters}>
          Clear all filters
        </Button>
      )}
      {isGlobalNoLive && onShowUpcoming && (
        <Button variant="outline" onClick={onShowUpcoming}>
          Show Upcoming
        </Button>
      )}
    </div>
  );
};
