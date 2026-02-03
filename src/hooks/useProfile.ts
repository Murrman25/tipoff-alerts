import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Profile, SubscriptionTier } from "@/types/profile";

export const useProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async (): Promise<Profile | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      // Auto-create profile if it doesn't exist
      if (!data) {
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({ user_id: user.id })
          .select()
          .single();

        if (insertError) throw insertError;
        return newProfile as Profile;
      }

      return data as Profile;
    },
    enabled: !!user,
  });

  const updateProfile = useMutation({
    mutationFn: async ({
      display_name,
      avatar_url,
    }: {
      display_name?: string | null;
      avatar_url?: string | null;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const updates: Record<string, string | null> = {};
      if (display_name !== undefined) updates.display_name = display_name;
      if (avatar_url !== undefined) updates.avatar_url = avatar_url;

      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });

  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Update profile with avatar URL
      const { data, error } = await supabase
        .from("profiles")
        .update({ avatar_url: urlData.publicUrl })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    uploadAvatar,
  };
};
