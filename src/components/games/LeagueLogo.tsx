import nflLogo from "@/assets/leagues/nfl.png";
import nbaLogo from "@/assets/leagues/nba.png";
import mlbLogo from "@/assets/leagues/mlb.png";
import nhlLogo from "@/assets/leagues/nhl.png";
import ncaabLogo from "@/assets/leagues/ncaab.png";
import ncaafLogo from "@/assets/leagues/ncaaf.png";
import mlsLogo from "@/assets/leagues/mls.png";
import { cn } from "@/lib/utils";

export const LEAGUE_LOGOS: Record<string, string> = {
  NFL: nflLogo,
  NBA: nbaLogo,
  MLB: mlbLogo,
  NHL: nhlLogo,
  NCAAB: ncaabLogo,
  NCAAF: ncaafLogo,
  MLS: mlsLogo,
};

interface LeagueLogoProps {
  leagueId: string;
  size?: number;
  className?: string;
  showName?: boolean;
}

export const LeagueLogo = ({
  leagueId,
  size = 20,
  className,
  showName = false,
}: LeagueLogoProps) => {
  const logoSrc = LEAGUE_LOGOS[leagueId];

  if (!logoSrc) {
    return <span className="text-xs font-medium">{leagueId}</span>;
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <img
        src={logoSrc}
        alt={leagueId}
        style={{ height: size }}
        className="object-contain"
      />
      {showName && <span>{leagueId}</span>}
    </div>
  );
};
