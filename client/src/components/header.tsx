import { Link, useLocation } from "wouter";
import { Sun, Moon, Search, Menu, X } from "lucide-react";
import { useState } from "react";
import { useTheme } from "./theme-provider";
import { Button } from "@/components/ui/button";

function ScifiOnlyLogo() {
  return (
    <svg
      width="140"
      height="32"
      viewBox="0 0 140 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="SciFi Only"
    >
      {/* Hexagon accent mark */}
      <polygon
        points="10,4 18,4 22,11 18,18 10,18 6,11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-primary"
      />
      <polygon
        points="10,7 16,7 19,11 16,15 10,15 7,11"
        fill="hsl(var(--primary))"
        opacity="0.25"
      />
      {/* Signal bars inside hex */}
      <line x1="10" y1="13" x2="10" y2="11" stroke="hsl(var(--primary))" strokeWidth="1.5" />
      <line x1="13" y1="13" x2="13" y2="9.5" stroke="hsl(var(--primary))" strokeWidth="1.5" />
      <line x1="16" y1="13" x2="16" y2="8" stroke="hsl(var(--primary))" strokeWidth="1.5" />

      {/* Text: SCIFI */}
      <text
        x="26"
        y="15"
        fontFamily="'Exo 2', 'Inter', sans-serif"
        fontWeight="700"
        fontSize="13"
        letterSpacing="2"
        fill="hsl(var(--foreground))"
      >
        SCIFI
      </text>

      {/* Divider line */}
      <line x1="26" y1="18" x2="78" y2="18" stroke="hsl(var(--primary))" strokeWidth="0.75" opacity="0.6" />

      {/* Text: ONLY */}
      <text
        x="26"
        y="28"
        fontFamily="'Exo 2', 'Inter', sans-serif"
        fontWeight="300"
        fontSize="10"
        letterSpacing="4"
        fill="hsl(var(--primary))"
      >
        ONLY
      </text>
    </svg>
  );
}

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "/browse", label: "Browse" },
  ];

  const isActive = (href: string) => location === href;

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border/50 bg-background/90 backdrop-blur-md"
      data-testid="header"
    >
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center flex-shrink-0">
          <span className="text-primary" data-testid="logo">
            <ScifiOnlyLogo />
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1" data-testid="nav-desktop">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Button
                variant="ghost"
                size="sm"
                className={`text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
                data-testid={`nav-link-${link.label.toLowerCase()}`}
              >
                {link.label}
              </Button>
            </Link>
          ))}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            data-testid="button-theme-toggle"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            data-testid="button-mobile-menu"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden absolute top-14 left-0 right-0 bg-background/95 backdrop-blur-md border-b border-border/50 px-4 py-3 flex flex-col gap-1"
          data-testid="nav-mobile"
        >
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Button
                variant="ghost"
                className={`w-full justify-start text-sm ${
                  isActive(link.href)
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground"
                }`}
                onClick={() => setMobileOpen(false)}
                data-testid={`nav-mobile-link-${link.label.toLowerCase()}`}
              >
                {link.label}
              </Button>
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
