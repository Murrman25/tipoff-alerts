import { useEffect } from "react";
import { GameEvent } from "@/types/games";

/**
 * Preloads team logos for the first N games to eliminate "pop-in" effect
 * Uses the Image() constructor for background loading
 */
export const usePreloadLogos = (games: GameEvent[], count: number = 6) => {
  useEffect(() => {
    if (!games || games.length === 0) return;

    const logoUrls = new Set<string>();

    // Collect unique logo URLs from the first N games
    games.slice(0, count).forEach((game) => {
      const homeLogoUrl = game.teams.home.logoUrl;
      const awayLogoUrl = game.teams.away.logoUrl;

      if (homeLogoUrl) logoUrls.add(homeLogoUrl);
      if (awayLogoUrl) logoUrls.add(awayLogoUrl);
    });

    // Preload each unique logo
    logoUrls.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, [games, count]);
};
