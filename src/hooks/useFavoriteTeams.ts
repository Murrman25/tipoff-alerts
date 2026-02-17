import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { UserFavoriteTeam } from "@/types/profile";

export interface Team {
  id: string;
  display_name: string;
  short_name: string | null;
  city: string | null;
  league: string;
  sport: string;
  logo_filename: string | null;
  sportsgameodds_id: string | null;
}

export const useFavoriteTeams = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all teams
  const { data: allTeams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ["teams"],
    queryFn: async (): Promise<Team[]> => {
      const { data, error } = await supabase
        .from("teams")
        .select("id, display_name, short_name, city, league, sport, logo_filename, sportsgameodds_id")
        .order("display_name");

      if (error) throw error;
      return data as Team[];
    },
  });

  // Fetch user's favorite teams
  const { data: favoriteTeamIds = [], isLoading: favoritesLoading } = useQuery({
    queryKey: ["favorite-teams", user?.id],
    queryFn: async (): Promise<string[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_favorite_teams")
        .select("team_id")
        .eq("user_id", user.id);

      if (error) throw error;
      return data.map((f) => f.team_id);
    },
    enabled: !!user,
  });

  const addFavorite = useMutation({
    mutationFn: async (teamId: string) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_favorite_teams")
        .insert({ user_id: user.id, team_id: teamId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorite-teams", user?.id] });
    },
  });

  const removeFavorite = useMutation({
    mutationFn: async (teamId: string) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_favorite_teams")
        .delete()
        .eq("user_id", user.id)
        .eq("team_id", teamId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorite-teams", user?.id] });
    },
  });

  const favoriteTeams = allTeams.filter((t) => favoriteTeamIds.includes(t.id));

  return {
    allTeams,
    favoriteTeams,
    favoriteTeamIds,
    isLoading: teamsLoading || favoritesLoading,
    addFavorite,
    removeFavorite,
  };
};
