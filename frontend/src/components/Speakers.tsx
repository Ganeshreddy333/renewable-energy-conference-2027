"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SpeakersSection from "@/components/SpeakersSection";
import { splitLines, splitParagraphs, useWebsiteContent } from "@/hooks/useWebsiteContent";

const Speakers = () => {
  const { getSection } = useWebsiteContent();
  const intro = getSection("speakers_intro", {
    title: "Where Ideas Meet Impact",
    content:
      "The Scientific Committee of Renewable Energy - 2027 comprises a globally distinguished panel of leading academicians, researchers, and industry experts dedicated to advancing innovation in renewable and sustainable energy.",
  });
  const overview = getSection("speakers_overview", {
    title: "Speakers",
    content:
      "At Renewable Energy - 2027, our speakers are not just presenters. They are the minds shaping the future of global energy. From renowned professors and pioneering researchers to visionary industry leaders, each speaker brings a story of innovation, discovery, and real-world impact.",
  });
  const platform = getSection("speakers_platform", {
    title: "A Platform for Thought Leaders",
    content:
      "Every speaker at this conference is carefully selected for their contribution to science, technology, and sustainability. Here, you will experience:\n\nResearch that challenges conventional thinking\nIdeas that inspire global change\nConversations that lead to collaboration",
  });
  const speakerTypes = [
    getSection("speakers_plenary", {
      title: "Plenary Speakers",
      content:
        "Our plenary speakers are globally respected leaders whose work has influenced the direction of renewable energy research and policy.",
    }),
    getSection("speakers_keynote", {
      title: "Keynote Speakers",
      content:
        "Our keynote speakers bring powerful insights into where energy innovation is heading and how sustainability is evolving globally.",
    }),
    getSection("speakers_invited", {
      title: "Invited Speakers",
      content:
        "Our invited speakers bridge the gap between research and real-world implementation through practical applications and industry-driven innovation.",
    }),
  ];
  const closing = getSection("speakers_closing", {
    title: "More Than Just Talks",
    content:
      "Being part of the speaker sessions means engaging with ideas that matter, connecting with global experts, exploring collaborations beyond borders, and being part of conversations that shape the future.",
  });
  const platformParts = splitParagraphs(platform.content);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-20 hero-gradient py-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gold text-sm uppercase tracking-wider font-body mb-2">Scientific Committee</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white font-display mb-4">{intro.title}</h1>
          <p className="text-hero-foreground/80 font-body max-w-3xl mx-auto leading-8">{intro.content}</p>
        </div>
      </div>

      <section className="bg-gradient-to-b from-background via-teal/5 to-background py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="rounded-md border border-border bg-card p-5 shadow-lg shadow-teal/5 md:p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gold font-display mb-4">{overview.title}</h2>
                <h3 className="text-xl font-semibold text-gold mb-3">{intro.title}</h3>
                <p className="text-muted-foreground leading-7">{overview.content}</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gold mb-3">{platform.title}</h3>
                <p className="text-muted-foreground leading-7 mb-4">{platformParts[0]}</p>
                <ul className="space-y-3 text-muted-foreground list-disc list-inside leading-7">
                  {splitLines(platformParts.slice(1).join("\n")).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="grid items-start gap-5 md:grid-cols-3">
                {speakerTypes.map((item, index) => (
                  <div
                    key={item.title}
                    className={`rounded-md border p-4 shadow-sm ${
                      index === 1 ? "border-teal/40 bg-teal/10" : "border-gold/40 bg-gold/10"
                    }`}
                  >
                    <h4 className={`text-lg font-semibold mb-2 ${index === 1 ? "text-teal" : "text-gold"}`}>
                      {item.title}
                    </h4>
                    <p className="text-muted-foreground leading-7">{item.content}</p>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gold mb-3">{closing.title}</h3>
                <p className="text-muted-foreground leading-7">{closing.content}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SpeakersSection />
      <Footer />
    </div>
  );
};

export default Speakers;
