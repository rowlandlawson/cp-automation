import { companySeed } from "./company";

export const homePageSeed = {
  aboutMissionBody:
    "We design products and deliver installation services that reduce repetitive manual work, improve operating consistency, and give clients more confidence in essential day-to-day systems.",
  aboutMissionTitle: "Our Mission",
  aboutSummaryCtaLabel: "Read Our Story",
  aboutSummaryCtaUrl: "/about",
  aboutSummarySubtitle:
    "CP Automation combines site-aware engineering, clean commissioning, and responsive support to make control systems easier to run every day.",
  aboutSummaryTitle: "Founder-led delivery for systems that need dependable control",
  aboutWhyChoosePoints: [
    "Recommendations shaped around real operating conditions, not generic assumptions",
    "120+ installations delivered across homes, facilities, and working sites",
    "7+ years of practical field experience in everyday automation challenges",
    "95% client satisfaction supported by repeat business and referrals",
    "Clear handover and responsive after-sales support when reliability matters",
  ],
  aboutWhyChooseTitle: "Why clients trust CP Automation",
  contactCtaActions: [
    { label: "Book a Consultation", url: companySeed.whatsappLink },
    {
      label: "Request a Custom Build",
      url: "https://wa.me/2348033417657?text=Hi,%20I%20need%20a%20custom%20automation%20solution",
    },
  ],
  contactCtaBody:
    "Tell us where control breaks down, what still needs constant supervision, or what kind of custom workflow you need, and we’ll recommend the clearest next step.",
  contactCtaTitle: "Need a system that runs with less manual attention?",
  customSolutionsCtaLabel: "Discuss a Custom Solution",
  customSolutionsCtaUrl:
    "https://wa.me/2348033417657?text=Hi,%20I%20need%20a%20custom%20automation%20solution",
  customSolutionsDevelopmentBody:
    "From controller design to deployment planning, we build custom automation solutions for operating problems that standard devices do not solve cleanly enough.",
  customSolutionsDevelopmentTitle: "Custom automation development",
  customSolutionsFeatures: [
    "Custom circuit design and controller logic",
    "Automation workflows for unique site conditions",
    "Integration with existing electrical systems",
    "Prototype testing before rollout",
    "Support for small-batch deployment",
  ],
  customSolutionsProcessSteps: [
    {
      body: "We learn how the current workflow operates, where it fails, and what success should look like.",
      step: 1,
      title: "Discovery",
    },
    {
      body: "We recommend the right architecture, commercial scope, and implementation path for the job.",
      step: 2,
      title: "Design & Proposal",
    },
    {
      body: "We build, test, and refine the automation logic before installation.",
      step: 3,
      title: "Build & Validate",
    },
    {
      body: "We install, commission, and support the finished solution so it performs reliably in use.",
      step: 4,
      title: "Deploy & Support",
    },
  ],
  customSolutionsProcessTitle: "How custom projects move from problem to deployment",
  customSolutionsSubtitle:
    "When your environment needs a tailored controller, a custom automation workflow, or a more precise installation path, we design around the actual operating requirement.",
  customSolutionsTitle: "Custom automation for site-specific operating demands",
  heroEyebrow: "Dependable Automation for Critical Everyday Systems",
  heroHeading:
    "Reduce manual supervision across water, power, lighting, and custom control workflows.",
  heroPrimaryCtaLabel: "Book a Consultation",
  heroPrimaryCtaUrl: companySeed.whatsappLink,
  heroSecondaryCtaLabel: "See Solutions",
  heroSecondaryCtaUrl: "#products",
  heroStats: [
    { label: "Installations Delivered", value: 120 },
    { label: "Client Satisfaction", value: 95 },
    { label: "Years in the Field", value: 7 },
  ],
  heroSubheading:
    "CP Automation designs and installs practical control systems for homes, estates, facilities, and growing businesses that need steadier day-to-day operation.",
  metaDescription:
    "Explore practical automation for water control, power continuity, lighting schedules, and custom site workflows from CP Automation.",
  metaTitle: "CP Automation | Dependable Automation for Everyday Systems",
  productsSectionIntro:
    "Choose dependable control products built around the operational problems they solve, with clearer paths to quotation and installation.",
  productsSectionTitle: "Products built around real operating problems",
  projectsSectionIntro:
    "See how recent installations improved control, reduced manual intervention, and created steadier day-to-day operation.",
  projectsSectionTitle: "Selected installations across homes and operating sites",
  servicesSectionIntro:
    "From assessment and installation to troubleshooting and custom builds, we support the full lifecycle of your automation setup.",
  servicesSectionTitle: "Service delivery that holds up beyond installation",
  testimonialsSectionIntro:
    "The clearest proof is what gets easier after commissioning: fewer interruptions, less manual checking, and more confidence in daily use.",
  testimonialsSectionTitle: "What changes after the right automation is installed",
} as const;
