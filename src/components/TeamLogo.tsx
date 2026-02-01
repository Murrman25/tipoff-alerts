import { useState } from "react";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const STORAGE_URL = "https://wxcezmqaknhftwnpkanu.supabase.co/storage/v1/object/public/team-logos";

interface TeamLogoProps {
  /** The logo URL from enriched API data, or undefined if not available */
  logoUrl?: string | null;
  /** Team name for alt text */
  teamName: string;
  /** Size in pixels (default: 32) */
  size?: number;
  /** Additional CSS classes */
  className?: string;
}

export const TeamLogo = ({
  logoUrl,
  teamName,
  size = 32,
  className,
}: TeamLogoProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // No logo URL or error - show fallback icon
  if (!logoUrl || hasError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-muted text-muted-foreground",
          className
        )}
        style={{ width: size, height: size }}
        aria-label={teamName}
      >
        <Users className="w-1/2 h-1/2" />
      </div>
    );
  }

  return (
    <div
      className={cn("relative", className)}
      style={{ width: size, height: size }}
    >
      {/* Loading skeleton */}
      {isLoading && (
        <Skeleton className="absolute inset-0 rounded-full" />
      )}
      
      {/* Actual image */}
      <img
        src={logoUrl}
        alt={teamName}
        loading="lazy"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "w-full h-full object-contain transition-opacity duration-200",
          isLoading ? "opacity-0" : "opacity-100"
        )}
      />
    </div>
  );
};

/**
 * Constructs the full logo URL from a filename
 * Use this when you have the raw filename from the database
 */
export const getLogoUrl = (filename: string | null | undefined): string | null => {
  if (!filename) return null;
  // Encode the filename to handle special characters (spaces, commas, equals signs)
  const encodedFilename = encodeURIComponent(filename + ".png");
  return `${STORAGE_URL}/${encodedFilename}`;
};
