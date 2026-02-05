 import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
 
 const Accessibility = () => {
   return (
     <LegalPageLayout title="Accessibility">
       <section className="space-y-8">
         <div>
           <h2 className="text-2xl font-semibold mb-4">Our Commitment</h2>
           <p className="text-muted-foreground">
             TipOffHQ is committed to ensuring digital accessibility for people with disabilities. 
             We are continually improving the user experience for everyone and applying the 
             relevant accessibility standards.
           </p>
         </div>
 
         <div>
           <h2 className="text-2xl font-semibold mb-4">Conformance Status</h2>
           <p className="text-muted-foreground">
             We strive to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 at 
             Level AA. These guidelines explain how to make web content more accessible for 
             people with disabilities and more user-friendly for everyone.
           </p>
         </div>
 
         <div>
           <h2 className="text-2xl font-semibold mb-4">Accessibility Features</h2>
           <ul className="list-disc list-inside text-muted-foreground space-y-2">
             <li>Keyboard navigation support throughout the site</li>
             <li>Screen reader compatible content structure</li>
             <li>Sufficient color contrast ratios</li>
             <li>Resizable text without loss of functionality</li>
             <li>Alternative text for images</li>
             <li>Clear and consistent navigation</li>
             <li>Focus indicators for interactive elements</li>
           </ul>
         </div>
 
         <div>
           <h2 className="text-2xl font-semibold mb-4">Feedback</h2>
           <p className="text-muted-foreground mb-4">
             We welcome your feedback on the accessibility of TipOffHQ. If you encounter 
             accessibility barriers or have suggestions for improvement, please let us know:
           </p>
           <div className="bg-secondary/30 rounded-lg p-4">
             <p className="text-sm text-muted-foreground">
               <strong className="text-foreground">Email:</strong> accessibility@tipoffhq.com
             </p>
             <p className="text-sm text-muted-foreground mt-2">
               We aim to respond to accessibility feedback within 5 business days.
             </p>
           </div>
         </div>
 
         <div>
           <h2 className="text-2xl font-semibold mb-4">Ongoing Efforts</h2>
           <p className="text-muted-foreground">
             We are continuously working to improve the accessibility of our platform. This 
             includes regular accessibility audits, training for our team members, and 
             incorporating accessibility considerations into our development process.
           </p>
         </div>
       </section>
     </LegalPageLayout>
   );
 };
 
 export default Accessibility;