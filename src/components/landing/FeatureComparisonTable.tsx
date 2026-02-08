 import { Check, Minus, HelpCircle } from "lucide-react";
 import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
 } from "@/components/ui/tooltip";
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from "@/components/ui/table";
 import { cn } from "@/lib/utils";
 import { useScrollAnimation } from "@/hooks/useScrollAnimation";
 
 type FeatureValue = boolean | string;
 
 interface Feature {
   name: string;
   rookie: FeatureValue;
   pro: FeatureValue;
   legend: FeatureValue;
   tooltip?: {
    rookie?: string;
     pro?: string;
     legend?: string;
   };
  legendExclusive?: boolean;
  featureTooltip?: string;
 }
 
 interface FeatureCategory {
   category: string;
   features: Feature[];
 }
 
 const featureData: FeatureCategory[] = [
   {
     category: "Alert Limits",
     features: [
       {
      name: "Total Alerts",
      rookie: "1/day",
      pro: "Unlimited",
      legend: "Unlimited",
    },
    {
        name: "Active Alerts",
        rookie: "1",
        pro: "5",
        legend: "Unlimited",
        tooltip: {
          rookie: "Your 1 daily alert can be active and monitoring for your conditions.",
          pro: "An active alert is one that's currently monitoring for your specified conditions. Inactive alerts are paused and don't count toward your limit.",
          legend: "Create as many alerts as you want with no restrictions. Keep alerts active indefinitely or pause them for later.",
        },
      },
     ],
   },
   {
     category: "Alert Types",
     features: [
       { name: "Moneyline Alerts", rookie: true, pro: true, legend: true },
       { name: "Spread Alerts", rookie: true, pro: true, legend: true },
        { name: "Over/Under Alerts", rookie: false, pro: true, legend: true },
       { name: "Score Margin Alerts", rookie: false, pro: true, legend: true },
      { name: "Timed Line Surge", rookie: false, pro: false, legend: true, legendExclusive: true },
      { name: "Momentum Run Alerts", rookie: false, pro: false, legend: true, legendExclusive: true },
     ],
   },
   {
     category: "Notifications",
     features: [
      { name: "Push Notifications", rookie: true, pro: true, legend: true },
      { name: "Email Notifications", rookie: false, pro: true, legend: true },
      { name: "Priority Delivery", rookie: false, pro: false, legend: true, legendExclusive: true },
     ],
   },
   {
     category: "Features",
     features: [
      { 
        name: "Basic Alert Builder", 
        rookie: true, 
        pro: true, 
        legend: true,
        featureTooltip: "Create simple threshold-based alerts with our intuitive step-by-step builder.",
      },
      { 
        name: "Multi-condition Logic", 
        rookie: false, 
        pro: true, 
        legend: true,
        featureTooltip: "Combine multiple conditions with AND/OR operators for precise alert triggers.",
      },
      { 
        name: "Alert Templates", 
        rookie: false, 
        pro: true, 
        legend: true,
        featureTooltip: "Save and reuse your favorite alert configurations to set up new alerts quickly.",
      },
      { 
        name: "Line Movement History", 
        rookie: false, 
        pro: true, 
        legend: true,
        featureTooltip: "View historical line changes and trends to make more informed decisions.",
      },
      { 
        name: "Auto-rearm Alerts", 
        rookie: false, 
        pro: false, 
        legend: true, 
        legendExclusive: true,
        featureTooltip: "Automatically reactivate alerts after they trigger so you never miss a repeat opportunity.",
      },
      { 
        name: "Custom Notification Channels", 
        rookie: false, 
        pro: false, 
        legend: true, 
        legendExclusive: true,
        featureTooltip: "Route different alerts to different devices or channels based on your preferences.",
      },
     ],
   },
 ];
 
 const FeatureCell = ({
   value,
   tier,
   tooltip,
  legendExclusive,
 }: {
   value: FeatureValue;
   tier: "rookie" | "pro" | "legend";
   tooltip?: string;
  legendExclusive?: boolean;
 }) => {
   if (typeof value === "boolean") {
    if (value) {
      const isLegendExclusiveCell = tier === "legend" && legendExclusive;
      const isProCell = tier === "pro";
      
      return (
        <div
          className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center mx-auto",
              isLegendExclusiveCell && "bg-blue-500/10",
            isProCell && "bg-primary/10",
            tier === "legend" && !legendExclusive && "bg-blue-500/10",
            tier === "rookie" && "bg-muted/50"
          )}
        >
          <Check
            className={cn(
              "w-4 h-4",
              isLegendExclusiveCell ? "text-blue-400" : "",
              isProCell ? "text-primary" : "",
              tier === "legend" && !legendExclusive ? "text-blue-400" : "",
              tier === "rookie" ? "text-muted-foreground" : "",
              !isLegendExclusiveCell && !isProCell && tier !== "legend" && tier !== "rookie" && "text-primary"
            )}
          />
        </div>
      );
    }
    
    return (
      <div className="w-7 h-7 flex items-center justify-center mx-auto">
        <Minus className="w-4 h-4 text-muted-foreground/30" />
      </div>
     );
   }
 
   if (tooltip) {
     return (
       <Tooltip>
        <TooltipTrigger className={cn(
          "inline-flex items-center gap-1 text-sm font-medium",
          tier === "pro" && "text-primary",
           tier === "legend" && "text-blue-400"
         )}>
           {value}
           <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
         </TooltipTrigger>
         <TooltipContent side="top" className="max-w-xs text-center">
           {tooltip}
         </TooltipContent>
       </Tooltip>
     );
   }
 
  return (
    <span
      className={cn(
        "text-sm font-medium",
        tier === "pro" && "text-primary",
        tier === "legend" && "text-blue-400"
      )}
    >
      {value}
    </span>
  );
 };
 
 export const FeatureComparisonTable = () => {
   const { ref, isVisible } = useScrollAnimation();
 
   return (
     <TooltipProvider delayDuration={200}>
       <div
         ref={ref}
         className={cn(
           "mt-20 max-w-5xl mx-auto animate-on-scroll",
           isVisible && "is-visible"
         )}
       >
         <h3 className="text-2xl md:text-3xl font-bold text-center mb-8">
           Feature Comparison
         </h3>
 
        {/* Gradient border container */}
        <div className="relative p-[1px] rounded-xl bg-gradient-to-b from-border via-border/50 to-transparent overflow-hidden shadow-lg">
          <div className="bg-card rounded-xl overflow-hidden">
           <div className="overflow-x-auto">
             <Table>
               <TableHeader>
                <TableRow className="bg-secondary/60 hover:bg-secondary/60 border-b border-border/50">
                  <TableHead className="w-[280px] font-semibold text-foreground py-4">
                     Feature
                   </TableHead>
                  <TableHead className="text-center font-semibold text-muted-foreground w-[120px] py-4">
                     Rookie
                   </TableHead>
                  <TableHead className="text-center font-semibold w-[120px] py-4">
                    <span className="text-gradient-gold font-bold">Pro</span>
                   </TableHead>
                  <TableHead className="text-center font-semibold w-[120px] py-4">
                    <span className="text-blue-400 font-bold">Legend</span>
                   </TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {featureData.map((category, categoryIndex) => (
                   <>
                     {/* Category header row */}
                     <TableRow
                       key={`category-${categoryIndex}`}
                      className="bg-secondary/40 hover:bg-secondary/40"
                     >
                       <TableCell
                         colSpan={4}
                        className="py-3 text-xs font-bold uppercase tracking-wider text-primary"
                       >
                         {category.category}
                       </TableCell>
                     </TableRow>
                     {/* Feature rows */}
                     {category.features.map((feature, featureIndex) => (
                       <TableRow
                         key={`feature-${categoryIndex}-${featureIndex}`}
                         className={cn(
                          "transition-colors duration-150",
                          featureIndex % 2 === 0 ? "bg-transparent" : "bg-secondary/10",
                          "hover:bg-secondary/25"
                         )}
                       >
                        <TableCell className="font-medium text-sm py-3">
                           {feature.featureTooltip ? (
                             <Tooltip>
                               <TooltipTrigger className="inline-flex items-center gap-1.5 text-left">
                                 {feature.name}
                                 <HelpCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                               </TooltipTrigger>
                               <TooltipContent side="right" className="max-w-xs">
                                 {feature.featureTooltip}
                               </TooltipContent>
                             </Tooltip>
                           ) : (
                             feature.name
                           )}
                         </TableCell>
                        <TableCell className="text-center py-3">
                           <FeatureCell
                             value={feature.rookie}
                             tier="rookie"
                              tooltip={feature.tooltip?.rookie}
                            legendExclusive={feature.legendExclusive}
                           />
                         </TableCell>
                        <TableCell className="text-center py-3">
                           <FeatureCell
                             value={feature.pro}
                             tier="pro"
                             tooltip={feature.tooltip?.pro}
                            legendExclusive={feature.legendExclusive}
                           />
                         </TableCell>
                        <TableCell className="text-center py-3">
                           <FeatureCell
                             value={feature.legend}
                             tier="legend"
                             tooltip={feature.tooltip?.legend}
                            legendExclusive={feature.legendExclusive}
                           />
                         </TableCell>
                       </TableRow>
                     ))}
                   </>
                 ))}
               </TableBody>
             </Table>
           </div>
          </div>
         </div>
       </div>
     </TooltipProvider>
   );
 };