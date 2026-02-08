import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Profile } from "@/types/profile";

interface PersonalInfoSectionProps {
  profile: Profile | null;
  email: string;
  onUpdateProfile: (displayName: string | null) => Promise<void>;
  isUpdating: boolean;
}

export const PersonalInfoSection = ({
  profile,
  email,
  onUpdateProfile,
  isUpdating,
}: PersonalInfoSectionProps) => {
  const [displayName, setDisplayName] = useState(profile?.display_name || "");

  const handleSave = async () => {
    try {
      await onUpdateProfile(displayName || null);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const hasChanges = displayName !== (profile?.display_name || "");

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="w-5 h-5 text-primary" />
          Personal Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            placeholder="Enter your display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">{email}</span>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isUpdating}
          className="bg-gold-gradient text-primary-foreground hover:opacity-90"
        >
          {isUpdating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
