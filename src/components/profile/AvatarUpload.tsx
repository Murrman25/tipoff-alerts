import { useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AvatarUploadProps {
  avatarUrl: string | null;
  userInitials: string;
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
}

export const AvatarUpload = ({
  avatarUrl,
  userInitials,
  onUpload,
  isUploading,
}: AvatarUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    try {
      await onUpload(file);
      toast.success("Avatar updated successfully");
    } catch (error) {
      toast.error("Failed to upload avatar");
    }
  };

  return (
    <div className="relative group">
      <Avatar className="h-24 w-24 border-2 border-border">
        <AvatarImage src={avatarUrl || undefined} />
        <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
          {userInitials}
        </AvatarFallback>
      </Avatar>
      <Button
        size="icon"
        variant="secondary"
        className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};
