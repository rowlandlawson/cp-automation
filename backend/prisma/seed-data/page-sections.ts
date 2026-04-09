import { companySeed } from "./company";
import { homePageSeed } from "./home-page";
import { navigationSeed } from "./navigation";

export const pageSectionSeed = [
  {
    content: navigationSeed,
    pageType: "GLOBAL",
    sectionKey: "primary-navigation",
    title: "Primary Navigation",
  },
  {
    body: "Practical automation for water, power, lighting, and custom workflows designed around dependable day-to-day use rather than novelty.",
    content: {
      audience_chips: ["Homes and estates", "Commercial facilities", "Custom control builds"],
      focus_cards: [
        {
          body: "Reduce overflow, dry-run risk, and repetitive pump supervision.",
          icon: "bi-droplet-half",
          title: "Water control",
        },
        {
          body: "Simplify changeover routines for sites that depend on steadier uptime.",
          icon: "bi-lightning-charge",
          title: "Power continuity",
        },
        {
          body: "Build around operating constraints that standard off-the-shelf devices do not solve cleanly.",
          icon: "bi-sliders2",
          title: "Custom workflows",
        },
      ],
      visual_panel: {
        body: "Built for Nigerian operating conditions, our systems are planned to reduce manual strain, improve consistency, and keep critical routines moving.",
        heading: "Designed for systems that need reliable control, not daily guesswork.",
        label: "Operational focus",
      },
    },
    pageType: "HOME",
    sectionKey: "hero-highlights",
    subtitle: "Structured hero support content for chips and visual support cards.",
    title: "Hero Highlights",
  },
  {
    content: [
      {
        detail: "Delivered across residential, estate, office, and commercial environments.",
        label: "Installations completed",
        value: "120+",
      },
      {
        detail: "Hands-on problem solving shaped by real site conditions and operating pressure.",
        label: "Years of practical field experience",
        value: "7+",
      },
      {
        detail: "Strong repeat business and referral momentum built on dependable execution.",
        label: "Client satisfaction",
        value: "95%",
      },
      {
        detail: "Support continues through commissioning, handover, and post-install guidance.",
        label: "Support model",
        value: "Responsive",
      },
    ],
    pageType: "HOME",
    sectionKey: "proof-strip",
    subtitle: "Flexible proof cards that reinforce credibility between the hero and About section.",
    title: "Why Decision-Makers Trust CP Automation",
  },
  {
    content: homePageSeed.aboutWhyChoosePoints,
    pageType: "HOME",
    sectionKey: "trust-points",
    subtitle: "Key reasons clients keep choosing CP Automation for installation and support.",
    title: "Trust Points",
  },
  {
    content: [
      {
        body: "Products are positioned around the job they solve, not just the parts inside them.",
        icon: "bi-bullseye",
        title: "Clear use cases",
      },
      {
        body: "We prioritize stable operation, maintainability, and sensible installation choices.",
        icon: "bi-shield-check",
        title: "Reliability first",
      },
      {
        body: "Visitors get a clearer path from problem to product to enquiry.",
        icon: "bi-chat-dots",
        title: "Quote-ready messaging",
      },
    ],
    pageType: "HOME",
    sectionKey: "product-highlights",
    subtitle: "Support cards used ahead of the product grid to sharpen positioning.",
    title: "How the Product Lineup Is Positioned",
  },
  {
    content: [
      {
        body: "We scope the environment properly before recommending installation or build work.",
        icon: "bi-clipboard2-pulse",
        title: "Assessment-led planning",
      },
      {
        body: "Each deployment is tested, commissioned, and explained clearly before handover.",
        icon: "bi-tools",
        title: "Clean delivery",
      },
      {
        body: "Support does not stop at installation; we stay available when reliability matters most.",
        icon: "bi-headset",
        title: "After-sales support",
      },
    ],
    pageType: "HOME",
    sectionKey: "service-highlights",
    subtitle: "Support cards that frame the service section with stronger operational value.",
    title: "How Delivery Is Handled",
  },
  {
    body: "The strongest proof is what changes after installation: fewer avoidable interruptions, less manual supervision, and more confidence in daily operation.",
    content: {
      badge_label: "Verified client feedback",
      chips: ["Homeowners", "Facilities teams", "Repeat referrals"],
    },
    pageType: "HOME",
    sectionKey: "testimonial-highlights",
    subtitle: "Supporting trust copy and chips shown above the testimonial carousel.",
    title: "Proof Built on Results",
  },
  {
    body: "Tell us what still depends on manual effort, where reliability breaks down, or what kind of custom workflow you need. We will help you map the next step clearly.",
    content: [
      {
        body: "Get direction on the right product, installation approach, or custom build path.",
        icon: "bi-compass",
        title: "Practical recommendations",
      },
      {
        body: "Share your constraints early so the solution is shaped around real operating needs.",
        icon: "bi-diagram-3",
        title: "Requirement-led planning",
      },
      {
        body: "Move faster with a clear contact path for consultations, quotes, and custom discussions.",
        icon: "bi-telephone-forward",
        title: "Fast next steps",
      },
    ],
    pageType: "HOME",
    sectionKey: "contact-highlights",
    subtitle: "Contact CTA support content for reassurance, service promises, and response cues.",
    title: "What to Expect When You Reach Out",
  },
  {
    content: [
      "Founder-led scoping before any recommendation is made",
      "Commissioning and handover built into delivery, not treated as an afterthought",
      "Solutions shaped around Nigerian water and power realities",
    ],
    pageType: "ABOUT",
    sectionKey: "credibility-highlights",
    subtitle: "A flexible block for additional proof points, credentials, or operating strengths.",
    title: "Professional Differentiators",
  },
  {
    content: [
      { label: "Phone", value: companySeed.phone },
      { label: "WhatsApp", value: companySeed.whatsapp },
      { label: "Email", value: companySeed.email },
      { label: "Address", value: companySeed.address },
    ],
    pageType: "GLOBAL",
    sectionKey: "contact-methods",
    title: "Contact Methods",
  },
] as const;
