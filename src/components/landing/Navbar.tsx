import { Button } from "@/components/ui/button";
import { Zap, Menu, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sectionLinks = [
    { href: "#games", label: "Games" },
    { href: "#alerts", label: "Alerts" },
    { href: "#pricing", label: "Pricing" },
  ];

  const actionLinks = [
    { to: "/alerts/create", label: "Create Alert" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-gradient flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">TipOff</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {/* Sections dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Info
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40 bg-card border-border">
                {sectionLinks.map((link) => (
                  <DropdownMenuItem key={link.href} asChild>
                    <a
                      href={link.href}
                      className="cursor-pointer"
                    >
                      {link.label}
                    </a>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Action links */}
            <Link
              to="/games"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Browse Games
            </Link>
            <Link
              to="/alerts"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              My Alerts
            </Link>
            <Link
              to="/alerts/create"
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Create Alert
            </Link>
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
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                On this page
              </span>
              {sectionLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-4 border-t border-border space-y-2">
                <Link
                  to="/games"
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Browse Games
                </Link>
                <Link
                  to="/alerts"
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Alerts
                </Link>
                <Link
                  to="/alerts/create"
                  className="block text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Create Alert →
                </Link>
              </div>
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
