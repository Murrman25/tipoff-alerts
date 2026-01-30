import { useState, useEffect } from "react";
import { LineChart, Trophy, ArrowUp, ArrowDown } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/lib/utils";

// Team logos
import BullsLogo from "@/assets/teams/bulls.png";
import WarriorsLogo from "@/assets/teams/warriors.png";
import NuggetsLogo from "@/assets/teams/nuggets.png";
import CelticsLogo from "@/assets/teams/celtics.png";
import VikingsLogo from "@/assets/teams/vikings.png";
import CommandersLogo from "@/assets/teams/commanders.png";
import RangersLogo from "@/assets/teams/rangers.png";
import GiantsLogo from "@/assets/teams/giants.png";

// Types
interface Team {
  name: string;
  logo: string;
  ml: number;
  score?: number;
}

interface Game {
  home: Team;
  away: Team;
  status: "live" | "pregame";
  period?: string;
  time?: string;
}

// Matchup data
const matchups: Record<string, Game[]> = {
  nba: [
    {
      home: { name: "Bulls", logo: BullsLogo, ml: -145 },
      away: { name: "Warriors", logo: WarriorsLogo, ml: 125 },
      status: "live",
      period: "Q3 7:42",
    },
    {
      home: { name: "Nuggets", logo: NuggetsLogo, ml: 110 },
      away: { name: "Celtics", logo: CelticsLogo, ml: -130 },
      status: "pregame",
      time: "7:30 PM ET",
    },
  ],
  nfl: [
    {
      home: { name: "Vikings", logo: VikingsLogo, ml: 110 },
      away: { name: "Commanders", logo: CommandersLogo, ml: -130 },
      status: "pregame",
      time: "1:00 PM ET",
    },
  ],
  mlb: [
    {
      home: { name: "Rangers", logo: RangersLogo, ml: 125, score: 3 },
      away: { name: "Giants", logo: GiantsLogo, ml: -145, score: 4 },
      status: "live",
      period: "Bot 7th",
    },
  ],
};

const formatOdds = (odds: number) => (odds > 0 ? `+${odds}` : `${odds}`);

// Games Dashboard Preview Component
const GamesDashboardPreview = () => {
  const [activeSport, setActiveSport] = useState("nba");
  const [scoreState, setScoreState] = useState(0);
  const [oddsState, setOddsState] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Animated score changes for live games
  const scoreUpdates = [
    { home: 98, away: 102 },
    { home: 100, away: 102 },
    { home: 100, away: 105 },
    { home: 103, away: 105 },
  ];

  // Animated odds changes
  const oddsUpdates = [
    { homeML: -145, awayML: 125 },
    { homeML: -150, awayML: 130 },
    { homeML: -140, awayML: 120 },
    { homeML: -145, awayML: 125 },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setScoreState((prev) => (prev + 1) % scoreUpdates.length);
      setOddsState((prev) => (prev + 1) % oddsUpdates.length);
      setTimeout(() => setIsAnimating(false), 500);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const currentScores = scoreUpdates[scoreState];
  const currentOdds = oddsUpdates[oddsState];
  const games = matchups[activeSport] || [];

  return (
    <div className="mt-4 space-y-3">
      <Tabs value={activeSport} onValueChange={setActiveSport}>
        <TabsList className="bg-secondary/50 border border-border h-8">
          <TabsTrigger value="nba" className="text-xs h-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">NBA</TabsTrigger>
          <TabsTrigger value="nfl" className="text-xs h-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">NFL</TabsTrigger>
          <TabsTrigger value="mlb" className="text-xs h-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">MLB</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-2">
        {games.map((game, idx) => {
          const isLiveNBA = activeSport === "nba" && game.status === "live";
          const displayHomeScore = isLiveNBA ? currentScores.home : game.home.score;
          const displayAwayScore = isLiveNBA ? currentScores.away : game.away.score;
          const displayHomeML = isLiveNBA ? currentOdds.homeML : game.home.ml;
          const displayAwayML = isLiveNBA ? currentOdds.awayML : game.away.ml;
          const prevOdds = oddsUpdates[(oddsState - 1 + oddsUpdates.length) % oddsUpdates.length];
          const homeOddsChanged = isLiveNBA && isAnimating;
          const homeOddsDirection = currentOdds.homeML < prevOdds.homeML ? "down" : "up";
          const awayOddsDirection = currentOdds.awayML > prevOdds.awayML ? "up" : "down";

          return (
            <div key={idx} className="p-3 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={game.home.logo} alt={game.home.name} className="w-8 h-8 object-contain" />
                  <span className="text-sm font-medium">{game.home.name}</span>
                  {game.status === "live" && displayHomeScore !== undefined && (
                    <span className={cn(
                      "text-lg font-bold ml-2 px-1 rounded",
                      isLiveNBA && isAnimating && "animate-odds-flash"
                    )}>
                      {displayHomeScore}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className={cn(
                    "font-mono text-sm font-semibold px-1 rounded",
                    displayHomeML < 0 ? "text-primary" : "text-muted-foreground",
                    homeOddsChanged && "animate-odds-flash"
                  )}>
                    {formatOdds(displayHomeML)}
                  </span>
                  {homeOddsChanged && (
                    homeOddsDirection === "down" 
                      ? <ArrowDown className="w-3 h-3 text-green-400 animate-arrow-bounce" />
                      : <ArrowUp className="w-3 h-3 text-red-400 animate-arrow-bounce" />
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <img src={game.away.logo} alt={game.away.name} className="w-8 h-8 object-contain" />
                  <span className="text-sm font-medium">{game.away.name}</span>
                  {game.status === "live" && displayAwayScore !== undefined && (
                    <span className={cn(
                      "text-lg font-bold ml-2 px-1 rounded",
                      isLiveNBA && isAnimating && "animate-odds-flash"
                    )}>
                      {displayAwayScore}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className={cn(
                    "font-mono text-sm font-semibold px-1 rounded",
                    displayAwayML < 0 ? "text-primary" : "text-muted-foreground",
                    homeOddsChanged && "animate-odds-flash"
                  )}>
                    {formatOdds(displayAwayML)}
                  </span>
                  {homeOddsChanged && (
                    awayOddsDirection === "up" 
                      ? <ArrowUp className="w-3 h-3 text-green-400 animate-arrow-bounce" />
                      : <ArrowDown className="w-3 h-3 text-red-400 animate-arrow-bounce" />
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
                {game.status === "live" ? (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      LIVE
                    </span>
                    <span className="text-xs text-muted-foreground">{game.period}</span>
                  </div>
                ) : (
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                    {game.time}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">Updated just now</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// All Major Sports Preview Component
const AllSportsPreview = () => {
  const sports = [
    { name: "NFL", count: 12 },
    { name: "NBA", count: 8 },
    { name: "NHL", count: 6 },
    { name: "MLB", count: 15 },
    { name: "NCAAB", count: 24 },
    { name: "NCAAF", count: 0 },
  ];
  const total = sports.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        {sports.map((sport) => (
          <span
            key={sport.name}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer hover:border-primary/50 ${
              sport.count > 0
                ? "bg-secondary border-border"
                : "bg-secondary/30 border-border/50 text-muted-foreground"
            }`}
          >
            {sport.name}
            <span className="ml-1.5 text-primary">●{sport.count}</span>
          </span>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        <span className="text-primary font-semibold">{total}</span> games available today
      </p>
    </div>
  );
};

const gamesFeatures = [
  {
    icon: LineChart,
    title: "Games Dashboard",
    description: "Live odds for ML, Spread, and Totals across all major sports",
    preview: <GamesDashboardPreview />,
    colSpan: "md:col-span-2",
    rowSpan: "md:row-span-2",
  },
  {
    icon: Trophy,
    title: "All Major Sports",
    description: "NFL, NBA, NHL, MLB, NCAAB, NCAAF",
    preview: <AllSportsPreview />,
    colSpan: "md:col-span-1",
    rowSpan: "md:row-span-2",
  },
];

export const GamesSection = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: gridRef, isVisible: gridVisible } = useScrollAnimation();

  return (
    <section id="games" className="py-24 relative scroll-mt-20">
      <div className="container px-4 md:px-6">
        {/* Section header */}
        <div 
          ref={headerRef}
          className={cn(
            "text-center mb-16 animate-on-scroll",
            headerVisible && "is-visible"
          )}
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Track every game,{" "}
            <span className="text-gradient-amber">every sport</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Get real-time access to live odds, scores, and game states across NFL, NBA, NHL, MLB, and college sports. Our dashboard delivers the data you need to make informed decisions.
          </p>
        </div>

        {/* Bento grid */}
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {gamesFeatures.map((feature, index) => (
            <div
              key={index}
              className={cn(
                feature.colSpan,
                feature.rowSpan,
                "p-6 rounded-xl bg-card border border-border card-hover animate-on-scroll",
                gridVisible && "is-visible",
                `stagger-${index + 1}`
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">{feature.title}</h3>
              </div>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
              {feature.preview}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
