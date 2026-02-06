import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import type { 
  AlertTemplate, 
  AlertTemplateInput, 
  RuleType, 
  MarketType, 
  DirectionType, 
  GamePeriod, 
  TimeWindow 
} from "@/types/alerts";

// Type for database row (snake_case from Supabase)
interface AlertTemplateRow {
  id: string;
  user_id: string;
  name: string;
  rule_type: string;
  market_type: string;
  threshold: number | null;
  direction: string | null;
  surge_window_minutes: number | null;
  run_window_minutes: number | null;
  game_period: string | null;
  time_window: string;
  created_at: string;
  updated_at: string;
}

// Transform database row to typed AlertTemplate
const transformRow = (row: AlertTemplateRow): AlertTemplate => ({
  id: row.id,
  user_id: row.user_id,
  name: row.name,
  rule_type: row.rule_type as RuleType,
  market_type: row.market_type as MarketType,
  threshold: row.threshold,
  direction: row.direction as DirectionType | null,
  surge_window_minutes: row.surge_window_minutes,
  run_window_minutes: row.run_window_minutes,
  game_period: row.game_period as GamePeriod | null,
  time_window: row.time_window as TimeWindow,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

// Fetch all templates for the current user
export const useAlertTemplates = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["alert-templates", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("alert_templates")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as AlertTemplateRow[]).map(transformRow);
    },
    enabled: !!user,
  });
};

// Create a new template
export const useCreateTemplate = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AlertTemplateInput) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("alert_templates")
        .insert({
          user_id: user.id,
          name: input.name,
          rule_type: input.rule_type,
          market_type: input.market_type,
          threshold: input.threshold,
          direction: input.direction,
          surge_window_minutes: input.surge_window_minutes,
          run_window_minutes: input.run_window_minutes,
          game_period: input.game_period,
          time_window: input.time_window,
        })
        .select()
        .single();

      if (error) throw error;
      return transformRow(data as AlertTemplateRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alert-templates"] });
      toast.success("Template created");
    },
    onError: (error) => {
      toast.error("Failed to create template");
      console.error(error);
    },
  });
};

// Update an existing template
export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<AlertTemplateInput> & { id: string }) => {
      const { data, error } = await supabase
        .from("alert_templates")
        .update({
          name: input.name,
          rule_type: input.rule_type,
          market_type: input.market_type,
          threshold: input.threshold,
          direction: input.direction,
          surge_window_minutes: input.surge_window_minutes,
          run_window_minutes: input.run_window_minutes,
          game_period: input.game_period,
          time_window: input.time_window,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return transformRow(data as AlertTemplateRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alert-templates"] });
      toast.success("Template updated");
    },
    onError: (error) => {
      toast.error("Failed to update template");
      console.error(error);
    },
  });
};

// Delete a template
export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("alert_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alert-templates"] });
      toast.success("Template deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete template");
      console.error(error);
    },
  });
};
