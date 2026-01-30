import { Button } from "@/components/ui/button";
import { Zap, Menu } from "lucide-react";
import { useState } from "react";

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-gradient flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">TipOff</span>
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#games" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Games
            </a>
            <a href="#alerts" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Alerts
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
          </div>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
            <Button size="sm" className="bg-amber-gradient text-primary-foreground hover:opacity-90">
              Sign up
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              <a href="#games" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Games
              </a>
              <a href="#alerts" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Alerts
              </a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </a>
              <div className="flex gap-4 pt-4 border-t border-border">
                <Button variant="ghost" size="sm" className="flex-1">
                  Log in
                </Button>
                <Button size="sm" className="flex-1 bg-amber-gradient text-primary-foreground hover:opacity-90">
                  Sign up
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
