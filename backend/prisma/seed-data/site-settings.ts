import { companySeed } from "./company";
import { navigationSeed } from "./navigation";

export const siteSettingsSeed = {
  canonicalBaseUrl: "http://localhost:3000",
  companySummary:
    "CP Automation helps property owners, facilities teams, and growing businesses run essential systems with less supervision through dependable automation for water, power, lighting, and custom workflows.",
  footerMotto: "Life Made Easy",
  footerProductLinks: [
    { label: "CP Level Controller", url: "#products" },
    { label: "CP Auto Changeover Switch", url: "#products" },
    { label: "CP Auto Timed Switch", url: "#products" },
    { label: "Custom Automation Solutions", url: "#custom" },
    { label: "Installation & Support", url: "#services" },
  ],
  footerQuickLinks: navigationSeed,
  footerSummary:
    "Built for Nigerian operating conditions, our solutions make daily control simpler, steadier, and easier to trust across homes, estates, offices, and light industrial spaces.",
  footerTagline: "Dependable automation for water, power, lighting, and site control.",
  metaDescription:
    "CP Automation delivers dependable automation for water control, power continuity, lighting schedules, and custom device workflows for homes and businesses in Nigeria.",
  metaTitle: "CP Automation | Dependable Automation for Homes and Facilities",
  siteTagline: "Dependable automation for everyday systems",
  socialLinks: [
    { platform: "Facebook", url: "#", isPlaceholder: true },
    { platform: "Instagram", url: "#", isPlaceholder: true },
    { platform: "LinkedIn", url: "#", isPlaceholder: true },
    { platform: "Twitter", url: "#", isPlaceholder: true },
    { platform: "WhatsApp", url: companySeed.whatsappLink, isPlaceholder: false },
  ],
} as const;
