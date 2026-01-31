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
      // Build query parameters
      const params = new URLSearchParams();
      
      if (filters.leagueID.length > 0) {
        params.set('leagueID', filters.leagueID.join(','));
      }
      
      if (filters.oddsAvailable) {
        params.set('oddsAvailable', 'true');
      }
      
      params.set('limit', '5');

      const response = await fetch(
        `https://wxcezmqaknhftwnpkanu.supabase.co/functions/v1/sports-events?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch games: ${response.status}`);
      }

      const result: SportsEventsResponse = await response.json();
      
      // Filter and transform the data
      const transformedData = (result.data || [])
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
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Auto-refresh every 1 minute
    retry: 2,
    meta: {
      onError: (error: Error) => {
        console.error('Error fetching games:', error);
        toast({
          title: "Failed to load games",
          description: error.message || "Please try again later",
          variant: "destructive",
        });
      },
    },
  });
}
