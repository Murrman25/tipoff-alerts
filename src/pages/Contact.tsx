 import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
 import { Mail, MessageSquare } from "lucide-react";
 
 const Contact = () => {
   return (
     <LegalPageLayout title="Contact Us">
       <div className="space-y-8 text-muted-foreground">
         <p className="text-lg">
           Have questions, feedback, or need support? We'd love to hear from you.
         </p>
 
         <div className="grid gap-6 md:grid-cols-2">
           <div className="p-6 rounded-lg border border-border bg-card">
             <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                 <Mail className="w-5 h-5 text-primary" />
               </div>
               <h2 className="text-lg font-semibold text-foreground">Email Support</h2>
             </div>
             <p className="mb-4">
               For general inquiries and support, reach out to us via email.
             </p>
             <a 
               href="mailto:support@tipoffhq.com" 
               className="text-primary hover:underline font-medium"
             >
               support@tipoffhq.com
             </a>
           </div>
 
           <div className="p-6 rounded-lg border border-border bg-card">
             <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                 <MessageSquare className="w-5 h-5 text-primary" />
               </div>
               <h2 className="text-lg font-semibold text-foreground">Feedback</h2>
             </div>
             <p className="mb-4">
               Have ideas for new features or improvements? We're always listening.
             </p>
             <a 
               href="mailto:feedback@tipoffhq.com" 
               className="text-primary hover:underline font-medium"
             >
               feedback@tipoffhq.com
             </a>
           </div>
         </div>
 
         <section className="space-y-4 pt-8 border-t border-border">
           <h2 className="text-xl font-semibold text-foreground">Response Times</h2>
           <p>
             We typically respond to all inquiries within 24-48 business hours. 
             For urgent matters, please indicate so in your subject line.
           </p>
         </section>
 
         <section className="space-y-4">
           <h2 className="text-xl font-semibold text-foreground">Before You Contact Us</h2>
           <p>
             You may find answers to common questions in our documentation. 
             Please also review our{" "}
             <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
             {" "}and{" "}
             <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
             {" "}for information about how we handle your data and our service policies.
           </p>
         </section>
       </div>
     </LegalPageLayout>
   );
 };
 
 export default Contact;