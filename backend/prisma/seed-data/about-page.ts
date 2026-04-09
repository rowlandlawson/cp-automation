import { companySeed } from "./company";

export const aboutPageSeed = {
  certifications: [],
  credibilityPoints: [
    "Founder-led delivery across residential, commercial, and operating environments",
    "Recommendations shaped by real site conditions, not generic catalog selling",
    "Responsive support through commissioning, handover, and post-install use",
  ],
  founderName: "CP Automation Leadership",
  founderRole: "Founder & Lead Automation Specialist",
  longStory:
    "CP Automation was built around a practical belief: critical systems should not depend on constant manual supervision to work well. The business focuses on dependable automation for water control, power continuity, lighting schedules, and custom workflows, with every recommendation shaped around how a site actually operates day to day.",
  metaDescription:
    "Learn how CP Automation approaches founder-led delivery, practical automation design, and dependable support for homes, facilities, and growing businesses.",
  metaTitle: "About CP Automation | Founder-Led Practical Automation",
  mission:
    "To remove repeat manual control work from essential systems and replace it with dependable automation that is easier to manage, easier to trust, and easier to maintain.",
  pageSubtitle:
    "A practical automation partner for homes, facilities, and growing operations that need steadier daily control.",
  pageTitle: "About CP Automation",
  primaryCtaLabel: "Start a Conversation",
  primaryCtaUrl: companySeed.whatsappLink,
  serviceLocations: [
    "Port Harcourt",
    "Abuja",
    "Ibadan",
    "Kano",
    "Nigeria-wide support by arrangement",
  ],
  shortBio:
    "CP Automation is led by a hands-on automation specialist focused on building reliable control systems that reduce manual stress across water, power, lighting, and custom operating routines.",
  stats: [
    { label: "Installations Delivered", value: "120+" },
    { label: "Client Satisfaction", value: "95%" },
    { label: "Years in the Field", value: "7+" },
  ],
  values: [
    "Practical innovation",
    "Reliability first",
    "Clear communication",
    "Long-term client support",
  ],
  vision:
    "To make dependable automation accessible to more homes, facilities, and businesses that need cleaner, steadier, and more confident daily operation.",
  yearsOfExperience: 7,
} as const;
