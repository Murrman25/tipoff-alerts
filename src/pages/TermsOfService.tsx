 import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
 
 const TermsOfService = () => {
   return (
     <LegalPageLayout title="Terms of Service">
       <div className="space-y-8 text-muted-foreground">
         <p className="text-sm">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
         
         <section className="space-y-4">
           <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
           <p>
             By accessing or using TipOffHQ, you agree to be bound by these Terms of Service. 
             If you do not agree to these terms, please do not use our service.
           </p>
         </section>
 
         <section className="space-y-4">
           <h2 className="text-xl font-semibold text-foreground">2. Description of Service</h2>
           <p>
             TipOffHQ is a real-time sports alerts platform that provides notifications about 
             line movements, game states, and odds changes. We are an informational tool only 
             and do not facilitate, encourage, or endorse gambling.
           </p>
         </section>
 
         <section className="space-y-4">
           <h2 className="text-xl font-semibold text-foreground">3. User Accounts</h2>
           <p>To use certain features, you must create an account. You are responsible for:</p>
           <ul className="list-disc pl-6 space-y-2">
             <li>Maintaining the confidentiality of your account</li>
             <li>All activities that occur under your account</li>
             <li>Providing accurate and complete information</li>
             <li>Notifying us of any unauthorized use</li>
           </ul>
         </section>
 
         <section className="space-y-4">
           <h2 className="text-xl font-semibold text-foreground">4. Acceptable Use</h2>
           <p>You agree not to:</p>
           <ul className="list-disc pl-6 space-y-2">
             <li>Use the service for any unlawful purpose</li>
             <li>Attempt to gain unauthorized access to our systems</li>
             <li>Interfere with or disrupt the service</li>
             <li>Share your account credentials with others</li>
           </ul>
         </section>
 
         <section className="space-y-4">
           <h2 className="text-xl font-semibold text-foreground">5. Disclaimer</h2>
           <p>
             TipOffHQ is provided "as is" without warranties of any kind. We do not guarantee 
             the accuracy, completeness, or timeliness of any information provided. Users are 
             responsible for ensuring compliance with local laws and regulations regarding 
             sports betting and gambling.
           </p>
         </section>
 
         <section className="space-y-4">
           <h2 className="text-xl font-semibold text-foreground">6. Limitation of Liability</h2>
           <p>
             TipOffHQ shall not be liable for any indirect, incidental, special, consequential, 
             or punitive damages resulting from your use of or inability to use the service.
           </p>
         </section>
 
         <section className="space-y-4">
           <h2 className="text-xl font-semibold text-foreground">7. Changes to Terms</h2>
           <p>
             We reserve the right to modify these terms at any time. Continued use of the service 
             after changes constitutes acceptance of the new terms.
           </p>
         </section>
 
         <section className="space-y-4">
           <h2 className="text-xl font-semibold text-foreground">8. Contact</h2>
           <p>
             For questions about these Terms of Service, please visit our 
             <a href="/contact" className="text-primary hover:underline ml-1">contact page</a>.
           </p>
         </section>
       </div>
     </LegalPageLayout>
   );
 };
 
 export default TermsOfService;