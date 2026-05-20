"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/neon-button";

const navLinks = [
  { label: "Leistungen", href: "#leistungen" },
  { label: "Über uns",   href: "#ueber-uns" },
  { label: "Preise",     href: "#preise" },
  { label: "Kontakt",    href: "#kontakt" },
];

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white border-b border-[#DBEAFE] shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="container-wide">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
              style={{ backgroundColor: "#2563EB" }}
            >
              <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                <path d="M3 10L8 5L13 10L18 5"  stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 15L8 10L13 15L18 10" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.5" />
              </svg>
            </div>
            <span
              className={`font-heading font-extrabold text-xl tracking-tight whitespace-nowrap transition-colors duration-300 ${
                scrolled ? "text-slate-900" : "text-white"
              }`}
            >
              Flowturai
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`text-sm font-medium transition-colors duration-200 hover:text-blue-500 ${
                  scrolled ? "text-slate-600" : "text-white/90"
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex">
            <Button
              variant="solid"
              size="sm"
              onClick={() => document.getElementById("kontakt")?.scrollIntoView({ behavior: "smooth" })}
              className={scrolled ? "" : "border-white/20"}
            >
              Beratung anfragen
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            className={`md:hidden p-2 rounded-lg transition-colors ${
              scrolled ? "text-slate-600 hover:bg-gray-100" : "text-white hover:bg-white/10"
            }`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Menü schließen" : "Menü öffnen"}
          >
            <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
              {menuOpen ? (
                <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              ) : (
                <>
                  <path d="M3 7H21"  stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M3 17H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-[#DBEAFE] bg-white px-4 pb-5 pt-2">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="block py-3 text-sm font-medium text-slate-700 hover:text-blue-600 border-b border-gray-50 last:border-0 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <Button
            variant="solid"
            size="default"
            className="mt-4 w-full"
            onClick={() => { setMenuOpen(false); document.getElementById("kontakt")?.scrollIntoView({ behavior: "smooth" }); }}
          >
            Beratung anfragen
          </Button>
        </div>
      )}
    </nav>
  );
}
