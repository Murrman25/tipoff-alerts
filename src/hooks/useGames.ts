import { useQuery } from "@tanstack/react-query";
import { GameEvent, GamesFilters } from "@/types/games";
import { toast } from "@/hooks/use-toast";
import { gamesSearchResponseSchema } from "@/backend/contracts/api";
import { adaptGameEvents } from "@/lib/gameEventAdapter";
import { isRateLimitedError, tipoffFetch } from "@/lib/tipoffApi";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const DEFAULT_LIMIT = 40;
const SEARCH_DEBOUNCE_MS = 300;

export function useGames(
  filters: GamesFilters,
  options?: {
    enabled?: boolean;
  },
) {
  const debouncedSearchQuery = useDebouncedValue(filters.searchQuery.trim(), SEARCH_DEBOUNCE_MS);
  const teamIDs = (filters.teamID || []).filter((id) => id.length > 0);
  const requestLimit = typeof filters.limit === "number" ? Math.max(1, Math.min(100, filters.limit)) : DEFAULT_LIMIT;

  return useQuery({
    queryKey: [
      'games',
      filters.leagueID,
      filters.bookmakerID,
      filters.betTypeID,
      filters.status,
      filters.oddsAvailable,
      debouncedSearchQuery,
      teamIDs,
      filters.from || null,
      filters.to || null,
      requestLimit,
    ],
    queryFn: async (): Promise<GameEvent[]> => {
      const payload = await tipoffFetch<unknown>("/games/search", {
        query: {
          leagueID: filters.leagueID.length > 0 ? filters.leagueID.join(",") : undefined,
          status: filters.status,
          q: debouncedSearchQuery || undefined,
          teamID: teamIDs.length > 0 ? teamIDs.join(",") : undefined,
          from: filters.from || undefined,
          to: filters.to || undefined,
          limit: requestLimit,
          bookmakerID: filters.bookmakerID.length > 0 ? filters.bookmakerID.join(",") : undefined,
          oddsAvailable: filters.oddsAvailable,
        },
      });

      const parsed = gamesSearchResponseSchema.parse(payload);

      const activeGames = parsed.data.filter((event) => !event.status?.ended && !event.status?.cancelled);
      return adaptGameEvents(activeGames);
    },
    enabled: options?.enabled ?? true,
    placeholderData: (previousData) => previousData,
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
