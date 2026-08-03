"use client";

import { motion } from "framer-motion";
import CountdownTimer from "./CountdownTimer";
import Link from "next/link";
import { useSiteData } from "@/hooks/useSiteData";
import { useWebsiteContent } from "@/hooks/useWebsiteContent";
import { CalendarDays, MapPin, Send, Ticket } from "lucide-react";

const heroStats = [
  { value: "300+", label: "Expert Speakers" },
  { value: "30+", label: "Technical Sessions" },
  { value: "30+", label: "Countries" },
  { value: "2", label: "Live Days" },
];

const HeroSection = () => {
  const { values } = useSiteData();
  const { getSection } = useWebsiteContent();
  const heroTitle = getSection("hero_title");
  const heroSubtitle = getSection("hero_subtitle");

  return (
    <section className="hero-gradient relative flex min-h-screen items-center overflow-hidden pb-12 pt-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_20%,rgba(250,204,21,0.30),transparent_25%),linear-gradient(180deg,transparent,rgba(6,36,29,0.42))]" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background to-transparent" />

      <div className="container relative z-10 mx-auto px-4">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_390px]">
          <div className="max-w-4xl text-left">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-5 inline-flex rounded-md border border-white/20 bg-white/10 px-4 py-2 text-sm font-extrabold uppercase tracking-[0.18em] text-gold-light backdrop-blur"
          >
            {values.hero_eyebrow}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-5 max-w-4xl text-4xl font-black uppercase leading-tight text-white md:text-6xl lg:text-7xl"
          >
            {heroTitle.content ? (
              heroTitle.content
            ) : (
              <>
                {values.hero_title_primary}
                <br />
                <span className="text-gold">{values.hero_title_secondary}</span>
              </>
            )}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-5 flex flex-wrap gap-3"
          >
            <span className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-3 text-sm font-extrabold text-hero-bg shadow-lg">
              <CalendarDays size={18} className="text-teal" />
              {heroSubtitle.content || values.hero_date_line}
            </span>
            <span className="inline-flex items-center gap-2 rounded-md bg-gold px-4 py-3 text-sm font-extrabold text-hero-bg shadow-lg">
              <MapPin size={18} />
              {values.conference_venue}
            </span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-8 max-w-3xl text-base font-medium leading-relaxed text-white/85 md:text-lg"
          >
            {values.hero_theme}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-9 grid grid-cols-2 gap-3 md:grid-cols-4"
          >
            {heroStats.map((item) => (
              <div key={item.label} className="rounded-md border border-white/35 bg-white/95 p-4 shadow-lg shadow-black/10 backdrop-blur-md">
                <p className="font-display text-3xl font-black text-teal">{item.value}</p>
                <p className="mt-1 text-xs font-extrabold uppercase tracking-wide text-card-foreground">{item.label}</p>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col gap-4 sm:flex-row"
          >
            <Link
              href="/abstract-submission"
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-md bg-gold px-7 py-4 text-base font-extrabold text-hero-bg shadow-xl shadow-black/15 transition-all hover:-translate-y-0.5 hover:bg-gold-light"
            >
              <Send size={19} />
              <span>Submit Your Abstract Now</span>
            </Link>
            <Link
              href="/registration"
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-md bg-teal px-7 py-4 text-base font-extrabold text-white shadow-xl shadow-black/15 transition-all hover:-translate-y-0.5 hover:bg-teal/85"
            >
              <Ticket size={20} />
              <span>Register Now</span>
            </Link>
          </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="rounded-md border border-white/20 bg-white/12 p-5 shadow-2xl shadow-black/25 backdrop-blur-md"
          >
            <div className="rounded-md bg-white p-5">
              <p className="mb-4 text-center text-sm font-extrabold uppercase tracking-[0.18em] text-teal">
                Conference Starts In
              </p>
              <CountdownTimer />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
