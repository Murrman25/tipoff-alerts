import { getLogoUrl } from "@/components/TeamLogo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Team } from "@/hooks/useFavoriteTeams";

interface FavoriteTeamsFilterProps {
  favoriteTeams: Team[];
  selectedTeamIds: string[];
  onToggleTeam: (teamId: string) => void;
  isLoading?: boolean;
}

export const FavoriteTeamsFilter = ({
  favoriteTeams,
  selectedTeamIds,
  onToggleTeam,
  isLoading = false,
}: FavoriteTeamsFilterProps) => {
  // Don't render if no favorites and not loading
  if (!isLoading && favoriteTeams.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Heart className="w-3 h-3" />
        <span className="font-medium">My Teams</span>
      </div>

      {/* Team Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-20 rounded-lg shrink-0" />
          ))
        ) : (
          favoriteTeams.map((team) => {
            const isSelected = selectedTeamIds.includes(team.id);
            const logoUrl = getLogoUrl(team.logo_filename);

            return (
              <Button
                key={team.id}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onToggleTeam(team.id)}
                className={cn(
                  "h-9 px-2.5 text-xs font-medium rounded-lg transition-all shrink-0 gap-1.5",
                  isSelected
                    ? "bg-primary/20 text-primary border border-primary/50 hover:bg-primary/30"
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent"
                )}
              >
                {/* Team Logo */}
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={team.display_name}
                    className="w-5 h-5 object-contain"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                    <Users className="w-3 h-3" />
                  </div>
                )}
                {/* Team abbreviation */}
                <span>{team.short_name || team.display_name.slice(0, 3).toUpperCase()}</span>
              </Button>
            );
          })
        )}
      </div>
    </div>
  );
};
