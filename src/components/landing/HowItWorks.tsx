import { useState, useEffect, Fragment } from "react";
import { ChevronDown, ArrowUp, ArrowDown, Bell, Mail, Smartphone, MessageSquare } from "lucide-react";
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

// ==========================================
// STEP 1: BROWSE GAMES - Consolidated Preview
// ==========================================
const GamesDashboardPreview = () => {
  const [activeSport, setActiveSport] = useState("nba");
  const [scoreState, setScoreState] = useState(0);
  const [oddsState, setOddsState] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const scoreUpdates = [
    { home: 98, away: 102 },
    { home: 100, away: 102 },
    { home: 100, away: 105 },
    { home: 103, away: 105 },
  ];

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

  const sports = [
    { name: "NFL", count: 12 },
    { name: "NBA", count: 8 },
    { name: "NHL", count: 6 },
    { name: "MLB", count: 15 },
    { name: "NCAAB", count: 24 },
  ];

  return (
    <div className="space-y-4">
      {/* Sport Tabs */}
      <Tabs value={activeSport} onValueChange={setActiveSport}>
        <TabsList className="bg-secondary/50 border border-border h-9">
          <TabsTrigger value="nba" className="text-xs px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">NBA</TabsTrigger>
          <TabsTrigger value="nfl" className="text-xs px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">NFL</TabsTrigger>
          <TabsTrigger value="mlb" className="text-xs px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">MLB</TabsTrigger>
          <TabsTrigger value="nhl" className="text-xs px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">NHL</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Game Cards */}
      <div className="space-y-3">
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
            <div key={idx} className="p-4 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
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
                    "font-mono text-sm font-semibold px-2 py-0.5 rounded",
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
                <div className="flex items-center gap-3">
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
                    "font-mono text-sm font-semibold px-2 py-0.5 rounded",
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
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
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

      {/* Sport chips + stats */}
      <div className="pt-4 border-t border-border/50">
        <div className="flex flex-wrap gap-2 mb-3">
          {sports.map((sport) => (
            <span
              key={sport.name}
              className="px-3 py-1.5 rounded-full text-xs font-medium border bg-secondary border-border"
            >
              {sport.name}
              <span className="ml-1.5 text-primary">●{sport.count}</span>
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>📊 500+ events weekly</span>
          <span>🏆 15+ sportsbooks</span>
          <span>⚡ &lt;1s refresh</span>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// STEP 2: CREATE ALERTS - Consolidated Preview
// ==========================================
const AlertBuilderPreview = () => {
  const templates = [
    { label: "+100 Alert", icon: "🎯" },
    { label: "Line Movement", icon: "📈" },
    { label: "Pregame Only", icon: "⏰" },
  ];

  return (
    <div className="space-y-3">
      {/* IF/AND/THEN Logic */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 border border-border">
          <span className="text-primary font-semibold">IF</span>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted border border-border">
            <img src={BullsLogo} alt="Bulls" className="w-4 h-4 object-contain" />
            <span>Bulls</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </div>
          <span className="text-muted-foreground">ML reaches</span>
          <span className="text-primary font-mono font-bold">+100</span>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 border border-border">
          <span className="text-accent font-semibold">AND</span>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted border border-border">
            <span>Game is</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </div>
          <span className="text-primary font-mono font-bold">LIVE</span>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
          <span className="text-green-400 font-semibold">THEN</span>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded text-xs bg-secondary border border-border">📱 Push</span>
            <span className="text-muted-foreground">+</span>
            <span className="px-2 py-1 rounded text-xs bg-secondary border border-border">📧 Email</span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm text-muted-foreground italic">
        → "Alert me when Bulls ML is even money during live play"
      </div>

      {/* Create button */}
      <button className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
        Create Alert
      </button>

      {/* Templates */}
      <div className="pt-3 border-t border-border/50">
        <p className="text-xs text-muted-foreground mb-2">Quick Templates:</p>
        <div className="flex flex-wrap gap-2">
          {templates.map((template) => (
            <span
              key={template.label}
              className="px-3 py-1.5 rounded-lg text-xs bg-secondary/50 border border-border hover:border-primary/50 cursor-pointer transition-colors"
            >
              {template.icon} {template.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// STEP 3: GET NOTIFIED - Consolidated Preview
// ==========================================
const NotificationsPreview = () => {
  const allNotifications = [
    { team: "Warriors", logo: WarriorsLogo, event: "ML hit -110" },
    { team: "Bulls", logo: BullsLogo, event: "spread moved to -4.5" },
    { team: "Rangers", logo: RangersLogo, event: "total dropped to 8.0" },
    { team: "Celtics", logo: CelticsLogo, event: "ML reached +100" },
    { team: "Vikings", logo: VikingsLogo, event: "spread moved to -3" },
    { team: "Nuggets", logo: NuggetsLogo, event: "total climbed to 220.5" },
  ];

  const [visibleIndices, setVisibleIndices] = useState([0, 1, 2]);
  const [animatingNew, setAnimatingNew] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatingNew(true);
      setVisibleIndices((prev) => {
        const nextIdx = (prev[0] + 1) % allNotifications.length;
        return [nextIdx, prev[0], prev[1]];
      });
      setTimeout(() => setAnimatingNew(false), 400);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const getTimeLabel = (index: number) => {
    if (index === 0) return "Just now";
    if (index === 1) return "3s ago";
    return "6s ago";
  };

  return (
    <div className="space-y-4">
      {/* Notification Feed */}
      <div className="space-y-2 overflow-hidden">
        {visibleIndices.map((notifIdx, displayIdx) => {
          const notif = allNotifications[notifIdx];
          const isNew = displayIdx === 0;
          
          return (
            <div
              key={`${notifIdx}-${displayIdx}`}
              className={cn(
                "p-4 rounded-lg border transition-all duration-300",
                isNew 
                  ? "bg-primary/10 border-primary/30" 
                  : "bg-secondary/50 border-border",
                isNew && animatingNew && "animate-notification-slide-in",
                displayIdx === 2 && "opacity-50"
              )}
            >
              <div className="flex items-center gap-2 text-sm">
                {isNew && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary text-primary-foreground">
                    NEW
                  </span>
                )}
                <img src={notif.logo} alt={notif.team} className="w-5 h-5 object-contain" />
                <Bell className={cn("w-4 h-4", isNew ? "text-primary" : "text-muted-foreground")} />
                <span className="font-medium">{notif.team}</span>
                <span className="text-muted-foreground">{notif.event}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1.5 ml-6">{getTimeLabel(displayIdx)}</div>
            </div>
          );
        })}
      </div>

      {/* Multi-channel Indicators */}
      <div className="pt-4 border-t border-border/50">
        <p className="text-xs text-muted-foreground mb-3">Delivery Channels:</p>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 border border-border">
            <Smartphone className="w-4 h-4 text-primary" />
            <span className="text-sm">Push</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 border border-border">
            <Mail className="w-4 h-4 text-primary" />
            <span className="text-sm">Email</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 border border-border">
            <MessageSquare className="w-4 h-4 text-primary" />
            <span className="text-sm">SMS</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          ⚡ Delivered in under <span className="text-primary font-semibold">1 second</span>
        </p>
      </div>
    </div>
  );
};

// ==========================================
// STEP CONNECTOR COMPONENT
// ==========================================
const StepConnector = () => (
  <div className="flex justify-center py-8 md:py-12">
    <div className="relative w-1 h-20 md:h-28">
      {/* Subtle glowing line - muted amber to match dark retro theme */}
      <div className="absolute inset-0 rounded-full bg-primary/70 shadow-[0_0_8px_rgba(245,158,11,0.25)]" />
      {/* Soft animated pulse */}
      <div className="absolute inset-0 rounded-full bg-primary/50 animate-pulse opacity-40" />
      {/* Arrow indicator */}
      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
        <div className="p-1 rounded-full bg-primary/80 shadow-[0_0_10px_rgba(245,158,11,0.3)]">
          <ChevronDown className="w-4 h-4 text-primary-foreground" />
        </div>
      </div>
    </div>
  </div>
);

// ==========================================
// STEP DATA
// ==========================================
const steps = [
  {
    number: 1,
    title: "Browse Games",
    description: "Real-time odds across NFL, NBA, NHL, MLB and more. Live scores, spreads, and moneylines updated every second.",
    preview: <GamesDashboardPreview />,
  },
  {
    number: 2,
    title: "Create Alerts",
    description: "Build custom conditions with IF/THEN logic. Set thresholds, combine rules, and choose exactly when you want to be notified.",
    preview: <AlertBuilderPreview />,
  },
  {
    number: 3,
    title: "Get Notified",
    description: "Instant alerts the moment your criteria are met. Never miss a move with push, email, and SMS delivery.",
    preview: <NotificationsPreview />,
  },
];

// ==========================================
// MAIN COMPONENT
// ==========================================
export const HowItWorks = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();

  return (
    <section id="how-it-works" className="py-32 relative scroll-mt-20">
      <div className="container px-4 md:px-6">
        {/* Section header */}
        <div 
          ref={headerRef}
          className={cn(
            "text-center mb-20 animate-on-scroll",
            headerVisible && "is-visible"
          )}
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 mb-4">
            How It Works
          </span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            From odds to alerts in{" "}
            <span className="text-gradient-amber">3 simple steps</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            TipOff connects you to real-time sports data and delivers personalized alerts when your conditions are met.
          </p>
        </div>

        {/* 3-Step Flow */}
        <div className="space-y-4">
          {steps.map((step, index) => {
            const StepContent = () => {
              const { ref, isVisible } = useScrollAnimation();
              
              return (
                <div 
                  ref={ref}
                  className={cn(
                    "grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center animate-on-scroll",
                    isVisible && "is-visible",
                    // Alternate layout on desktop
                    index % 2 === 1 && "lg:flex-row-reverse"
                  )}
                >
                  {/* Text Content */}
                  <div className={cn(
                    "space-y-6",
                    index % 2 === 1 && "lg:order-2"
                  )}>
                    {/* Step Badge + Title together */}
                    <div className="flex items-center gap-4">
                      <div className="step-number w-12 h-12 rounded-full bg-amber-gradient flex items-center justify-center text-primary-foreground font-bold text-lg shadow-lg flex-shrink-0">
                        {step.number}
                      </div>
                      <h3 className="text-2xl md:text-3xl font-bold tracking-tight">
                        {step.title}
                      </h3>
                    </div>
                    
                    <p className="text-muted-foreground text-lg leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Preview Bento Box */}
                  <div className={cn(
                    "p-6 md:p-8 rounded-2xl bg-card border border-border card-hover",
                    index % 2 === 1 && "lg:order-1"
                  )}>
                    {step.preview}
                  </div>
                </div>
              );
            };
            
            return (
              <Fragment key={step.number}>
                <StepContent />
                {/* Connector between steps (not after last step) */}
                {index < steps.length - 1 && <StepConnector />}
              </Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
};
