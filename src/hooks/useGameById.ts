import { useQuery } from "@tanstack/react-query";
import { GameEvent } from "@/types/games";

const SUPABASE_URL = "https://wxcezmqaknhftwnpkanu.supabase.co";

export function useGameById(eventID: string | null) {
  return useQuery({
    queryKey: ['game', eventID],
    queryFn: async (): Promise<GameEvent | null> => {
      if (!eventID) return null;
      
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/sports-events?eventID=${eventID}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch game: ${response.status}`);
      }

      const result = await response.json();
      
      // Transform and return the single game
      const game = result.data?.[0];
      if (!game) return null;
      
      return {
        ...game,
        teams: {
          home: {
            ...game.teams.home,
            name: game.teams.home.names?.long || 
                  game.teams.home.names?.medium || 
                  game.teams.home.teamID,
            abbreviation: game.teams.home.names?.short
          },
          away: {
            ...game.teams.away,
            name: game.teams.away.names?.long || 
                  game.teams.away.names?.medium || 
                  game.teams.away.teamID,
            abbreviation: game.teams.away.names?.short
          }
        }
      };
    },
    enabled: !!eventID,
    staleTime: 60 * 1000, // 1 minute
  });
}
