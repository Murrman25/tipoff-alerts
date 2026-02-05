 import { Link } from "react-router-dom";
 import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
 
 const PrivacyPolicy = () => {
   return (
     <LegalPageLayout title="Privacy Policy">
       <div className="space-y-10 text-muted-foreground">
         {/* Effective Date */}
         <div className="bg-secondary/30 rounded-lg p-4 text-sm">
           <p><strong className="text-foreground">Effective Date:</strong> February 4, 2026</p>
         </div>
 
         {/* Introduction */}
         <section className="space-y-4">
           <p>
             This Privacy Policy explains how TipOff HQ LLC ("TipOff HQ," "we," or "us") collects, uses, 
             and shares personal information.
           </p>
         </section>
 
         {/* Section 1 */}
         <section className="space-y-6">
           <h2 className="text-xl font-semibold text-foreground">1. Information We Collect</h2>
           
           <div className="space-y-3">
             <h3 className="text-lg font-medium text-foreground">1.1 Information You Provide</h3>
             <ul className="list-disc pl-6 space-y-2">
               <li>Name</li>
               <li>Email address</li>
               <li>Account credentials</li>
               <li>Subscription and billing information (processed by third-party payment processors)</li>
             </ul>
           </div>
 
           <div className="space-y-3">
             <h3 className="text-lg font-medium text-foreground">1.2 Automatically Collected Information</h3>
             <ul className="list-disc pl-6 space-y-2">
               <li>IP address</li>
               <li>Device and browser information</li>
               <li>Usage logs and interaction data</li>
               <li>Referring URLs and pages viewed</li>
             </ul>
           </div>
 
           <div className="space-y-3">
             <h3 className="text-lg font-medium text-foreground">1.3 Cookies and Tracking Technologies</h3>
             <p>We use essential cookies and analytics technologies to operate, monitor, and improve the Services.</p>
           </div>
         </section>
 
         {/* Section 2 */}
         <section className="space-y-4">
           <h2 className="text-xl font-semibold text-foreground">2. How We Use Information</h2>
           <p>We use personal information to:</p>
           <ul className="list-disc pl-6 space-y-2">
             <li>Provide, operate, and maintain the Services</li>
             <li>Authenticate users</li>
             <li>Process subscriptions and payments</li>
             <li>Communicate service updates and support</li>
             <li>Improve platform performance and reliability</li>
             <li>Comply with legal obligations</li>
           </ul>
         </section>
 
         {/* Section 3 */}
         <section className="space-y-4">
           <h2 className="text-xl font-semibold text-foreground">3. Legal Bases for Processing (GDPR)</h2>
           <p>Where applicable, we process personal data based on:</p>
           <ul className="list-disc pl-6 space-y-2">
             <li>Performance of a contract</li>
             <li>Legitimate business interests</li>
             <li>Legal obligations</li>
             <li>User consent</li>
           </ul>
         </section>
 
         {/* Section 4 */}
         <section className="space-y-4">
           <h2 className="text-xl font-semibold text-foreground">4. Sharing of Information</h2>
           <p>We may share personal information with:</p>
           <ul className="list-disc pl-6 space-y-2">
             <li>Payment processors</li>
             <li>Hosting and infrastructure providers</li>
             <li>Analytics and monitoring vendors</li>
             <li>Legal authorities when required</li>
           </ul>
           <p className="font-medium text-foreground mt-4">We do not sell personal information.</p>
         </section>
 
         {/* Section 5 */}
         <section className="space-y-4">
           <h2 className="text-xl font-semibold text-foreground">5. Affiliate and Referral Tracking</h2>
           <p>
             If you click on links to third-party sportsbooks or partners, those third parties may collect 
             information in accordance with their own privacy policies. TipOff HQ is not responsible for 
             third-party privacy practices or refund policies.
           </p>
         </section>
 
         {/* Section 6 */}
         <section className="space-y-4">
           <h2 className="text-xl font-semibold text-foreground">6. Data Retention</h2>
           <p>We retain personal information for as long as necessary to:</p>
           <ul className="list-disc pl-6 space-y-2">
             <li>Maintain accounts and subscriptions</li>
             <li>Enforce agreements and policies</li>
             <li>Comply with legal and regulatory requirements</li>
           </ul>
         </section>
 
         {/* Section 7 */}
         <section className="space-y-4">
           <h2 className="text-xl font-semibold text-foreground">7. Your Privacy Rights</h2>
           <p>Depending on your jurisdiction, you may have rights to:</p>
           <ul className="list-disc pl-6 space-y-2">
             <li>Access personal information</li>
             <li>Request corrections or deletion</li>
             <li>Restrict or object to processing</li>
             <li>Opt out of marketing communications</li>
           </ul>
           <div className="bg-secondary/30 rounded-lg p-4 mt-4">
             <p className="text-sm">
               Requests may be submitted to{" "}
               <a href="mailto:privacy@tipoffhq.com" className="text-primary hover:underline">
                 privacy@tipoffhq.com
               </a>
             </p>
           </div>
         </section>
 
         {/* Section 8 */}
         <section className="space-y-4">
           <h2 className="text-xl font-semibold text-foreground">8. California Privacy Rights (CCPA / CPRA)</h2>
           <p>California residents have the right to:</p>
           <ul className="list-disc pl-6 space-y-2">
             <li>Know what personal information is collected</li>
             <li>Request deletion of personal information</li>
             <li>Opt out of the sale or sharing of personal information (if applicable)</li>
           </ul>
         </section>
 
         {/* Section 9 */}
         <section className="space-y-4">
           <h2 className="text-xl font-semibold text-foreground">9. International Users</h2>
           <p>
             Your information may be processed in the United States. Where required, appropriate safeguards 
             are used for international data transfers.
           </p>
         </section>
 
         {/* Section 10 */}
         <section className="space-y-4">
           <h2 className="text-xl font-semibold text-foreground">10. Data Security</h2>
           <p>
             We implement reasonable administrative, technical, and organizational safeguards designed to 
             protect personal information.
           </p>
         </section>
 
         {/* Section 11 */}
         <section className="space-y-4">
           <h2 className="text-xl font-semibold text-foreground">11. Children's Privacy</h2>
           <p>
             The Services are not intended for individuals under 18. We do not knowingly collect personal 
             information from minors.
           </p>
         </section>
 
         {/* Section 12 */}
         <section className="space-y-4">
           <h2 className="text-xl font-semibold text-foreground">12. Updates to This Policy</h2>
           <p>
             We may update this Privacy Policy periodically. Updates will be posted with a revised effective date.
           </p>
         </section>
 
         {/* Section 13 - Contact */}
         <section className="space-y-4 pt-6 border-t border-border">
           <h2 className="text-xl font-semibold text-foreground">13. Contact Us</h2>
           <div className="bg-secondary/30 rounded-lg p-4">
             <p className="font-medium text-foreground mb-2">TipOff HQ LLC</p>
             <p className="text-sm">
               Email:{" "}
               <a href="mailto:support@tipoffhq.com" className="text-primary hover:underline">
                 support@tipoffhq.com
               </a>
             </p>
           </div>
           <p className="text-sm">
             You can also reach us through our{" "}
             <Link to="/contact" className="text-primary hover:underline">contact page</Link>.
           </p>
         </section>
       </div>
     </LegalPageLayout>
   );
 };
 
 export default PrivacyPolicy;