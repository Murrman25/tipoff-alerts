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
     pro?: string;
     legend?: string;
   };
  legendExclusive?: boolean;
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
         name: "Active Alerts",
         rookie: "1/day",
         pro: "5",
         legend: "Unlimited",
         tooltip: {
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
       { name: "Over/Under Alerts", rookie: true, pro: true, legend: true },
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
      { name: "SMS Notifications", rookie: false, pro: false, legend: true, legendExclusive: true },
       { name: "Priority Delivery", rookie: false, pro: true, legend: true },
     ],
   },
   {
     category: "Features",
     features: [
       { name: "Basic Alert Builder", rookie: true, pro: true, legend: true },
       { name: "Multi-condition Logic", rookie: false, pro: true, legend: true },
       { name: "Alert Templates", rookie: false, pro: true, legend: true },
       { name: "Line Movement History", rookie: false, pro: true, legend: true },
      { name: "Auto-rearm Alerts", rookie: false, pro: false, legend: true, legendExclusive: true },
      { name: "Custom Notification Channels", rookie: false, pro: false, legend: true, legendExclusive: true },
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
            isLegendExclusiveCell && "bg-purple-500/20",
            isProCell && "bg-primary/10",
            tier === "legend" && !legendExclusive && "bg-purple-500/10",
            tier === "rookie" && "bg-muted/50"
          )}
        >
          <Check
            className={cn(
              "w-4 h-4",
              isLegendExclusiveCell ? "text-purple-400" : "",
              isProCell ? "text-primary" : "",
              tier === "legend" && !legendExclusive ? "text-purple-400" : "",
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
         <TooltipTrigger className="inline-flex items-center gap-1 text-sm font-medium">
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
        tier === "legend" && "text-purple-400"
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
                    <span className="text-gradient-amber font-bold">Pro</span>
                   </TableHead>
                  <TableHead className="text-center font-semibold w-[120px] py-4">
                    <span className="text-purple-400 font-bold">Legend</span>
                   </TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {featureData.map((category, categoryIndex) => (
                   <>
                     {/* Category header row */}
                     <TableRow
                       key={`category-${categoryIndex}`}
                      className="bg-secondary/40 hover:bg-secondary/40 border-l-2 border-l-primary"
                     >
                       <TableCell
                         colSpan={4}
                        className="py-3 text-xs font-bold uppercase tracking-wider text-foreground"
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
                        <TableCell className={cn(
                          "font-medium text-sm py-3",
                          feature.legendExclusive && "text-purple-300/90"
                        )}>
                           {feature.name}
                          {feature.legendExclusive && (
                            <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                              Legend
                            </span>
                          )}
                         </TableCell>
                        <TableCell className="text-center py-3">
                           <FeatureCell
                             value={feature.rookie}
                             tier="rookie"
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