 import { Link } from "react-router-dom";
 import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
 
 const TermsOfService = () => {
   return (
     <LegalPageLayout title="Terms of Service">
       <div className="space-y-10 text-muted-foreground">
         {/* Effective Dates */}
         <div className="bg-secondary/30 rounded-lg p-4 text-sm">
           <p><strong className="text-foreground">Effective Date:</strong> February 4, 2026</p>
           <p><strong className="text-foreground">Last Updated:</strong> February 4, 2026</p>
         </div>
 
         {/* Introduction */}
         <section className="space-y-4">
           <p>
             These Terms of Service ("Terms") govern your access to and use of the TipOff HQ website, 
             web application, and related services (collectively, the "Services"), operated by TipOff HQ LLC, 
             a Colorado limited liability company ("TipOff HQ," "we," "us," or "our").
           </p>
           <p>
             By accessing or using the Services, you acknowledge that you have read, understood, and agree 
             to be bound by these Terms and our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>. 
             If you do not agree, you must not use the Services.
           </p>
         </section>
 
         {/* Section 1 */}
         <section className="space-y-4">
           <h2 className="text-xl font-semibold text-foreground">1. Eligibility and Legal Capacity</h2>
           <ul className="list-disc pl-6 space-y-2">
             <li>You must be at least 18 years of age and have the legal capacity to enter into a binding agreement to use the Services.</li>
             <li>Certain third-party services linked through the platform, including sportsbooks, may require users to be 21 years of age or older. TipOff HQ does not control or enforce third-party age restrictions.</li>
             <li>The Services are not intended for use by minors.</li>
           </ul>
         </section>
 
         {/* Section 2 */}
         <section className="space-y-4">
           <h2 className="text-xl font-semibold text-foreground">2. Description of the Services</h2>
           <p>
             TipOff HQ provides sports-related data, analytics, alerts, insights, and visualizations 
             covering professional and collegiate sports, including but not limited to:
           </p>
           <div className="grid grid-cols-2 md:grid-cols-3 gap-2 my-4">
             <span className="bg-secondary/50 px-3 py-1.5 rounded text-sm text-center">NBA</span>
             <span className="bg-secondary/50 px-3 py-1.5 rounded text-sm text-center">NFL</span>
             <span className="bg-secondary/50 px-3 py-1.5 rounded text-sm text-center">NCAAB</span>
             <span className="bg-secondary/50 px-3 py-1.5 rounded text-sm text-center">NCAAF</span>
             <span className="bg-secondary/50 px-3 py-1.5 rounded text-sm text-center">MLB</span>
             <span className="bg-secondary/50 px-3 py-1.5 rounded text-sm text-center">NHL</span>
           </div>
           <p>The Services are provided through a web-based platform and may include free features and paid subscription tiers.</p>
           <p className="font-medium text-foreground">All information is provided for informational and entertainment purposes only.</p>
         </section>
 
         {/* Section 3 */}
         <section className="space-y-4">
           <h2 className="text-xl font-semibold text-foreground">3. No Affiliation or Endorsement</h2>
           <p>
             TipOff HQ is not affiliated with, endorsed by, sponsored by, or associated with any sports league, 
             team, governing body, sportsbook, or wagering operator.
           </p>
         </section>
 
         {/* Section 4 */}
         <section className="space-y-4">
           <h2 className="text-xl font-semibold text-foreground">4. Account Registration and Security</h2>
           <p>Certain features of the Services require account registration. You agree to:</p>
           <ul className="list-disc pl-6 space-y-2">
             <li>Provide accurate, complete, and current information</li>
             <li>Maintain the confidentiality of your login credentials</li>
             <li>Notify us immediately of any unauthorized access or use</li>
           </ul>
           <p>You are responsible for all activity conducted under your account.</p>
           <p>TipOff HQ reserves the right to suspend or terminate accounts at its sole discretion.</p>
         </section>
 
         {/* Section 5 */}
         <section className="space-y-6">
           <h2 className="text-xl font-semibold text-foreground">5. Subscriptions, Billing, Payments, and NO REFUNDS</h2>
           
           <div className="space-y-3">
             <h3 className="text-lg font-medium text-foreground">5.1 Subscription Plans</h3>
             <p>
               TipOff HQ may offer multiple subscription tiers with varying features, access levels, and usage limits. 
               Some features may be offered free of charge, while others require a paid subscription.
             </p>
           </div>
 
           <div className="space-y-3">
             <h3 className="text-lg font-medium text-foreground">5.2 Billing and Auto-Renewal</h3>
             <ul className="list-disc pl-6 space-y-2">
               <li>Paid subscriptions are billed in advance on a recurring basis (monthly, annual, or as otherwise disclosed at the time of purchase)</li>
               <li>Subscriptions automatically renew unless canceled before the renewal date</li>
               <li>You authorize TipOff HQ to charge your payment method on a recurring basis</li>
             </ul>
           </div>
 
           <div className="space-y-3">
             <h3 className="text-lg font-medium text-foreground">5.3 NO REFUNDS – ALL SALES FINAL</h3>
             <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
               <p className="font-semibold text-foreground mb-3">ALL FEES PAID TO TIPOFF HQ ARE FINAL AND NON-REFUNDABLE.</p>
               <p className="mb-2">This includes, without limitation:</p>
               <ul className="list-disc pl-6 space-y-1 text-sm">
                 <li>Subscription fees</li>
                 <li>Partial billing periods</li>
                 <li>Unused time</li>
                 <li>Downgrades</li>
                 <li>Account suspension or termination</li>
                 <li>Dissatisfaction with features, data, or results</li>
               </ul>
               <p className="mt-3 text-sm">We do not provide refunds, credits, or prorated billing for any reason, except where required by applicable law.</p>
             </div>
           </div>
 
           <div className="space-y-3">
             <h3 className="text-lg font-medium text-foreground">5.4 Cancellations</h3>
             <ul className="list-disc pl-6 space-y-2">
               <li>You may cancel your subscription at any time</li>
               <li>Cancellation prevents future charges but does not entitle you to a refund</li>
               <li>Your access will continue until the end of the current billing period</li>
             </ul>
           </div>
 
           <div className="space-y-3">
             <h3 className="text-lg font-medium text-foreground">5.5 Pricing Changes</h3>
             <p>TipOff HQ reserves the right to modify pricing, plans, or features at any time with reasonable advance notice.</p>
           </div>
         </section>
 
         {/* Section 6 */}
         <section className="space-y-6">
           <h2 className="text-xl font-semibold text-foreground">6. Third-Party Sports Data and Source Disclaimers</h2>
           
           <div className="space-y-3">
             <h3 className="text-lg font-medium text-foreground">6.1 Third-Party Data Sources</h3>
             <p>
               TipOff HQ aggregates and displays sports-related information obtained from third-party data providers 
               and licensors. TipOff HQ does not independently verify, generate, or certify the accuracy of underlying sports data.
             </p>
             <p>You acknowledge and agree that:</p>
             <ul className="list-disc pl-6 space-y-2">
               <li>Sports data may be delayed, incomplete, inaccurate, or revised</li>
               <li>Live or near-real-time data is subject to latency, outages, and transmission errors</li>
               <li>TipOff HQ is not an official source of league or event data</li>
             </ul>
           </div>
 
           <div className="space-y-3">
             <h3 className="text-lg font-medium text-foreground">6.2 No Source of Record</h3>
             <p>
               TipOff HQ is not a source of record, authoritative statistical reference, or official league data provider. 
               Users are responsible for independently verifying information.
             </p>
             <p>All third-party data remains the property of its respective licensors.</p>
           </div>
         </section>
 
         {/* Section 7 */}
         <section className="space-y-4">
           <h2 className="text-xl font-semibold text-foreground">7. Sportsbook Links and Affiliate Relationships</h2>
           <p>
             The Services may display sportsbook odds, lines, or related information and may include links 
             or referrals to third-party sportsbooks or wagering services.
           </p>
           <p>You acknowledge and agree that:</p>
           <ul className="list-disc pl-6 space-y-2">
             <li>TipOff HQ does not operate, manage, or control any sportsbook</li>
             <li>TipOff HQ does not accept, place, or facilitate wagers</li>
             <li>Any wagers are placed directly with third-party sportsbooks</li>
             <li>TipOff HQ is not responsible for sportsbook pricing, availability, terms, or outcomes</li>
           </ul>
           <p>
             Use of third-party sportsbooks is subject to their own terms, age requirements, and legal restrictions. 
             You are solely responsible for determining whether sports wagering is legal in your jurisdiction and 
             whether you meet applicable age requirements, including the requirement that sportsbook users be 21 years 
             of age or older where required by law.
           </p>
           <div className="bg-secondary/30 rounded-lg p-4 mt-4">
             <h4 className="font-semibold text-foreground mb-2">Affiliate Disclosure</h4>
             <p className="text-sm">
               TipOff HQ may receive compensation from third-party sportsbooks or partners when users access their 
               services through links on the platform. Such compensation does not influence the accuracy, integrity, 
               or independence of TipOff HQ's data or insights.
             </p>
           </div>
         </section>
 
         {/* Section 8 */}
         <section className="space-y-6">
           <h2 className="text-xl font-semibold text-foreground">8. Intellectual Property Rights</h2>
           
           <div className="space-y-3">
             <h3 className="text-lg font-medium text-foreground">8.1 Ownership</h3>
             <p>
               All software, designs, interfaces, analytics models, alerts, compiled datasets, trademarks, logos, 
               and content are owned by TipOff HQ or its licensors and are protected by intellectual property laws.
             </p>
           </div>
 
           <div className="space-y-3">
             <h3 className="text-lg font-medium text-foreground">8.2 Limited License</h3>
             <p>
               You are granted a limited, revocable, non-exclusive, non-transferable license to access and use 
               the Services solely for your personal or internal business use.
             </p>
             <p className="font-medium text-foreground">All rights not expressly granted are reserved.</p>
           </div>
         </section>
 
         {/* Section 9 */}
         <section className="space-y-4">
           <h2 className="text-xl font-semibold text-foreground">9. Restrictions and Prohibited Conduct</h2>
           <p>You agree not to:</p>
           <ul className="list-disc pl-6 space-y-2">
             <li>Scrape, crawl, or mine data from the Services</li>
             <li>Use bots, automated scripts, or headless browsers</li>
             <li>Reverse engineer, decompile, or disassemble the platform</li>
             <li>Redistribute, resell, sublicense, or publicly display data</li>
             <li>Use the Services to build or support competing products</li>
             <li>Use the Services to train artificial intelligence or machine learning models</li>
             <li>Share accounts or credentials</li>
             <li>Use the Services unlawfully, deceptively, or fraudulently</li>
           </ul>
           <p className="font-medium text-foreground mt-4">Unauthorized use may result in immediate termination without refund.</p>
         </section>
 
         {/* Section 10 */}
         <section className="space-y-4">
           <h2 className="text-xl font-semibold text-foreground">10. No Wagering, Gambling, or Financial Advice</h2>
           <p>
             TipOff HQ does not provide wagering, gambling, financial, or investment advice and does not 
             offer betting services of any kind.
           </p>
           <p className="font-medium text-foreground">
             Sporting events are unpredictable. Any decisions you make based on the Services are made entirely at your own risk.
           </p>
         </section>
 
         {/* Section 11 */}
         <section className="space-y-4">
           <h2 className="text-xl font-semibold text-foreground">11. Service Availability and Modifications</h2>
           <p>
             The Services are provided on an "as available" basis. TipOff HQ may modify, suspend, or discontinue 
             any portion of the Services at any time without liability or obligation to issue refunds.
           </p>
         </section>
 
         {/* Section 12 */}
         <section className="space-y-4">
           <h2 className="text-xl font-semibold text-foreground">12. Suspension and Termination</h2>
           <p>
             TipOff HQ may suspend or terminate access to the Services at any time for violations of these Terms, 
             misuse of the platform, or legal, security, or operational reasons.
           </p>
           <p className="font-medium text-foreground">Termination for any reason does not entitle you to a refund.</p>
         </section>
 
         {/* Section 13 */}
         <section className="space-y-4">
           <h2 className="text-xl font-semibold text-foreground">13. Disclaimer of Warranties</h2>
           <div className="bg-secondary/30 rounded-lg p-4 uppercase text-sm">
             <p className="mb-2">THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE."</p>
             <p>
               TIPOFF HQ DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF ACCURACY, 
               MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
             </p>
           </div>
         </section>
 
         {/* Section 14 */}
         <section className="space-y-4">
           <h2 className="text-xl font-semibold text-foreground">14. Limitation of Liability</h2>
           <div className="bg-secondary/30 rounded-lg p-4 uppercase text-sm space-y-3">
             <p>
               TO THE MAXIMUM EXTENT PERMITTED BY LAW, TIPOFF HQ SHALL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, 
               CONSEQUENTIAL, OR PUNITIVE DAMAGES.
             </p>
             <p>
               OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT PAID BY YOU TO TIPOFF HQ IN THE TWELVE (12) MONTHS 
               PRECEDING THE CLAIM.
             </p>
           </div>
         </section>
 
         {/* Section 15 */}
         <section className="space-y-4">
           <h2 className="text-xl font-semibold text-foreground">15. Indemnification</h2>
           <p>
             You agree to indemnify and hold harmless TipOff HQ, its officers, employees, and affiliates from any 
             claims, damages, losses, or expenses arising out of your use of the Services or violation of these Terms.
           </p>
         </section>
 
         {/* Section 16 */}
         <section className="space-y-4">
           <h2 className="text-xl font-semibold text-foreground">16. Governing Law and Dispute Resolution</h2>
           <p>
             These Terms are governed by the laws of the State of Colorado, without regard to conflict-of-law principles.
           </p>
           <p>
             Except for claims eligible for small claims court or seeking injunctive relief related to intellectual 
             property misuse, all disputes shall be resolved through binding arbitration administered by AAA or JAMS, 
             on an individual basis.
           </p>
           <p className="font-medium text-foreground">
             Class actions and representative proceedings are waived to the fullest extent permitted by law.
           </p>
         </section>
 
         {/* Section 17 */}
         <section className="space-y-4">
           <h2 className="text-xl font-semibold text-foreground">17. Changes to These Terms</h2>
           <p>
             TipOff HQ may update these Terms at any time. Continued use of the Services constitutes acceptance 
             of the updated Terms.
           </p>
         </section>
 
         {/* Contact */}
         <section className="space-y-4 pt-6 border-t border-border">
           <h2 className="text-xl font-semibold text-foreground">Questions?</h2>
           <p>
             For questions about these Terms of Service, please visit our{" "}
             <Link to="/contact" className="text-primary hover:underline">contact page</Link>.
           </p>
         </section>
       </div>
     </LegalPageLayout>
   );
 };
 
 export default TermsOfService;