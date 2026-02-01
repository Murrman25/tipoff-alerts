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
  const notifications = [
    { team: "Warriors", logo: WarriorsLogo, event: "ML hit -110", time: "Just now" },
    { team: "Bulls", logo: BullsLogo, event: "spread moved to -4.5", time: "2m ago" },
    { team: "Rangers", logo: RangersLogo, event: "total dropped to 8.0", time: "5m ago" },
    { team: "Celtics", logo: CelticsLogo, event: "ML reached +100", time: "8m ago" },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showIphone, setShowIphone] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % notifications.length);
        setShowIphone((prev) => !prev);
        setIsAnimating(false);
      }, 300);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const notif = notifications[currentIndex];

  return (
    <div className="flex justify-center items-center py-4">
      {/* Device Frame */}
      <div className={cn(
        "relative transition-all duration-300",
        isAnimating && "opacity-0 scale-95"
      )}>
        {showIphone ? (
          /* iPhone Push Notification */
          <div className="w-[280px] bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-[2.5rem] p-3 shadow-2xl border border-zinc-700">
            {/* Notch */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full" />
            
            {/* Screen */}
            <div className="bg-gradient-to-br from-blue-900/40 via-purple-900/30 to-pink-900/20 rounded-[2rem] pt-10 pb-6 px-3 min-h-[380px]">
              {/* Time */}
              <div className="text-center mb-8">
                <p className="text-5xl font-light text-white/90">9:41</p>
                <p className="text-sm text-white/60 mt-1">Saturday, February 1</p>
              </div>
              
              {/* Push Notification */}
              <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-3 border border-white/10 animate-notification-slide-in">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                    <Bell className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-white/90">TIPOFFHQ</p>
                      <p className="text-[10px] text-white/50">now</p>
                    </div>
                    <p className="text-sm font-medium text-white mt-0.5">🚨 Alert Triggered</p>
                    <p className="text-xs text-white/70 mt-0.5 leading-relaxed">
                      {notif.team} {notif.event}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Home Indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full" />
          </div>
        ) : (
          /* Android SMS */
          <div className="w-[280px] bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-[1.5rem] p-2 shadow-2xl border border-zinc-700">
            {/* Status Bar */}
            <div className="flex items-center justify-between px-4 py-2 text-white/70 text-xs">
              <span>9:41</span>
              <div className="flex items-center gap-1">
                <div className="flex gap-0.5">
                  <div className="w-1 h-2 bg-white/70 rounded-sm" />
                  <div className="w-1 h-3 bg-white/70 rounded-sm" />
                  <div className="w-1 h-4 bg-white/70 rounded-sm" />
                  <div className="w-1 h-3 bg-white/40 rounded-sm" />
                </div>
                <span className="ml-1">78%</span>
              </div>
            </div>
            
            {/* Messages App Header */}
            <div className="bg-zinc-900 rounded-t-xl px-4 py-3 border-b border-zinc-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">T</span>
                </div>
                <div>
                  <p className="text-white font-medium text-sm">TIPOFFHQ</p>
                  <p className="text-white/50 text-xs">Text message</p>
                </div>
              </div>
            </div>
            
            {/* Message Thread */}
            <div className="bg-zinc-900/80 min-h-[280px] px-3 py-4">
              {/* SMS Bubble */}
              <div className="flex justify-start animate-notification-slide-in">
                <div className="max-w-[85%] bg-zinc-700 rounded-2xl rounded-tl-sm px-4 py-3">
                  <p className="text-white text-sm leading-relaxed">
                    🚨 TIPOFFHQ Alert: {notif.team} {notif.event}. Tap to view live odds.
                  </p>
                  <p className="text-white/40 text-[10px] mt-2 text-right">{notif.time}</p>
                </div>
              </div>
            </div>
            
            {/* Navigation Bar */}
            <div className="flex items-center justify-center gap-12 py-2 bg-zinc-900 rounded-b-xl">
              <div className="w-4 h-4 border-2 border-white/30 rounded-sm" />
              <div className="w-4 h-4 rounded-full border-2 border-white/30" />
              <div className="w-0 h-0 border-l-[6px] border-l-white/30 border-y-[5px] border-y-transparent" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// STEP CONNECTOR COMPONENT
// ==========================================
const StepConnector = () => (
  <div className="flex justify-center py-4">
    <div className="w-0.5 h-8 rounded-full bg-primary/40" />
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
