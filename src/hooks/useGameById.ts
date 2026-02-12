import { useQuery } from "@tanstack/react-query";
import { GameEvent } from "@/types/games";
import { gameByIdResponseSchema } from "@/backend/contracts/api";
import { adaptGameEvent } from "@/lib/gameEventAdapter";
import { tipoffFetch } from "@/lib/tipoffApi";

export function useGameById(eventID: string | null) {
  return useQuery({
    queryKey: ['game', eventID],
    queryFn: async (): Promise<GameEvent | null> => {
      if (!eventID) return null;

      const payload = await tipoffFetch<unknown>(`/games/${eventID}`);
      const parsed = gameByIdResponseSchema.parse(payload);

      const game = parsed.data;
      if (!game) return null;

      return adaptGameEvent(game);
    },
    enabled: !!eventID,
    staleTime: 60 * 1000, // 1 minute
  });
}
