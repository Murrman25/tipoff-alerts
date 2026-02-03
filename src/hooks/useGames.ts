import { useQuery } from "@tanstack/react-query";
import { GameEvent, GamesFilters } from "@/types/games";
import { toast } from "@/hooks/use-toast";

interface SportsEventsResponse {
  data: GameEvent[];
  nextCursor?: string;
}

export function useGames(filters: GamesFilters) {
  return useQuery({
    queryKey: ['games', filters.leagueID, filters.oddsAvailable],
    queryFn: async (): Promise<GameEvent[]> => {
      // Fetch both live games and upcoming games, then merge
      const baseParams = new URLSearchParams();
      
      if (filters.leagueID.length > 0) {
        baseParams.set('leagueID', filters.leagueID.join(','));
      }
      
      if (filters.oddsAvailable) {
        baseParams.set('oddsAvailable', 'true');
      }

      // Fetch live games first
      const liveParams = new URLSearchParams(baseParams);
      liveParams.set('live', 'true');
      liveParams.set('limit', '10');

      // Fetch upcoming games
      const upcomingParams = new URLSearchParams(baseParams);
      upcomingParams.set('limit', '10');

      const [liveResponse, upcomingResponse] = await Promise.all([
        fetch(
          `https://wxcezmqaknhftwnpkanu.supabase.co/functions/v1/sports-events?${liveParams.toString()}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }
        ),
        fetch(
          `https://wxcezmqaknhftwnpkanu.supabase.co/functions/v1/sports-events?${upcomingParams.toString()}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }
        ),
      ]);

      // Handle rate limiting gracefully
      if (liveResponse.status === 429 || upcomingResponse.status === 429) {
        const error = new Error('Rate limit exceeded. Please wait a moment and try again.');
        (error as any).isRateLimited = true;
        throw error;
      }

      // Parse responses
      const liveData: SportsEventsResponse = liveResponse.ok 
        ? await liveResponse.json() 
        : { data: [] };
      
      if (!upcomingResponse.ok) {
        const errorData = await upcomingResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch games: ${upcomingResponse.status}`);
      }
      
      const upcomingData: SportsEventsResponse = await upcomingResponse.json();
      
      // Merge: live games first, then upcoming (deduplicated)
      const liveEventIds = new Set((liveData.data || []).map(e => e.eventID));
      const mergedData = [
        ...(liveData.data || []),
        ...(upcomingData.data || []).filter(e => !liveEventIds.has(e.eventID))
      ];

      console.log(`Fetched ${liveData.data?.length || 0} live games, ${upcomingData.data?.length || 0} upcoming games`);
      
      // Filter and transform the data
      const transformedData = mergedData
        .filter((event: any) => {
          // Only show upcoming/live events, not ended/cancelled
          return !event.status?.ended && !event.status?.cancelled;
        })
        .map((event: any) => ({
          ...event,
          teams: {
            home: {
              ...event.teams.home,
              name: event.teams.home.names?.long || 
                    event.teams.home.names?.medium || 
                    event.teams.home.teamID,
              abbreviation: event.teams.home.names?.short
            },
            away: {
              ...event.teams.away,
              name: event.teams.away.names?.long || 
                    event.teams.away.names?.medium || 
                    event.teams.away.teamID,
              abbreviation: event.teams.away.names?.short
            }
          }
        }));

      return transformedData;
    },
    staleTime: 60 * 1000, // 1 minute (increased from 30s to reduce API calls)
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes (reduced frequency)
    retry: (failureCount, error) => {
      // Don't retry on rate limit errors
      if ((error as any)?.isRateLimited) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    meta: {
      onError: (error: Error) => {
        console.error('Error fetching games:', error);
        // Only show toast for non-rate-limit errors (rate limit has inline UI)
        if (!(error as any)?.isRateLimited) {
          toast({
            title: "Failed to load games",
            description: error.message || "Please try again later",
            variant: "destructive",
          });
        }
      },
    },
  });
}
