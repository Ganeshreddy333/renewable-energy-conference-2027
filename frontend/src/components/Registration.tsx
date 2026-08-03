"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PricingSection from "@/components/PricingSection";
import { useWebsiteContent } from "@/hooks/useWebsiteContent";

const Registration = () => {
  const { getSection } = useWebsiteContent();
  const heading = getSection("registration_heading", { title: "Registration" });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 hero-gradient py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-4 font-display text-4xl font-bold text-gold md:text-5xl">{heading.title}</h1>
          {heading.content ? <p className="mx-auto max-w-2xl text-hero-foreground/80">{heading.content}</p> : null}
        </div>
      </div>
      <PricingSection />
      <Footer />
    </div>
  );
};

export default Registration;
