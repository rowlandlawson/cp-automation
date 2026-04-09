function buildAdminUser(overrides = {}) {
  return {
    email: "admin@cpautomation.test",
    id: 1,
    role: "admin",
    username: "phase3-admin",
    ...overrides,
  };
}

function buildAuthResponse(overrides = {}) {
  const user = buildAdminUser(overrides.user || {});

  return {
    token: overrides.token || "phase3-session-token",
    user,
  };
}

function buildSiteSettings(overrides = {}) {
  return {
    address: "Port Harcourt, Nigeria",
    canonical_base_url: "https://cpautomation.example/",
    company_name: "CP Automation",
    company_summary:
      "Practical automation for water, power, and control workflows that cannot rely on constant manual supervision.",
    email: "info@cpautomation.example",
    footer_motto: "Dependable automation",
    footer_product_links: [
      { label: "Pump Control", url: "/#products" },
      { label: "Custom Builds", url: "/#custom" },
    ],
    footer_quick_links: [
      { label: "Home", url: "/#home" },
      { label: "About", url: "/about" },
      { label: "Projects", url: "/projects" },
      { label: "Contact", url: "/#contact" },
    ],
    footer_summary:
      "Built for demanding day-to-day operating conditions across homes, facilities, and light commercial sites.",
    footer_tagline: "Less manual effort. More dependable control.",
    logo_asset: null,
    meta_description:
      "CP Automation helps teams reduce manual supervision across water, power, lighting, and custom workflows.",
    meta_title: "CP Automation | Operationally Dependable Automation",
    phone: "+234 803 341 7657",
    site_tagline: "Automation for critical daily operations",
    social_links: [{ platform: "whatsapp", url: "https://wa.me/2348033417657" }],
    whatsapp_link: "https://wa.me/2348033417657",
    whatsapp_number: "2348033417657",
    ...overrides,
  };
}

function buildHomePage(overrides = {}) {
  return {
    about_mission_body:
      "We replace repetitive manual control with dependable automation that is easier to operate and easier to trust.",
    about_mission_title: "Our mission",
    about_summary_cta_label: "Meet the founder",
    about_summary_cta_url: "/about",
    about_summary_subtitle:
      "Founder-led delivery, practical commissioning, and cleaner handover for systems that need dependable daily control.",
    about_summary_title: "Founder-led delivery for real operating pressure",
    about_why_choose_points: [
      "Recommendations shaped by real site conditions",
      "Clear commissioning and handover",
      "Responsive post-install support",
    ],
    about_why_choose_title: "Why teams keep choosing CP Automation",
    contact_cta_actions: [{ label: "Book a consultation", url: "https://wa.me/2348033417657" }],
    contact_cta_body:
      "Tell us what still depends on manual effort and we will help you map the clearest next step.",
    contact_cta_title: "Need a more dependable control workflow?",
    custom_solutions_cta_label: "Discuss a custom build",
    custom_solutions_cta_url: "https://wa.me/2348033417657?text=custom-build",
    custom_solutions_development_body:
      "We design around the actual operating problem, not a generic product list.",
    custom_solutions_development_title: "Custom automation development",
    custom_solutions_features: [
      "Controller design",
      "Workflow-specific automation",
      "Deployment planning",
    ],
    custom_solutions_process_steps: [
      { body: "Understand the workflow and the operational risk.", step: 1, title: "Discovery" },
      { body: "Recommend the right control path and scope.", step: 2, title: "Design" },
    ],
    custom_solutions_process_title: "From site problem to deployment",
    custom_solutions_subtitle:
      "Tailored automation for environments that cannot rely on guesswork or repeated manual intervention.",
    custom_solutions_title: "Custom automation for site-specific demands",
    hero_eyebrow: "Operationally dependable automation",
    hero_heading: "Automation that keeps critical systems running with less manual effort.",
    hero_primary_cta_label: "Book a site review",
    hero_primary_cta_url: "https://wa.me/2348033417657",
    hero_secondary_cta_label: "See solutions",
    hero_secondary_cta_url: "/products",
    hero_stats: [
      { label: "Installations", value: 200 },
      { label: "Years in the field", value: 9 },
      { label: "Repeat referrals", value: 80 },
    ],
    hero_subheading:
      "We help homes, facilities, and operations teams reduce manual supervision across water, power, lighting, and custom control workflows.",
    hero_visual_asset: null,
    is_published: true,
    meta_description:
      "Explore operationally dependable automation for water, power, and custom workflow control.",
    meta_title: "Operationally Dependable Automation | CP Automation",
    products_section_intro:
      "Products and solutions positioned around the operational problems they solve.",
    products_section_title: "Products built for real operating conditions",
    projects_section_intro:
      "Recent deployments across homes, facilities, and commercial sites that needed steadier daily control.",
    projects_section_title: "Recent deployment work",
    services_section_intro:
      "Assessment, installation, commissioning, troubleshooting, and tailored delivery.",
    services_section_title: "Installation and support that hold up in use",
    testimonials_section_intro:
      "The clearest proof is what gets easier after commissioning: fewer interruptions and less manual checking.",
    testimonials_section_title: "What changes after smarter control is installed",
    ...overrides,
  };
}

function buildAboutPage(overrides = {}) {
  return {
    certifications: ["Certified Control Systems Installer"],
    credibility_points: [
      "Founder-led technical scoping before recommendations are made",
      "Commissioning and handover built into delivery",
      "Support shaped around Nigerian operating conditions",
    ],
    founder_name: "Rita Okafor",
    founder_role: "Founder & Lead Automation Specialist",
    is_published: true,
    long_story:
      "CP Automation was built to reduce avoidable manual strain around water, power, lighting, and workflow control in environments that need dependable daily operation.",
    meta_description:
      "Meet the founder behind CP Automation and learn how the business approaches dependable, practical automation delivery.",
    meta_title: "About CP Automation | Founder-Led Automation Delivery",
    mission:
      "To replace repetitive manual control work with dependable automation that is easier to run and easier to trust.",
    og_image_asset: null,
    page_subtitle:
      "A founder-led automation partner for homes, facilities, and operations teams that need steadier daily control.",
    page_title: "About CP Automation",
    portrait_asset: null,
    primary_cta_label: "Start a conversation",
    primary_cta_url: "https://wa.me/2348033417657",
    service_locations: ["Port Harcourt", "Abuja", "Ibadan"],
    short_bio:
      "Rita leads CP Automation with a hands-on approach to control design, commissioning, and dependable client support.",
    stats: [
      { label: "Installations delivered", value: "200+" },
      { label: "Years in the field", value: "9+" },
    ],
    values: ["Reliability first", "Practical engineering", "Clear handover"],
    vision:
      "To make dependable automation more accessible to teams that need cleaner day-to-day operations.",
    years_of_experience: 9,
    ...overrides,
  };
}

function buildPublicContent(overrides = {}) {
  const base = {
    aboutPage: buildAboutPage(),
    homePage: buildHomePage(),
    pageSections: {
      about: {
        "credibility-highlights": {
          content: [
            "Founder-led scoping before technical recommendations",
            "Commissioning and handover built into delivery",
            "Support aligned to real operating conditions",
          ],
          page_type: "ABOUT",
          section_key: "credibility-highlights",
          subtitle: "Structured differentiators used in the About section.",
          title: "Professional differentiators",
        },
      },
      global: {
        "contact-methods": {
          content: [
            { label: "Phone", value: "+234 803 341 7657" },
            { label: "Email", value: "info@cpautomation.example" },
          ],
          page_type: "GLOBAL",
          section_key: "contact-methods",
          title: "Contact methods",
        },
      },
      home: {
        "contact-highlights": {
          body: "Expect a practical recommendation, a clear scope, and a fast next-step path.",
          content: [
            {
              body: "Clear next-step guidance based on the operating problem.",
              icon: "bi-compass",
              title: "Practical recommendations",
            },
          ],
          page_type: "HOME",
          section_key: "contact-highlights",
          title: "What to expect when you reach out",
        },
        "hero-highlights": {
          content: {
            audience_chips: ["Homes and estates", "Facilities teams", "Custom builds"],
            focus_cards: [
              {
                body: "Reduce overflow risk and repeated pump checks.",
                icon: "bi-droplet-half",
                title: "Water control",
              },
              {
                body: "Simplify source switching and uptime planning.",
                icon: "bi-lightning-charge",
                title: "Power continuity",
              },
            ],
          },
          page_type: "HOME",
          section_key: "hero-highlights",
          title: "Hero highlights",
        },
        "product-highlights": {
          content: [
            {
              body: "Products are positioned around the real job to be done.",
              icon: "bi-bullseye",
              title: "Clear use cases",
            },
          ],
          page_type: "HOME",
          section_key: "product-highlights",
          title: "How the product lineup is positioned",
        },
        "proof-strip": {
          content: [
            {
              detail: "Delivered across residential and commercial environments.",
              label: "Installations delivered",
              value: "200+",
            },
            {
              detail: "Hands-on engineering and commissioning experience.",
              label: "Years in the field",
              value: "9+",
            },
          ],
          page_type: "HOME",
          section_key: "proof-strip",
          subtitle: "Proof that reinforces the first impression.",
          title: "Why operations teams choose CP Automation",
        },
        "service-highlights": {
          content: [
            {
              body: "Scope the environment properly before recommending installation work.",
              icon: "bi-clipboard2-pulse",
              title: "Assessment-led planning",
            },
          ],
          page_type: "HOME",
          section_key: "service-highlights",
          title: "How delivery is handled",
        },
        "testimonial-highlights": {
          body: "Clients judge the work by what gets easier after commissioning.",
          content: {
            badge_label: "Verified feedback",
            chips: ["Homeowners", "Facilities teams"],
          },
          page_type: "HOME",
          section_key: "testimonial-highlights",
          title: "Proof built on results",
        },
      },
    },
    products: [
      {
        cta_label: "Get a quote",
        cta_url: "https://example.com/pump-control",
        description: "Cuts pump overflow risk and repeated manual checks.",
        feature_list: ["Automatic start and stop", "Less manual supervision"],
        is_published: true,
        name: "Pump Control Panel",
        order_index: 1,
        slug: "pump-control-panel",
      },
      {
        cta_label: "Draft only",
        cta_url: "https://example.com/draft-product",
        description: "This draft item should not appear publicly.",
        feature_list: ["Hidden feature"],
        is_published: false,
        name: "Hidden Draft Product",
        order_index: 2,
        slug: "hidden-draft-product",
      },
    ],
    projects: [
      {
        description: "A power continuity deployment for a commercial site.",
        image_asset: null,
        is_published: true,
        location: "Abuja",
        order_index: 1,
        slug: "commercial-power-control",
        title: "Commercial Power Control",
      },
    ],
    services: [
      {
        description: "Installation, commissioning, and clear handover for live environments.",
        highlight_list: ["Installation planning", "Commissioning", "Support"],
        icon_name: "tools",
        is_published: true,
        name: "Installation & Commissioning",
        order_index: 1,
        slug: "installation-commissioning",
      },
    ],
    siteSettings: buildSiteSettings(),
    testimonials: [
      {
        author: "Operations Manager",
        author_role: "Facilities",
        company_name: "Northfield Estates",
        is_published: true,
        location: "Port Harcourt",
        order_index: 1,
        quote: "The new control workflow removed avoidable manual checks from the team.",
        rating: 5,
      },
    ],
  };

  return {
    ...base,
    ...overrides,
    aboutPage: {
      ...base.aboutPage,
      ...(overrides.aboutPage || {}),
    },
    homePage: {
      ...base.homePage,
      ...(overrides.homePage || {}),
    },
    pageSections: {
      about: {
        ...base.pageSections.about,
        ...(overrides.pageSections?.about || {}),
      },
      global: {
        ...base.pageSections.global,
        ...(overrides.pageSections?.global || {}),
      },
      home: {
        ...base.pageSections.home,
        ...(overrides.pageSections?.home || {}),
      },
    },
    products: overrides.products || base.products,
    projects: overrides.projects || base.projects,
    services: overrides.services || base.services,
    siteSettings: {
      ...base.siteSettings,
      ...(overrides.siteSettings || {}),
    },
    testimonials: overrides.testimonials || base.testimonials,
  };
}

function buildAdminOverviewData(overrides = {}) {
  const publicContent = buildPublicContent();

  return {
    aboutPage: overrides.aboutPage || publicContent.aboutPage,
    contentSections: overrides.contentSections || [
      { id: 1, key: "contact-methods", title: "Contact Methods" },
    ],
    homePage: overrides.homePage || publicContent.homePage,
    products: overrides.products || publicContent.products,
    projects: overrides.projects || publicContent.projects,
    services: overrides.services || publicContent.services,
    siteSettings: overrides.siteSettings || publicContent.siteSettings,
    testimonials: overrides.testimonials || publicContent.testimonials,
  };
}

module.exports = {
  buildAboutPage,
  buildAdminOverviewData,
  buildAdminUser,
  buildAuthResponse,
  buildHomePage,
  buildPublicContent,
  buildSiteSettings,
};
