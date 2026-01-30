import { Search, Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyGamesStateProps {
  hasFilters: boolean;
  onClearFilters: () => void;
}

export const EmptyGamesState = ({
  hasFilters,
  onClearFilters,
}: EmptyGamesStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mb-6">
        {hasFilters ? (
          <Filter className="w-8 h-8 text-muted-foreground" />
        ) : (
          <Calendar className="w-8 h-8 text-muted-foreground" />
        )}
      </div>

      <h3 className="text-xl font-semibold mb-2">
        {hasFilters ? "No games match your filters" : "No games available"}
      </h3>

      <p className="text-muted-foreground max-w-md mb-6">
        {hasFilters
          ? "Try adjusting your filters or search query to find more games."
          : "There are no games scheduled for the selected time period. Check back later or select a different date range."}
      </p>

      {hasFilters && (
        <Button variant="outline" onClick={onClearFilters}>
          Clear all filters
        </Button>
      )}
    </div>
  );
};
