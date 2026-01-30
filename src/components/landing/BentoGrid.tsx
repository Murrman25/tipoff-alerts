import { Bell, LineChart, Zap, Trophy, Clock, Target } from "lucide-react";

const features = [
  {
    icon: LineChart,
    title: "Games Dashboard",
    description: "Live odds for ML, Spread, and Totals across all major sports",
    preview: (
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-xs font-bold">KC</div>
            <span className="text-sm">Chiefs</span>
          </div>
          <span className="text-primary font-mono font-semibold">-145</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-xs font-bold">BUF</div>
            <span className="text-sm">Bills</span>
          </div>
          <span className="text-muted-foreground font-mono font-semibold">+125</span>
        </div>
      </div>
    ),
    colSpan: "md:col-span-2",
    rowSpan: "md:row-span-2",
  },
  {
    icon: Target,
    title: "Alert Builder",
    description: "Create complex conditions with AND/OR logic",
    preview: (
      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center gap-2 p-2 rounded bg-secondary/50 border border-border">
          <span className="text-primary">IF</span>
          <span>Spread moves to</span>
          <span className="text-primary font-mono">+3.5</span>
        </div>
        <div className="flex items-center gap-2 p-2 rounded bg-secondary/50 border border-border">
          <span className="text-accent">AND</span>
          <span>Game is</span>
          <span className="text-primary font-mono">LIVE</span>
        </div>
      </div>
    ),
    colSpan: "md:col-span-1",
    rowSpan: "md:row-span-1",
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "Instant alerts when conditions trigger",
    preview: (
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/30 animate-pulse-glow">
          <Bell className="w-4 h-4 text-primary" />
          <div className="text-sm">
            <span className="text-primary font-semibold">Alert:</span> Chiefs ML hit +100
          </div>
        </div>
      </div>
    ),
    colSpan: "md:col-span-1",
    rowSpan: "md:row-span-1",
  },
  {
    icon: Zap,
    title: "Quick +100 Alert",
    description: "One-click even money alerts",
    preview: (
      <button className="mt-4 w-full py-3 rounded-lg bg-amber-gradient text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
        + Add +100 Alert
      </button>
    ),
    colSpan: "md:col-span-1",
    rowSpan: "md:row-span-1",
  },
  {
    icon: Trophy,
    title: "All Major Sports",
    description: "NFL, NBA, NHL, MLB, NCAAB, NCAAF",
    preview: (
      <div className="mt-4 flex flex-wrap gap-2">
        {["NFL", "NBA", "NHL", "MLB", "NCAAB", "NCAAF"].map((sport) => (
          <span key={sport} className="px-3 py-1 rounded-full text-xs font-medium bg-secondary border border-border">
            {sport}
          </span>
        ))}
      </div>
    ),
    colSpan: "md:col-span-1",
    rowSpan: "md:row-span-1",
  },
  {
    icon: Clock,
    title: "Real-Time Updates",
    description: "Live polling with instant data sync",
    preview: (
      <div className="mt-4 flex items-center gap-2 text-sm">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-muted-foreground">Live • Updated 2s ago</span>
      </div>
    ),
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
