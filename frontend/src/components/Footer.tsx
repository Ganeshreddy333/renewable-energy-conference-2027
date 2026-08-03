"use client";

import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { useSiteData } from "@/hooks/useSiteData";

const Footer = () => {
  const { values } = useSiteData();

  return (
    <footer className="section-dark border-t border-white/10">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="mb-4 font-display text-xl font-black uppercase text-hero-foreground">
              Renewable Energy <span className="text-gold">2027</span>
            </h3>
            <p className="text-section-dark-foreground/70 text-sm leading-relaxed font-body">
              {values.footer_description}
            </p>
          </div>
          <div>
            <h4 className="mb-4 font-display text-lg font-black uppercase text-hero-foreground">Quick Links</h4>
            <div className="space-y-2">
              {[
                { label: "About Conference", path: "/about" },
                { label: "Abstract Submission", path: "/abstract-submission" },
                { label: "Registration", path: "/registration" },
                { label: "Contact", path: "/information#contact-us" },
              ].map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className="block text-section-dark-foreground/70 hover:text-gold text-sm transition-colors font-body"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="mb-4 font-display text-lg font-black uppercase text-hero-foreground">Contact Info</h4>
            <div className="space-y-3 text-sm text-section-dark-foreground/70 font-body">
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-gold" />
                <span>{values.contact_email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-gold" />
                <span>{values.contact_phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-gold" />
                <span>{values.conference_venue}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-white/10 text-center text-sm text-section-dark-foreground/50 font-body">
          Copyright 2027 Renewable Energy Conference. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
