"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { ReactNode } from "react";
import { splitLines, splitParagraphs, useWebsiteContent } from "@/hooks/useWebsiteContent";

const speakerBenefits = [
  "Global Recognition: Present your research to an international audience of experts",
  "Prestigious Speaking Opportunity: Deliver keynote and plenary talks alongside renowned professionals",
  "International Networking: Connect with leading researchers, institutions, and industry leaders",
  "Publication Opportunities: Conference proceedings with ISBN and potential journal collaborations",
  "Awards & Honors: Best Speaker and Best Research Presentation Awards",
  "Academic Visibility: Enhance your professional profile and citation impact",
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

const speakingOpportunities = [
  "Keynote Speakers - Deliver high-impact addresses on emerging trends and global challenges",
  "Plenary Speakers - Present comprehensive insights into advanced research and innovations",
  "Invited Speakers - Share specialised expertise within focused thematic sessions",
  "Oral Presenters - Present peer-reviewed research to an international audience",
];

const leadershipRoles = [
  "Session Chairs / Co-Chairs - Lead and moderate technical sessions",
  "Scientific Committee Members - Contribute to academic quality and the peer-review process",
  "Advisory Board Members - Provide strategic guidance and global perspective",
  "Editorial Board Members (Proceedings/Journals) - Support publication quality and standards",
];

const specialisedContributions = [
  "Workshop & Tutorial Speakers - Conduct in-depth sessions on emerging technologies",
  "Panel Discussion Experts - Engage in high-level discussions on policy, innovation, and industry trends",
  "Industry Speakers - Present real-world applications, case studies, and technological advancements",
  "Young Researcher Forum Speakers - Showcase innovative work from early-career scientists",
];

const conferenceHighlights = [
  "World-Class Keynote & Plenary Addresses",
  "Technical, Parallel & Thematic Sessions",
  "Global Networking & Collaboration Opportunities",
  "Fully Interactive Virtual Conference Platform",
  "E-Certification & ISBN Proceedings",
  "Best Paper, Speaker & Young Researcher Awards",
  "Participation from Leading Global Institutions",
  "Invited Talks by Industry & Academic Experts",
  "Dedicated Session Chairs & Expert Panels",
  "Panel Discussions on Emerging Energy Trends",
  "Interdisciplinary & Multi-Track Sessions",
  "Opportunities for High-Impact Research Visibility",
  "Peer-Reviewed Abstracts & Presentations",
  "Access to Recorded Sessions & On-Demand Content",
  "Digital Networking & Virtual Meetups",
];

const audience = [
  "Professors, Academicians & Leading Researchers",
  "Scientists & Research Professionals in Energy & Sustainability",
  "Keynote Speakers, Plenary Speakers & Invited Experts",
  "Industry Leaders, Engineers & Technology Innovators",
  "Energy Consultants, Analysts & Strategic Advisors",
  "Policy Makers, Government Officials & Regulatory Authorities",
  "Session Chairs, Scientific Committee & Advisory Board Members",
  "Postdoctoral Fellows, PhD Scholars & Graduate Researchers",
  "Corporate Executives, Startups & Clean Energy Entrepreneurs",
  "NGOs, Sustainability Advocates & International Organisations",
  "Investors, Venture Capitalists & Energy Sector Stakeholders",
  "Professionals Seeking Global Collaboration & Research Partnerships.",
];

const BulletList = ({ items, columns = true }: { items: string[]; columns?: boolean }) => (
  <ul className={columns ? "grid grid-cols-1 md:grid-cols-2 gap-3" : "space-y-3"}>
    {items.map((item) => (
      <li key={item} className="flex gap-3 text-muted-foreground font-body leading-relaxed">
        <span className="text-gold font-bold">•</span>
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const Section = ({
  eyebrow,
  title,
  children,
  tinted = false,
}: {
  eyebrow?: string;
  title: string;
  children: ReactNode;
  tinted?: boolean;
}) => (
  <section className={tinted ? "bg-teal/10 py-14" : "bg-background py-14"}>
    <div className="container mx-auto px-4 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_2fr] gap-8 lg:gap-12">
        <div className="self-start rounded-md border border-border bg-card p-6 shadow-sm">
          {eyebrow ? <p className="text-gold text-sm uppercase tracking-wider font-body mb-2">{eyebrow}</p> : null}
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">{title}</h2>
        </div>
        <div className="rounded-md border border-border bg-card p-6 md:p-8 shadow-lg shadow-teal/5">{children}</div>
      </div>
    </div>
  </section>
);

const About = () => {
  const { getSection } = useWebsiteContent();
  const intro = getSection("about_intro", {
    title: "About the Conference",
    content:
      "The World Conference on Renewable Energy & Sustainable Energy (Renewable Energy - 2027) is a distinguished global forum designed to convene leading scientists, keynote speakers, industry pioneers, and policy leaders in the field of energy and sustainability.\n\nThis high-impact virtual conference aims to showcase cutting-edge research, foster interdisciplinary dialogue, and drive strategic collaborations that accelerate the transition toward a low-carbon and sustainable energy future.\n\nRenewable Energy - 2027 offers an exclusive platform for thought leaders to present transformative ideas, engage with an international audience, and contribute to shaping the global energy agenda.",
  });
  const benefits = getSection("about_speaker_benefits", {
    title: "Why Participate as a Speaker",
    content: speakerBenefits.join("\n"),
  });
  const scope = getSection("about_scope", {
    title: "Scientific Scope & Key Topics",
    content: scopeTopics.join("\n"),
  });
  const highlights = getSection("about_highlights", {
    title: "Conference Highlights",
    content: conferenceHighlights.join("\n"),
  });
  const attendees = getSection("about_audience", {
    title: "Who Should Attend",
    content: audience.join("\n"),
  });
  const leadership = getSection("about_leadership", {
    title: "Call for Distinguished Speakers & Scientific Leadership Roles",
    content:
      "The World Conference on Renewable Energy & Sustainable Energy (Renewable Energy - 2027) cordially invites eminent academicians, senior researchers, industry leaders, and policy experts to contribute to the scientific programme in prestigious speaking and leadership capacities.\n\nWe welcome expressions of interest for the following roles:",
  });
  const speaking = getSection("about_speaking_opportunities", {
    title: "Speaking Opportunities",
    content: speakingOpportunities.join("\n"),
  });
  const roles = getSection("about_leadership_roles", {
    title: "Scientific & Leadership Roles",
    content: leadershipRoles.join("\n"),
  });
  const specialised = getSection("about_specialised_contributions", {
    title: "Specialised Contributions",
    content: specialisedContributions.join("\n"),
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 hero-gradient py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <p className="text-gold-light font-body mb-3">Renewable Energy - 2027</p>
          <h1 className="text-4xl md:text-6xl font-bold text-gold font-display mb-5">About the Conference</h1>
          <p className="text-hero-foreground/80 font-body text-lg max-w-3xl">
            World Conference on Renewable Energy & Sustainable Energy
          </p>
        </div>
      </div>

      <Section eyebrow="About" title={intro.title}>
        <div className="space-y-5 text-muted-foreground font-body leading-relaxed">
          {splitParagraphs(intro.content).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </Section>

      <Section eyebrow="Speaker Value" title={benefits.title} tinted>
        <BulletList items={splitLines(benefits.content)} />
      </Section>

      <Section eyebrow="Scientific Scope" title={scope.title}>
        <div className="space-y-5">
          <p className="text-muted-foreground font-body leading-relaxed">The conference will cover, but is not limited to:</p>
          <BulletList items={splitLines(scope.content)} />
        </div>
      </Section>

      <Section eyebrow="Leadership" title={leadership.title} tinted>
        <div className="space-y-8">
          <div className="space-y-5 text-muted-foreground font-body leading-relaxed">
            {splitParagraphs(leadership.content).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
            <div>
              <h3 className="font-display text-xl font-bold text-card-foreground mb-4">{speaking.title}</h3>
              <BulletList items={splitLines(speaking.content)} columns={false} />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-card-foreground mb-4">{roles.title}</h3>
              <BulletList items={splitLines(roles.content)} columns={false} />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-card-foreground mb-4">{specialised.title}</h3>
              <BulletList items={splitLines(specialised.content)} columns={false} />
            </div>
          </div>
        </div>
      </Section>

      <Section eyebrow="Highlights" title={highlights.title}>
        <BulletList items={splitLines(highlights.content)} />
      </Section>

      <Section eyebrow="Audience" title={attendees.title} tinted>
        <div className="space-y-5">
          <p className="text-muted-foreground font-body leading-relaxed">
            The conference is designed for a diverse and distinguished global audience, including:
          </p>
          <BulletList items={splitLines(attendees.content)} />
        </div>
      </Section>

      <Footer />
    </div>
  );
};

export default About;
