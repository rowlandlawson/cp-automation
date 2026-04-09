import { mediaAssetSeed } from "./media";

export const projectSeed = [
  {
    description:
      "A residential borehole installation configured for dependable water-level control and reduced manual supervision.",
    location: "Port Harcourt",
    metaDescription:
      "Residential borehole automation installation delivered by CP Automation in Port Harcourt.",
    publicId: mediaAssetSeed.projects[0].publicId,
    slug: "residential-borehole-automation",
    title: "Residential Borehole Automation",
    url: mediaAssetSeed.projects[0].url,
  },
  {
    description:
      "A commercial power-control setup designed to simplify source switching and improve day-to-day operating convenience.",
    location: "Abuja",
    metaDescription: "Commercial power management automation by CP Automation in Abuja.",
    publicId: mediaAssetSeed.projects[1].publicId,
    slug: "commercial-power-management",
    title: "Commercial Power Management",
    url: mediaAssetSeed.projects[1].url,
  },
  {
    description:
      "A timed control application for electric loads that need consistent scheduling without manual switching.",
    location: "Ibadan",
    metaDescription: "Timed automation control project delivered by CP Automation in Ibadan.",
    publicId: mediaAssetSeed.projects[2].publicId,
    slug: "timer-control",
    title: "Timer Control Application",
    url: mediaAssetSeed.projects[2].url,
  },
  {
    description:
      "A generator shutdown automation setup that helps reduce manual effort in commercial power management routines.",
    location: "Kano",
    metaDescription: "Generator shutdown automation delivered by CP Automation in Kano.",
    publicId: mediaAssetSeed.projects[3].publicId,
    slug: "generator-auto-shutdown",
    title: "Generator Auto Shutdown",
    url: mediaAssetSeed.projects[3].url,
  },
] as const;
