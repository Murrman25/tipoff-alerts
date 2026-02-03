import { useState, useEffect, Fragment } from "react";
import { ChevronDown, ArrowUp, ArrowDown, Bell, Mail, Smartphone, MessageSquare, Flashlight, Camera } from "lucide-react";
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
// TipOff logo
import tipoffIcon from "@/assets/tipoff-logo-icon.png";
// League logo
import NBALogo from "@/assets/leagues/nba.png";

const AlertBuilderPreview = () => {
  const [step, setStep] = useState(0);
  const [typedValue, setTypedValue] = useState("");

  // Animation timeline: 10 seconds total
  // 0: Initial (nothing selected)
  // 1: Game selected
  // 2: Market + Team selected
  // 3: Threshold + Direction filled
  // 4: Summary visible, ready to create
  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % 5);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // Typewriter effect for threshold
  useEffect(() => {
    if (step === 3) {
      setTypedValue("");
      const chars = ["+", "1", "0", "0"];
      chars.forEach((char, i) => {
        setTimeout(() => {
          setTypedValue((prev) => prev + char);
        }, i * 150);
      });
    } else if (step < 3) {
      setTypedValue("");
    }
  }, [step]);

  // Selection styles
  const selectedStyle = "border-primary ring-2 ring-primary/30 bg-primary/5 shadow-lg shadow-primary/10";
  const unselectedStyle = "border-border bg-secondary/30";
  const mutedStyle = "opacity-50";

  return (
    <div className="space-y-3">
      {/* Game Card - always visible */}
      <div
        className={cn(
          "p-3 rounded-lg border transition-all duration-300",
          step >= 1 ? selectedStyle : unselectedStyle,
          step === 0 && "hover:border-muted-foreground/30"
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <img src={NBALogo} alt="NBA" className="w-4 h-4 object-contain" />
            <span className="text-xs font-medium text-muted-foreground">NBA</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-500/20 text-green-400 border border-green-500/30">
              <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
              LIVE
            </span>
            <span className="text-[10px] text-muted-foreground">Q3 4:32</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={BullsLogo} alt="Bulls" className="w-5 h-5 object-contain" />
            <span className="font-semibold text-sm">CHI</span>
            <span className="text-lg font-bold">98</span>
          </div>
          <span className="text-xs text-muted-foreground">@</span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">101</span>
            <span className="font-semibold text-sm">BOS</span>
            <img src={CelticsLogo} alt="Celtics" className="w-5 h-5 object-contain" />
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 mt-2 text-[10px] text-muted-foreground">
          <span>ML: -120/+110</span>
          <span>•</span>
          <span>SP: -2.5</span>
          <span>•</span>
          <span>O/U: 218</span>
        </div>
      </div>

      {/* Market Toggle - always visible */}
      <div className={cn(
        "space-y-1.5 transition-all duration-300",
        step < 2 && mutedStyle
      )}>
        <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
          Market
        </label>
        <div className="flex rounded-lg bg-muted/50 border border-border p-0.5">
          {["ML", "SP", "O/U"].map((market, idx) => (
            <button
              key={market}
              className={cn(
                "flex-1 py-1.5 text-xs font-medium rounded-md transition-all duration-300",
                idx === 0 && step >= 2
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground"
              )}
            >
              {market}
            </button>
          ))}
        </div>
      </div>

      {/* Team Cards - always visible */}
      <div className={cn(
        "space-y-1.5 transition-all duration-300",
        step < 2 && mutedStyle
      )}>
        <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
          Team
        </label>
        <div className="grid grid-cols-2 gap-2">
          {/* Bulls - Away */}
          <div
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-300 min-h-[80px]",
              step >= 2 ? selectedStyle : unselectedStyle
            )}
          >
            <img src={BullsLogo} alt="Bulls" className="w-7 h-7 object-contain" />
            <span className="text-xs font-medium mt-1.5">CHI</span>
            <span className={cn(
              "text-[10px] uppercase tracking-wide mt-0.5 transition-colors duration-300",
              step >= 2 ? "text-primary" : "text-muted-foreground"
            )}>
              AWAY
            </span>
          </div>
          {/* Celtics - Home */}
          <div
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-300 min-h-[80px]",
              unselectedStyle
            )}
          >
            <img src={CelticsLogo} alt="Celtics" className="w-7 h-7 object-contain" />
            <span className="text-xs font-medium mt-1.5 text-muted-foreground">BOS</span>
            <span className="text-[10px] uppercase tracking-wide mt-0.5 text-muted-foreground">
              HOME
            </span>
          </div>
        </div>
      </div>

      {/* Threshold + Direction - always visible */}
      <div className={cn(
        "grid grid-cols-2 gap-3 transition-all duration-300",
        step < 3 && mutedStyle
      )}>
        {/* Threshold */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
            Threshold
          </label>
          <div className={cn(
            "px-3 py-2 rounded-lg border transition-all duration-300 h-9 flex items-center",
            step >= 3 ? "border-primary/50 bg-primary/5" : "border-border bg-secondary/30"
          )}>
            <span className={cn(
              "font-mono text-sm font-semibold transition-colors duration-300",
              step >= 3 ? "text-primary" : "text-muted-foreground"
            )}>
              {step >= 3 ? typedValue : ""}
              {step === 3 && typedValue.length < 4 && (
                <span className="animate-pulse">|</span>
              )}
            </span>
          </div>
        </div>
        {/* Direction */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
            Direction
          </label>
          <div className={cn(
            "px-3 py-2 rounded-lg border transition-all duration-300 h-9 flex items-center justify-center",
            step >= 3 
              ? "border-primary/50 bg-primary/10 text-primary" 
              : "border-border bg-secondary/30 text-muted-foreground"
          )}>
            <span className="text-xs font-medium">or better</span>
          </div>
        </div>
      </div>

      {/* Summary - always visible but muted until step 4 */}
      <div
        className={cn(
          "p-3 rounded-lg border transition-all duration-500",
          step >= 4 
            ? "bg-amber-500/5 border-amber-500/30 shadow-[0_0_20px_-5px_rgba(245,158,11,0.4)]" 
            : "bg-secondary/20 border-border opacity-40"
        )}
      >
        <div className="flex items-center gap-2 mb-1">
          <img
            src={tipoffIcon}
            alt="TipOff"
            className={cn(
              "w-4 h-4 object-contain transition-all duration-300",
              step >= 4 && "animate-[pulse_2s_ease-in-out_infinite]"
            )}
          />
          <p className={cn(
            "text-[10px] uppercase tracking-wide font-medium transition-colors duration-300",
            step >= 4 ? "text-amber-500" : "text-muted-foreground"
          )}>
            Ready to create
          </p>
        </div>
        <p className={cn(
          "text-sm transition-colors duration-300",
          step >= 4 ? "text-foreground" : "text-muted-foreground"
        )}>
          "Alert me when Bulls ML reaches +100 or better"
        </p>
      </div>

      {/* Create Alert Button - always visible */}
      <button
        className={cn(
          "w-full py-3 rounded-lg font-semibold text-sm transition-all duration-300",
          step >= 4
            ? "bg-primary text-primary-foreground shadow-[0_0_15px_-3px_hsl(var(--primary)/0.6)]"
            : "bg-primary/50 text-primary-foreground/70"
        )}
      >
        Create Alert
      </button>

      {/* Step indicator dots */}
      <div className="flex items-center justify-center gap-1.5 pt-2">
        {[0, 1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-all duration-300",
              step === s ? "bg-primary w-3" : "bg-muted-foreground/30"
            )}
          />
        ))}
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
  const [showNotification, setShowNotification] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Reset notification visibility on device/notification change
    setShowNotification(false);
    
    // Show notification after 1 second
    const notificationTimer = setTimeout(() => {
      setShowNotification(true);
    }, 1000);
    
    // After 4 seconds, fade out and switch
    const cycleTimer = setTimeout(() => {
      setIsFadingOut(true);
      
      setTimeout(() => {
        setShowNotification(false);
        setCurrentIndex((prev) => (prev + 1) % notifications.length);
        setShowIphone((prev) => !prev);
        setIsFadingOut(false);
      }, 300);
    }, 4000);
    
    return () => {
      clearTimeout(notificationTimer);
      clearTimeout(cycleTimer);
    };
  }, [currentIndex, showIphone]);

  const notif = notifications[currentIndex];

  return (
    <div className="flex justify-center items-center">
      {/* Fixed-size container to prevent layout shift */}
      <div className="w-[280px] h-[480px] flex items-center justify-center">
        <div className={cn(
          "transition-all duration-300",
          isFadingOut && "opacity-0 scale-95"
        )}>
          {showIphone ? (
            /* iPhone with Push Notification - Realistic iOS lock screen */
            <div className="w-[280px] h-[480px] bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900 rounded-[3rem] p-[3px] shadow-2xl relative">
              {/* Phone frame outer edge highlight */}
              <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-b from-zinc-600 via-zinc-700 to-zinc-800 opacity-50" />
              
              {/* Inner phone body */}
              <div className="relative w-full h-full rounded-[2.8rem] overflow-hidden bg-black">
                {/* Dynamic Island */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[100px] h-[28px] bg-black rounded-full z-20" />
                
                {/* Screen with iOS wallpaper gradient */}
                <div className="absolute inset-[2px] rounded-[2.6rem] overflow-hidden">
                  {/* iOS 16 style wallpaper - colorful gradient with organic shapes */}
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-blue-800 to-indigo-900">
                    {/* Organic blob shapes like iOS wallpaper */}
                    <div className="absolute top-[30%] right-[-10%] w-[200px] h-[200px] rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 opacity-90 blur-sm" />
                    <div className="absolute top-[45%] left-[-5%] w-[120px] h-[120px] rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 opacity-80 blur-sm" />
                    <div className="absolute bottom-[15%] right-[10%] w-[80px] h-[80px] rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 opacity-70 blur-sm" />
                  </div>
                  
                  {/* Lock Screen Content */}
                  <div className="relative h-full flex flex-col pt-16 px-6">
                    {/* Date - iOS style */}
                    <div className="text-center mb-1">
                      <p className="text-[15px] font-medium text-white/90 tracking-wide">
                        Monday, February 3
                      </p>
                    </div>
                    
                    {/* Time Display - iOS style large thin font */}
                    <div className="text-center">
                      <p className="text-[72px] font-bold text-white tracking-tight leading-none" style={{ fontWeight: 700 }}>
                        9:41
                      </p>
                    </div>
                    
                    {/* Push Notification Area - Above bottom controls */}
                    <div className="flex-1 flex flex-col justify-end pb-32">
                      {showNotification && (
                        <div className="bg-white/20 backdrop-blur-2xl rounded-[20px] p-3 animate-notification-slide-in shadow-xl border border-white/10">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-[10px] bg-primary flex items-center justify-center flex-shrink-0 shadow-lg">
                              <Bell className="w-5 h-5 text-primary-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <p className="text-[13px] font-semibold text-white">TIPOFFHQ</p>
                                <p className="text-[11px] text-white/60">now</p>
                              </div>
                              <p className="text-[13px] text-white/90 leading-snug">
                                🚨 {notif.team} {notif.event}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Bottom controls - Flashlight & Camera */}
                    <div className="absolute bottom-16 left-0 right-0 flex items-center justify-between px-10">
                      <div className="w-12 h-12 rounded-full bg-zinc-800/60 backdrop-blur-xl flex items-center justify-center border border-white/10">
                        <Flashlight className="w-5 h-5 text-white" />
                      </div>
                      <div className="w-12 h-12 rounded-full bg-zinc-800/60 backdrop-blur-xl flex items-center justify-center border border-white/10">
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    
                    {/* Swipe up text */}
                    <div className="absolute bottom-8 left-0 right-0 text-center">
                      <p className="text-[11px] text-white/50 font-medium">Swipe up to open</p>
                    </div>
                  </div>
                </div>
                
                {/* Home Indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/60 rounded-full z-20" />
              </div>
            </div>
          ) : (
            /* Android with Green SMS Bubble - Realistic lock screen */
            <div className="w-[280px] h-[480px] bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900 rounded-[3rem] p-[3px] shadow-2xl relative">
              {/* Phone frame outer edge highlight */}
              <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-b from-zinc-600 via-zinc-700 to-zinc-800 opacity-50" />
              
              {/* Inner phone body */}
              <div className="relative w-full h-full rounded-[2.8rem] overflow-hidden bg-black">
                {/* Camera Punch Hole */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-3 h-3 bg-zinc-950 rounded-full z-20 border border-zinc-700" />
                
                {/* Screen with Android wallpaper gradient */}
                <div className="absolute inset-[2px] rounded-[2.6rem] overflow-hidden">
                  {/* Android style warm gradient wallpaper */}
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-100 via-yellow-200 to-orange-200">
                    {/* Organic blob shapes like reference */}
                    <div className="absolute top-[20%] left-[50%] w-[250px] h-[250px] rounded-full bg-gradient-to-br from-amber-300 via-yellow-300 to-orange-300 opacity-90 blur-sm" />
                    <div className="absolute top-[10%] right-[-20%] w-[180px] h-[180px] rounded-full bg-gradient-to-tr from-orange-400 to-amber-400 opacity-70 blur-md" />
                    <div className="absolute bottom-[30%] left-[-10%] w-[150px] h-[150px] rounded-full bg-gradient-to-br from-yellow-200 to-amber-200 opacity-80 blur-sm" />
                  </div>
                  
                  {/* Lock Screen Content */}
                  <div className="relative h-full flex flex-col pt-14 px-6">
                    {/* Time Display - Android style */}
                    <div className="text-center">
                      <p className="text-[64px] font-light text-zinc-800 tracking-tight leading-none">
                        4:49
                      </p>
                    </div>
                    
                    {/* Date - Android style */}
                    <div className="text-center mt-1">
                      <p className="text-[14px] font-medium text-zinc-600">
                        Mon, February 3
                      </p>
                    </div>
                    
                    {/* Quick access icons */}
                    <div className="flex items-center justify-center gap-4 mt-3">
                      <div className="w-8 h-8 rounded-full bg-white/40 backdrop-blur-sm flex items-center justify-center">
                        <span className="text-[10px] font-bold text-zinc-700">G</span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white/40 backdrop-blur-sm flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-zinc-700" />
                      </div>
                    </div>
                    
                    {/* SMS Notification Area - Above bottom controls */}
                    <div className="flex-1 px-0 flex flex-col justify-end pb-20">
                      {showNotification && (
                        <div className="flex justify-end animate-notification-slide-in">
                          <div className="max-w-[90%] bg-[#34C759] rounded-2xl rounded-br-sm px-4 py-2.5 shadow-lg">
                            <p className="text-[14px] text-white leading-snug">
                              🚨 Alert: {notif.team} {notif.event}. Tap to view live odds.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Swipe to unlock */}
                    <div className="absolute bottom-12 left-0 right-0 text-center">
                      <p className="text-[11px] text-zinc-500 font-medium">Swipe to unlock</p>
                    </div>
                  </div>
                </div>
                
                {/* Home Indicator - Android style bar */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-zinc-600 rounded-full z-20" />
              </div>
            </div>
          )}
        </div>
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

                  {/* Preview Bento Box - no background for notifications step */}
                  <div className={cn(
                    "p-6 md:p-8 rounded-2xl",
                    step.number !== 3 && "bg-card border border-border card-hover",
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
