import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Heart, X, Search } from "lucide-react";
import { getLogoUrl } from "@/components/TeamLogo";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Team } from "@/hooks/useFavoriteTeams";

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
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Deduplicate by display_name, preferring NCAAF for NCAA schools
  const deduplicatedTeams = useMemo(() => {
    const teamMap = new Map<string, typeof allTeams[0]>();
    
    for (const team of allTeams) {
      const existing = teamMap.get(team.display_name);
      if (!existing) {
        teamMap.set(team.display_name, team);
      } else if (team.league === 'NCAAF' && existing.league === 'NCAAB') {
        // Prefer NCAAF entry for NCAA schools (shared logos stored in ncaaf folder)
        teamMap.set(team.display_name, team);
      }
    }
    
    return Array.from(teamMap.values());
  }, [allTeams]);

  // Filter out already favorited teams from deduplicated list
  const availableTeams = useMemo(() => {
    return deduplicatedTeams.filter((t) => !favoriteTeamIds.includes(t.id));
  }, [deduplicatedTeams, favoriteTeamIds]);

  const handleSelectTeam = (teamId: string) => {
    onAddFavorite(teamId);
    setOpen(false);
    setSearchValue("");
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
        {/* Selected teams with logos */}
        {favoriteTeams.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Your Teams:</p>
            <div className="flex flex-wrap gap-3">
              {favoriteTeams.map((team) => (
                <div
                  key={team.id}
                  className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 shadow-sm"
                >
                  {team.logo_filename ? (
                    <img
                      src={getLogoUrl(team.logo_filename)!}
                      alt={team.display_name}
                      className="w-8 h-8 object-contain"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  ) : (
                    <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-muted-foreground">
                        {team.short_name?.charAt(0) || team.display_name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {team.display_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {team.league}
                    </span>
                  </div>
                  <button
                    onClick={() => onRemoveFavorite(team.id)}
                    disabled={isRemovingFavorite}
                    className="ml-2 p-1 hover:bg-destructive/10 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search to add teams */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Add a Team:</p>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search teams..."
                  className="pl-10 cursor-pointer"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onClick={() => setOpen(true)}
                />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Search teams..."
                  value={searchValue}
                  onValueChange={setSearchValue}
                />
                <CommandList>
                  <CommandEmpty>No teams found.</CommandEmpty>
                  <CommandGroup>
                    {availableTeams
                      .filter(
                        (team) =>
                          team.display_name
                            .toLowerCase()
                            .includes(searchValue.toLowerCase()) ||
                          team.city
                            ?.toLowerCase()
                            .includes(searchValue.toLowerCase()) ||
                          team.league
                            .toLowerCase()
                            .includes(searchValue.toLowerCase())
                      )
                      .slice(0, 20)
                      .map((team) => (
                        <CommandItem
                          key={team.id}
                          value={team.display_name}
                          onSelect={() => handleSelectTeam(team.id)}
                          disabled={isAddingFavorite}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          {team.logo_filename ? (
                            <img
                              src={getLogoUrl(team.logo_filename)!}
                              alt={team.display_name}
                              className="w-6 h-6 object-contain"
                              onError={(e) =>
                                (e.currentTarget.style.display = "none")
                              }
                            />
                          ) : (
                            <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center">
                              <span className="text-xs">
                                {team.short_name?.charAt(0) ||
                                  team.display_name.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-sm">{team.display_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {team.league}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {favoriteTeams.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No favorite teams yet. Search to add your first team!
          </p>
        )}
      </CardContent>
    </Card>
  );
};
