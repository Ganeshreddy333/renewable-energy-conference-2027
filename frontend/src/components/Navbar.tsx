"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Zap } from "lucide-react";
import { useWebsiteContent } from "@/hooks/useWebsiteContent";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "About Conference", path: "/about" },
  { label: "Speakers", path: "/speakers" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { getSection } = useWebsiteContent();
  const brand = getSection("site_brand", { title: "Renewable Energy", content: "Conference 2027" });

  const scrollHomeToTop = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname !== "/") return;

    // Next.js does not navigate when the current URL is already "/".
    // Handle that case explicitly so Home always returns the visitor to the top.
    event.preventDefault();
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-hero-bg/95 shadow-lg shadow-black/10 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between md:h-20">
          <Link href="/" className="flex items-center gap-3">
            <div className="gold-gradient flex h-11 w-11 items-center justify-center rounded-md text-hero-bg shadow-md shadow-gold/25">
              <Zap size={24} fill="currentColor" />
            </div>
            <span className="hidden font-display text-base font-black uppercase leading-tight text-hero-foreground sm:block">
              {brand.title}
              <span className="block text-xs font-extrabold tracking-[0.18em] text-gold">{brand.content}</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                onClick={link.path === "/" ? scrollHomeToTop : undefined}
                className={`rounded-md px-3 py-2 text-xs font-extrabold uppercase tracking-wide transition-colors ${
                  pathname === link.path
                    ? "text-gold"
                    : "text-hero-foreground/80 hover:text-gold"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/information"
              className={`rounded-md px-3 py-2 text-xs font-extrabold uppercase tracking-wide transition-colors ${
                pathname === "/information"
                  ? "text-gold"
                  : "text-hero-foreground/80 hover:text-gold"
              }`}
            >
              Information
            </Link>
            <Link
              href="/abstract-submission"
              className={`rounded-md px-3 py-2 text-xs font-extrabold uppercase tracking-wide transition-colors ${
                pathname === "/abstract-submission"
                  ? "text-gold"
                  : "text-hero-foreground/80 hover:text-gold"
              }`}
            >
              Abstract Submission
            </Link>
            <Link
              href="/registration"
              className={`rounded-md px-3 py-2 text-xs font-extrabold uppercase tracking-wide transition-colors ${
                pathname === "/registration"
                  ? "text-gold"
                  : "text-hero-foreground/80 hover:text-gold"
              }`}
            >
              Registration
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-md p-2 text-hero-foreground hover:bg-white/10 lg:hidden"
            aria-label="Toggle navigation"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isOpen && (
          <div className="lg:hidden pb-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                onClick={(event) => {
                  setIsOpen(false);
                  if (link.path === "/") scrollHomeToTop(event);
                }}
                className={`block rounded-md px-3 py-2 text-sm font-bold uppercase tracking-wide transition-colors ${
                  pathname === link.path
                    ? "text-gold bg-white/5"
                    : "text-hero-foreground/80 hover:text-gold hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/information"
              onClick={() => setIsOpen(false)}
              className={`block rounded-md px-3 py-2 text-sm font-bold uppercase tracking-wide transition-colors ${
                pathname === "/information"
                  ? "text-gold bg-white/5"
                  : "text-hero-foreground/80 hover:text-gold hover:bg-white/5"
              }`}
            >
              Information
            </Link>
            <Link
              href="/abstract-submission"
              onClick={() => setIsOpen(false)}
              className={`block rounded-md px-3 py-2 text-sm font-bold uppercase tracking-wide transition-colors ${
                pathname === "/abstract-submission"
                  ? "text-gold bg-white/5"
                  : "text-hero-foreground/80 hover:text-gold hover:bg-white/5"
              }`}
            >
              Abstract Submission
            </Link>
            <Link
              href="/registration"
              onClick={() => setIsOpen(false)}
              className={`block rounded-md px-3 py-2 text-sm font-bold uppercase tracking-wide transition-colors ${
                pathname === "/registration"
                  ? "text-gold bg-white/5"
                  : "text-hero-foreground/80 hover:text-gold hover:bg-white/5"
              }`}
            >
              Registration
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
