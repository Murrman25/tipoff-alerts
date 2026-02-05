 import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
 
 const AboutUs = () => {
   return (
     <LegalPageLayout title="About Us">
       <section className="space-y-8">
         <div>
           <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
           <p className="text-muted-foreground">
             TipOffHQ is dedicated to providing sports enthusiasts with real-time alerts and 
             insights. We believe that timely, accurate information empowers fans to stay 
             connected to the games and teams they love.
           </p>
         </div>
 
         <div>
           <h2 className="text-2xl font-semibold mb-4">What We Do</h2>
           <p className="text-muted-foreground mb-4">
             Our platform monitors line movements, game states, and odds changes across all 
             major sports leagues. We deliver customizable alerts directly to you, ensuring 
             you never miss a critical moment.
           </p>
           <ul className="list-disc list-inside text-muted-foreground space-y-2">
             <li>Real-time line movement tracking</li>
             <li>Customizable alert thresholds</li>
             <li>Multi-sport coverage (NFL, NBA, MLB, NHL, and more)</li>
             <li>Multiple notification channels</li>
           </ul>
         </div>
 
         <div>
           <h2 className="text-2xl font-semibold mb-4">Our Values</h2>
           <div className="grid gap-4 md:grid-cols-2">
             <div className="bg-secondary/30 rounded-lg p-4">
               <h3 className="font-semibold mb-2">Accuracy</h3>
               <p className="text-sm text-muted-foreground">
                 We prioritize delivering precise, verified information you can trust.
               </p>
             </div>
             <div className="bg-secondary/30 rounded-lg p-4">
               <h3 className="font-semibold mb-2">Speed</h3>
               <p className="text-sm text-muted-foreground">
                 Real-time updates mean you're always ahead of the curve.
               </p>
             </div>
             <div className="bg-secondary/30 rounded-lg p-4">
               <h3 className="font-semibold mb-2">Transparency</h3>
               <p className="text-sm text-muted-foreground">
                 We're an informational tool, not a gambling platform.
               </p>
             </div>
             <div className="bg-secondary/30 rounded-lg p-4">
               <h3 className="font-semibold mb-2">User-First</h3>
               <p className="text-sm text-muted-foreground">
                 Your experience and needs drive every feature we build.
               </p>
             </div>
           </div>
         </div>
       </section>
     </LegalPageLayout>
   );
 };
 
 export default AboutUs;