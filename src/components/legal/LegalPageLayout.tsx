 import { Link } from "react-router-dom";
 import { ArrowLeft } from "lucide-react";
 import logo from "@/assets/logo.png";
 
 interface LegalPageLayoutProps {
   children: React.ReactNode;
   title: string;
 }
 
 export const LegalPageLayout = ({ children, title }: LegalPageLayoutProps) => {
   return (
     <div className="min-h-screen bg-background">
       <header className="border-b border-border">
         <div className="container px-4 md:px-6 py-4">
           <Link to="/">
             <img src={logo} alt="TipOffHQ" className="h-8 w-auto" />
           </Link>
         </div>
       </header>
       <main className="container px-4 md:px-6 py-12">
         <Link 
           to="/" 
           className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
         >
           <ArrowLeft className="w-4 h-4" />
           Back to Home
         </Link>
         <h1 className="text-3xl md:text-4xl font-bold mb-8">{title}</h1>
         <div className="prose prose-invert max-w-none">
           {children}
         </div>
       </main>
     </div>
   );
 };