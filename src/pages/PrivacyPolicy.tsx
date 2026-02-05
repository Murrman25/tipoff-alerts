 import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
 
 const PrivacyPolicy = () => {
   return (
     <LegalPageLayout title="Privacy Policy">
       <div className="space-y-8 text-muted-foreground">
         <p className="text-sm">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
         
         <section className="space-y-4">
           <h2 className="text-xl font-semibold text-foreground">1. Introduction</h2>
           <p>
             Welcome to TipOffHQ. We respect your privacy and are committed to protecting your personal data. 
             This privacy policy explains how we collect, use, and safeguard your information when you use our service.
           </p>
         </section>
 
         <section className="space-y-4">
           <h2 className="text-xl font-semibold text-foreground">2. Information We Collect</h2>
           <p>We may collect the following types of information:</p>
           <ul className="list-disc pl-6 space-y-2">
             <li>Account information (email address, display name)</li>
             <li>Usage data (features accessed, alerts created)</li>
             <li>Device information (browser type, operating system)</li>
             <li>Notification preferences (email, SMS, push settings)</li>
           </ul>
         </section>
 
         <section className="space-y-4">
           <h2 className="text-xl font-semibold text-foreground">3. How We Use Your Information</h2>
           <p>We use your information to:</p>
           <ul className="list-disc pl-6 space-y-2">
             <li>Provide and maintain our service</li>
             <li>Send you alerts and notifications you've configured</li>
             <li>Improve and personalize your experience</li>
             <li>Communicate with you about updates and changes</li>
           </ul>
         </section>
 
         <section className="space-y-4">
           <h2 className="text-xl font-semibold text-foreground">4. Data Security</h2>
           <p>
             We implement appropriate security measures to protect your personal information. 
             However, no method of transmission over the internet is 100% secure, and we cannot 
             guarantee absolute security.
           </p>
         </section>
 
         <section className="space-y-4">
           <h2 className="text-xl font-semibold text-foreground">5. Your Rights</h2>
           <p>You have the right to:</p>
           <ul className="list-disc pl-6 space-y-2">
             <li>Access your personal data</li>
             <li>Request correction of your data</li>
             <li>Request deletion of your account</li>
             <li>Opt out of marketing communications</li>
           </ul>
         </section>
 
         <section className="space-y-4">
           <h2 className="text-xl font-semibold text-foreground">6. Contact Us</h2>
           <p>
             If you have any questions about this Privacy Policy, please contact us through our 
             <a href="/contact" className="text-primary hover:underline ml-1">contact page</a>.
           </p>
         </section>
       </div>
     </LegalPageLayout>
   );
 };
 
 export default PrivacyPolicy;