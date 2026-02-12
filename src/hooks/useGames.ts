import { useQuery } from "@tanstack/react-query";
import { GameEvent, GamesFilters } from "@/types/games";
import { toast } from "@/hooks/use-toast";
import { gamesSearchResponseSchema } from "@/backend/contracts/api";
import { adaptGameEvents } from "@/lib/gameEventAdapter";
import { isRateLimitedError, tipoffFetch } from "@/lib/tipoffApi";

const DEFAULT_LIMIT = 40;

export function useGames(filters: GamesFilters) {
  return useQuery({
    queryKey: ['games', filters.leagueID, filters.bookmakerID, filters.betTypeID, filters.oddsAvailable, filters.searchQuery],
    queryFn: async (): Promise<GameEvent[]> => {
      const payload = await tipoffFetch<unknown>("/games/search", {
        query: {
          leagueID: filters.leagueID.length > 0 ? filters.leagueID.join(",") : undefined,
          status: "all",
          q: filters.searchQuery || undefined,
          limit: DEFAULT_LIMIT,
          bookmakerID: filters.bookmakerID.length > 0 ? filters.bookmakerID.join(",") : undefined,
          oddsAvailable: filters.oddsAvailable,
        },
      });

      const parsed = gamesSearchResponseSchema.parse(payload);

      const activeGames = parsed.data.filter((event) => !event.status?.ended && !event.status?.cancelled);
      return adaptGameEvents(activeGames);
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    retry: (failureCount, error) => {
      if (isRateLimitedError(error)) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: (error: Error) => {
      console.error('Error fetching games:', error);
      if (isRateLimitedError(error)) {
        return;
      }

      toast({
        title: "Failed to load games",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });
}
