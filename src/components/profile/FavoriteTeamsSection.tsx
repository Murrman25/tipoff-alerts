import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Plus, X, Loader2 } from "lucide-react";
import type { Team } from "@/hooks/useFavoriteTeams";

const LEAGUES = ["NFL", "NBA", "MLB", "NHL", "MLS", "NCAAF", "NCAAB"];

interface FavoriteTeamsSectionProps {
  allTeams: Team[];
  favoriteTeams: Team[];
  favoriteTeamIds: string[];
  onAddFavorite: (teamId: string) => void;
  onRemoveFavorite: (teamId: string) => void;
  isAddingFavorite: boolean;
  isRemovingFavorite: boolean;
}

export const FavoriteTeamsSection = ({
  allTeams,
  favoriteTeams,
  favoriteTeamIds,
  onAddFavorite,
  onRemoveFavorite,
  isAddingFavorite,
  isRemovingFavorite,
}: FavoriteTeamsSectionProps) => {
  const [selectedLeague, setSelectedLeague] = useState<string>("NFL");

  const teamsInLeague = allTeams.filter(
    (t) => t.league.toUpperCase() === selectedLeague
  );

  const getTeamLogoUrl = (team: Team) => {
    if (!team.logo_filename) return null;
    return `https://wxcezmqaknhftwnpkanu.supabase.co/storage/v1/object/public/team-logos/${team.logo_filename}.svg`;
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Heart className="w-5 h-5 text-red-400" />
          Favorite Teams
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected teams */}
        {favoriteTeams.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Your Teams:</p>
            <div className="flex flex-wrap gap-2">
              {favoriteTeams.map((team) => (
                <Badge
                  key={team.id}
                  variant="secondary"
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary border-primary/20"
                >
                  {team.logo_filename && (
                    <img
                      src={getTeamLogoUrl(team)!}
                      alt={team.display_name}
                      className="w-4 h-4"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  )}
                  {team.display_name}
                  <button
                    onClick={() => onRemoveFavorite(team.id)}
                    disabled={isRemovingFavorite}
                    className="ml-1 hover:text-destructive transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* League filter */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Add Teams:</p>
          <div className="flex flex-wrap gap-2">
            {LEAGUES.map((league) => (
              <Button
                key={league}
                variant={selectedLeague === league ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedLeague(league)}
                className={
                  selectedLeague === league
                    ? "bg-primary text-primary-foreground"
                    : ""
                }
              >
                {league}
              </Button>
            ))}
          </div>
        </div>

        {/* Available teams grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {teamsInLeague.map((team) => {
            const isFavorite = favoriteTeamIds.includes(team.id);
            return (
              <Button
                key={team.id}
                variant="outline"
                size="sm"
                disabled={isFavorite || isAddingFavorite}
                onClick={() => onAddFavorite(team.id)}
                className={`justify-start gap-2 ${
                  isFavorite ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {team.logo_filename && (
                  <img
                    src={getTeamLogoUrl(team)!}
                    alt={team.display_name}
                    className="w-4 h-4"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                )}
                <span className="truncate text-xs">
                  {team.short_name || team.display_name}
                </span>
                {!isFavorite && <Plus className="w-3 h-3 ml-auto flex-shrink-0" />}
              </Button>
            );
          })}
        </div>

        {teamsInLeague.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No teams found for {selectedLeague}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
