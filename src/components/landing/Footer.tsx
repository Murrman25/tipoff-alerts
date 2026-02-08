 import { Link } from "react-router-dom";
 import logo from "@/assets/logo.png";

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-charcoal-deep">
      <div className="container px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo and tagline */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
               <img src={logo} alt="TipOffHQ" className="h-8 w-auto logo-blend" />
            </div>
            <p className="text-muted-foreground text-sm max-w-md">
              Real-time sports alerts platform. Track line movements, game states, 
              and odds changes across all major sports.
            </p>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/accessibility" className="hover:text-primary transition-colors">Accessibility</Link></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
               <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
               <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
               <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>

        {/* Disclaimer and copyright */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="bg-secondary/50 rounded-lg p-4 mb-6">
            <p className="text-xs text-muted-foreground">
               <strong className="text-foreground">Disclaimer:</strong> TipOffHQ is an informational tool only. 
              We do not facilitate, encourage, or endorse gambling. Users are responsible for ensuring 
              compliance with local laws and regulations. If you or someone you know has a gambling problem, 
              please call the National Problem Gambling Helpline at 1-800-522-4700.
            </p>
          </div>
          <p className="text-center text-sm text-muted-foreground">
             © {new Date().getFullYear()} TipOffHQ. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
