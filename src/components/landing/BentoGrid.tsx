import { useState } from "react";
import { Bell, LineChart, Zap, Trophy, Clock, Target, ChevronDown, Plus, ArrowUp } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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
        {games.map((game, idx) => (
          <div key={idx} className="p-3 rounded-lg bg-secondary/50 border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={game.home.logo} alt={game.home.name} className="w-8 h-8 object-contain" />
                <span className="text-sm font-medium">{game.home.name}</span>
              </div>
              <span className={`font-mono text-sm font-semibold ${game.home.ml < 0 ? "text-primary" : "text-muted-foreground"}`}>
                {formatOdds(game.home.ml)}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <img src={game.away.logo} alt={game.away.name} className="w-8 h-8 object-contain" />
                <span className="text-sm font-medium">{game.away.name}</span>
              </div>
              <span className={`font-mono text-sm font-semibold ${game.away.ml < 0 ? "text-primary" : "text-muted-foreground"}`}>
                {formatOdds(game.away.ml)}
              </span>
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
              <span className="text-xs text-muted-foreground">Updated 2s ago</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Alert Builder Preview Component
const AlertBuilderPreview = () => (
  <div className="mt-4 space-y-2 text-sm">
    <div className="flex items-center gap-2 p-2 rounded bg-secondary/50 border border-border">
      <span className="text-primary font-medium">IF</span>
      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-muted border border-border">
        <img src={BullsLogo} alt="Bulls" className="w-4 h-4 object-contain" />
        <span>Bulls</span>
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </div>
      <span className="text-muted-foreground">ML reaches</span>
      <span className="text-primary font-mono font-semibold">+100</span>
    </div>
    <div className="flex items-center gap-2 p-2 rounded bg-secondary/50 border border-border">
      <span className="text-accent font-medium">AND</span>
      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-muted border border-border">
        <span>Game is</span>
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </div>
      <span className="text-primary font-mono font-semibold">LIVE</span>
    </div>
    <div className="p-2 rounded bg-primary/5 border border-primary/20 text-xs text-muted-foreground italic">
      → "Alert me when Bulls ML is even money during live play"
    </div>
    <button className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity">
      Create Alert
    </button>
  </div>
);

// Notifications Preview Component
const NotificationsPreview = () => {
  const notifications = [
    { team: "Warriors", event: "ML hit -110", time: "Just now", isNew: true },
    { team: "Bulls", event: "spread moved to -4.5", time: "2 min ago", isNew: false },
    { team: "Rangers", event: "total dropped to 8.0", time: "5 min ago", isNew: false },
  ];

  return (
    <div className="mt-4 relative h-32">
      {notifications.map((notif, idx) => (
        <div
          key={idx}
          className="absolute w-full p-3 rounded-lg border transition-all duration-300"
          style={{
            top: `${idx * 12}px`,
            left: `${idx * 8}px`,
            zIndex: 3 - idx,
            backgroundColor: idx === 0 ? "hsl(var(--primary) / 0.1)" : "hsl(var(--secondary) / 0.5)",
            borderColor: idx === 0 ? "hsl(var(--primary) / 0.3)" : "hsl(var(--border))",
            opacity: 1 - idx * 0.15,
          }}
        >
          <div className="flex items-center gap-2 text-sm">
            {idx === 0 && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary text-primary-foreground">
                NEW
              </span>
            )}
            <Bell className={`w-3.5 h-3.5 ${idx === 0 ? "text-primary" : "text-muted-foreground"}`} />
            <span className="font-medium">{notif.team}</span>
            <span className="text-muted-foreground">{notif.event}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1 ml-5">{notif.time}</div>
        </div>
      ))}
    </div>
  );
};

// Quick +100 Alert Preview Component
const QuickAlertPreview = () => (
  <div className="mt-4 space-y-2">
    {[
      { name: "Vikings", logo: VikingsLogo, ml: 110 },
      { name: "Commanders", logo: CommandersLogo, ml: -130 },
    ].map((team) => (
      <div key={team.name} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 border border-border group">
        <div className="flex items-center gap-2">
          <img src={team.logo} alt={team.name} className="w-6 h-6 object-contain" />
          <span className="text-sm font-medium">{team.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-muted-foreground">{formatOdds(team.ml)}</span>
          <button className="w-6 h-6 rounded flex items-center justify-center bg-muted border border-border hover:bg-primary hover:border-primary hover:text-primary-foreground transition-all group-hover:border-primary/50">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    ))}
    <p className="text-xs text-muted-foreground text-center pt-1">
      Click + to create instant even money alert
    </p>
  </div>
);

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

// Real-Time Updates Preview Component
const RealTimePreview = () => (
  <div className="mt-4 space-y-3">
    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
      <div className="flex items-center gap-2">
        <img src={RangersLogo} alt="Rangers" className="w-6 h-6 object-contain" />
        <span className="text-lg font-bold">3</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          LIVE
        </span>
        <span className="text-xs text-muted-foreground mt-1">Bot 7th</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold">4</span>
        <img src={GiantsLogo} alt="Giants" className="w-6 h-6 object-contain" />
      </div>
    </div>

    <div className="p-2 rounded bg-secondary/30 border border-border text-sm">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Rangers ML:</span>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground line-through">+145</span>
          <span className="text-primary">→</span>
          <span className="text-primary font-mono font-semibold">+125</span>
          <ArrowUp className="w-3 h-3 text-green-400" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-1">Line moved 3 min ago</p>
    </div>

    <div className="flex items-center gap-3 text-xs">
      {["Live", "Odds", "Scores"].map((label) => (
        <div key={label} className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span className="text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  </div>
);

const features = [
  {
    icon: LineChart,
    title: "Games Dashboard",
    description: "Live odds for ML, Spread, and Totals across all major sports",
    preview: <GamesDashboardPreview />,
    colSpan: "md:col-span-2",
    rowSpan: "md:row-span-2",
  },
  {
    icon: Target,
    title: "Alert Builder",
    description: "Create complex conditions with AND/OR logic",
    preview: <AlertBuilderPreview />,
    colSpan: "md:col-span-1",
    rowSpan: "md:row-span-1",
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "Instant alerts when conditions trigger",
    preview: <NotificationsPreview />,
    colSpan: "md:col-span-1",
    rowSpan: "md:row-span-1",
  },
  {
    icon: Zap,
    title: "Quick +100 Alert",
    description: "One-click even money alerts",
    preview: <QuickAlertPreview />,
    colSpan: "md:col-span-1",
    rowSpan: "md:row-span-1",
  },
  {
    icon: Trophy,
    title: "All Major Sports",
    description: "NFL, NBA, NHL, MLB, NCAAB, NCAAF",
    preview: <AllSportsPreview />,
    colSpan: "md:col-span-1",
    rowSpan: "md:row-span-1",
  },
  {
    icon: Clock,
    title: "Real-Time Updates",
    description: "Live polling with instant data sync",
    preview: <RealTimePreview />,
    colSpan: "md:col-span-1",
    rowSpan: "md:row-span-1",
  },
];

export const BentoGrid = () => {
  return (
    <section className="py-24 relative">
      <div className="container px-4 md:px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Everything you need for{" "}
            <span className="text-gradient-amber">smarter alerts</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Powerful tools to track odds, build custom conditions, and get notified instantly.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`${feature.colSpan} ${feature.rowSpan} p-6 rounded-xl bg-card border border-border card-hover`}
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
