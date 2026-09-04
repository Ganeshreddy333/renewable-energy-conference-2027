"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import ImportantDates from "@/components/ImportantDates";
import ScheduleSection from "@/components/ScheduleSection";
import SpeakersSection from "@/components/SpeakersSection";
import MediaPartnersSection from "@/components/MediaPartnersSection";
import Footer from "@/components/Footer";

const IndexContent = () => {
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get("payment");
  const paymentMessage =
    paymentStatus === "success"
      ? "Your payment return was received. We are confirming it securely with the payment provider; you will receive an email once confirmed."
      : paymentStatus === "cancel"
        ? "Payment was cancelled. Your registration remains pending."
        : null;

  return (
    <div className="min-h-screen">
      {paymentMessage ? (
        <div className="border-b border-teal/20 bg-teal/10 px-4 py-3 text-center text-sm font-medium text-foreground">
          {paymentMessage}
        </div>
      ) : null}
      <Navbar />
      <HeroSection />
      <AboutSection />
      <ImportantDates />
      <ScheduleSection />
      <SpeakersSection showEmptyState={false} />
      <MediaPartnersSection />
      <Footer />
    </div>
  );
};

const Index = () => (
  <Suspense fallback={<div className="min-h-screen bg-background" /> }>
    <IndexContent />
  </Suspense>
);

export default Index;
