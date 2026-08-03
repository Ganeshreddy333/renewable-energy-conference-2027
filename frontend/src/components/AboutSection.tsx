import { motion } from "framer-motion";
import { Award, BookOpen, Globe2, GraduationCap, Lightbulb, Mic2, Network } from "lucide-react";
import { splitLines, splitParagraphs, useWebsiteContent } from "@/hooks/useWebsiteContent";

const speakerBenefits = [
  { icon: Globe2, title: "Global Recognition", text: "Present your research to an international audience of experts." },
  { icon: Mic2, title: "Prestigious Speaking Opportunity", text: "Deliver keynote or plenary talks alongside renowned professionals." },
  { icon: Network, title: "International Networking", text: "Connect with top researchers, institutions, and industry leaders." },
  { icon: BookOpen, title: "Publication Opportunities", text: "Proceedings with ISBN and potential journal collaborations." },
  { icon: Award, title: "Awards & Honors", text: "Best Speaker and Best Research Presentation Awards." },
  { icon: GraduationCap, title: "Academic Visibility", text: "Enhance your professional profile and citation impact." },
];

const scopeTopics = [
  "Advanced Solar Energy Systems & PV Technologies",
  "Wind, Hydro & Hybrid Renewable Systems",
  "Hydrogen Energy & Fuel Cell Innovations",
  "Energy Storage, Batteries & Grid Integration",
  "Smart Grids, AI & Digital Energy Systems",
  "Sustainable Energy Policies & Economics",
  "Climate Change Mitigation & Environmental Impact",
  "Green Buildings & Energy Efficiency",
  "Carbon Capture, Utilization & Storage (CCUS)",
  "Emerging Trends in Clean & Renewable Technologies",
];

const AboutSection = () => {
  const { getSection } = useWebsiteContent();
  const about = getSection("home_about", {
    title: "World Conference on Renewable Energy & Sustainable Energy",
    content:
      "The World Conference on Renewable Energy & Sustainable Energy (Renewable Energy - 2027) is a distinguished global forum designed to convene leading scientists, keynote speakers, industry pioneers, and policy leaders in the field of energy and sustainability.\n\nThis high-impact virtual conference aims to showcase cutting-edge research, foster interdisciplinary dialogue, and drive strategic collaborations that accelerate the transition toward a low-carbon and sustainable energy future.\n\nRenewable Energy - 2027 offers an exclusive platform for thought leaders to present transformative ideas, engage with an international audience, and contribute to shaping the global energy agenda.",
  });
  const benefits = getSection("home_speaker_benefits", {
    title: "Why Participate as a Speaker",
    content: speakerBenefits.map((item) => `${item.title} | ${item.text}`).join("\n"),
  });
  const managedBenefits = splitLines(benefits.content).map((line, index) => {
    const [title, ...textParts] = line.split("|");
    return {
      icon: speakerBenefits[index]?.icon ?? Globe2,
      title: title.trim(),
      text: textParts.join("|").trim() || title.trim(),
    };
  });
  const scope = getSection("home_scope_topics", {
    title: "Key Topics",
    content: scopeTopics.join("\n"),
  });

  return (
    <section className="bg-muted/50 py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 max-w-4xl mx-auto">
          <p className="section-kicker mb-2">About the Conference</p>
          <h2 className="text-3xl font-extrabold text-foreground md:text-4xl">
            {about.title}
          </h2>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground">
            {splitParagraphs(about.content).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>

        <div className="mb-14">
          <div className="text-center mb-8">
            <p className="section-kicker mb-2">Speaker Benefits</p>
            <h3 className="text-2xl font-extrabold text-foreground md:text-3xl">{benefits.title}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {managedBenefits.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="conference-card card-hover p-6"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-teal/10">
                  <item.icon className="text-teal" size={24} />
                </div>
                <h4 className="mb-3 text-lg font-extrabold text-card-foreground">{item.title}</h4>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="conference-card p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gold/15">
              <Lightbulb className="text-gold" size={24} />
            </div>
            <div>
              <p className="section-kicker">Scientific Scope</p>
              <h3 className="text-2xl font-extrabold text-card-foreground">{scope.title}</h3>
            </div>
          </div>
          <p className="mb-5 text-muted-foreground">The conference will cover, but is not limited to:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {splitLines(scope.content).map((topic, i) => (
              <motion.div
                key={topic}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
                className="flex gap-3 text-sm text-muted-foreground"
              >
                <span className="text-gold font-bold">•</span>
                <span>{topic}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
