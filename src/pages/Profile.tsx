import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useFavoriteTeams } from "@/hooks/useFavoriteTeams";
import {
  PersonalInfoSection,
  SubscriptionSection,
  FavoriteTeamsSection,
} from "@/components/profile";
import { Navbar } from "@/components/landing/Navbar";
import type { SubscriptionTier } from "@/types/profile";

const Profile = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading, updateProfile } = useProfile();
  const {
    allTeams,
    favoriteTeams,
    favoriteTeamIds,
    isLoading: teamsLoading,
    addFavorite,
    removeFavorite,
  } = useFavoriteTeams();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/profile");
    }
  }, [user, authLoading, navigate]);

  const getUserInitials = () => {
    if (!user?.email) return "U";
    return user.email.charAt(0).toUpperCase();
  };

  const handleUpdateProfile = async (displayName: string | null) => {
    await updateProfile.mutateAsync({ display_name: displayName });
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container px-4 py-8 pt-24 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Profile</h1>
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          <PersonalInfoSection
            profile={profile}
            email={user.email || ""}
            onUpdateProfile={handleUpdateProfile}
            isUpdating={updateProfile.isPending}
          />

          <SubscriptionSection
            tier={(profile?.subscription_tier as SubscriptionTier) || "rookie"}
          />

          <FavoriteTeamsSection
            allTeams={allTeams}
            favoriteTeams={favoriteTeams}
            favoriteTeamIds={favoriteTeamIds}
            onAddFavorite={(teamId) => addFavorite.mutate(teamId)}
            onRemoveFavorite={(teamId) => removeFavorite.mutate(teamId)}
            isAddingFavorite={addFavorite.isPending}
            isRemovingFavorite={removeFavorite.isPending}
          />
        </div>
      </main>
    </div>
  );
};

export default Profile;
