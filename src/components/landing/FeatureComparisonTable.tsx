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
       { name: "Timed Line Surge", rookie: false, pro: false, legend: true },
       { name: "Momentum Run Alerts", rookie: false, pro: false, legend: true },
     ],
   },
   {
     category: "Notifications",
     features: [
      { name: "Push Notifications", rookie: true, pro: true, legend: true },
      { name: "Email Notifications", rookie: false, pro: true, legend: true },
      { name: "SMS Notifications", rookie: false, pro: false, legend: true },
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
       { name: "Auto-rearm Alerts", rookie: false, pro: false, legend: true },
       { name: "Custom Notification Channels", rookie: false, pro: false, legend: true },
     ],
   },
 ];
 
 const FeatureCell = ({
   value,
   tier,
   tooltip,
 }: {
   value: FeatureValue;
   tier: "rookie" | "pro" | "legend";
   tooltip?: string;
 }) => {
   if (typeof value === "boolean") {
     return value ? (
       <Check className="w-5 h-5 text-primary mx-auto" />
     ) : (
       <Minus className="w-4 h-4 text-muted-foreground/50 mx-auto" />
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
 
   return <span className="text-sm font-medium">{value}</span>;
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
 
         <div className="border border-border rounded-xl overflow-hidden bg-card">
           <div className="overflow-x-auto">
             <Table>
               <TableHeader>
                 <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                   <TableHead className="w-[280px] font-semibold text-foreground">
                     Feature
                   </TableHead>
                   <TableHead className="text-center font-semibold text-foreground w-[120px]">
                     Rookie
                   </TableHead>
                   <TableHead className="text-center font-semibold text-foreground w-[120px]">
                     <span className="text-gradient-amber">Pro</span>
                   </TableHead>
                   <TableHead className="text-center font-semibold text-foreground w-[120px]">
                     Legend
                   </TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {featureData.map((category, categoryIndex) => (
                   <>
                     {/* Category header row */}
                     <TableRow
                       key={`category-${categoryIndex}`}
                       className="bg-secondary/30 hover:bg-secondary/30"
                     >
                       <TableCell
                         colSpan={4}
                         className="py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                       >
                         {category.category}
                       </TableCell>
                     </TableRow>
                     {/* Feature rows */}
                     {category.features.map((feature, featureIndex) => (
                       <TableRow
                         key={`feature-${categoryIndex}-${featureIndex}`}
                         className={cn(
                           featureIndex % 2 === 0 ? "bg-transparent" : "bg-secondary/10"
                         )}
                       >
                         <TableCell className="font-medium text-sm">
                           {feature.name}
                         </TableCell>
                         <TableCell className="text-center">
                           <FeatureCell
                             value={feature.rookie}
                             tier="rookie"
                           />
                         </TableCell>
                         <TableCell className="text-center">
                           <FeatureCell
                             value={feature.pro}
                             tier="pro"
                             tooltip={feature.tooltip?.pro}
                           />
                         </TableCell>
                         <TableCell className="text-center">
                           <FeatureCell
                             value={feature.legend}
                             tier="legend"
                             tooltip={feature.tooltip?.legend}
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
     </TooltipProvider>
   );
 };