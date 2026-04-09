import type {
  AboutPage,
  ContentSection,
  HomePage,
  MediaAsset,
  PageSection,
  Product,
  Project,
  Service,
  SiteSettings,
  Testimonial,
  User,
} from "../generated/prisma/client";

type WithAsset<T, K extends string> = T & {
  [P in K]?: MediaAsset | null;
};

export function serializeMediaAsset(asset: MediaAsset) {
  return {
    id: asset.id,
    title: asset.title,
    alt_text: asset.altText,
    file_name: asset.fileName,
    url: asset.url,
    secure_url: asset.secureUrl,
    public_id: asset.publicId,
    folder: asset.folder,
    asset_type: asset.assetType,
    mime_type: asset.mimeType,
    width: asset.width,
    height: asset.height,
    bytes: asset.bytes,
    uploaded_by_id: asset.uploadedById,
    created_at: asset.createdAt,
    updated_at: asset.updatedAt,
  };
}

export function serializeUser(user: User) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    is_active: user.isActive,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };
}

export function serializeProject(
  project: WithAsset<WithAsset<Project, "imageAsset">, "ogImageAsset">,
) {
  return {
    id: project.id,
    title: project.title,
    slug: project.slug,
    description: project.description,
    location: project.location,
    image_url: project.imageUrl,
    image_public_id: project.imagePublicId,
    image_asset_id: project.imageAssetId,
    og_image_asset_id: project.ogImageAssetId,
    meta_title: project.metaTitle,
    meta_description: project.metaDescription,
    order_index: project.orderIndex,
    is_published: project.isPublished,
    created_at: project.createdAt,
    updated_at: project.updatedAt,
    image_asset: project.imageAsset ? serializeMediaAsset(project.imageAsset) : null,
    og_image_asset: project.ogImageAsset ? serializeMediaAsset(project.ogImageAsset) : null,
  };
}

export function serializeProduct(
  product: WithAsset<WithAsset<Product, "featuredAsset">, "ogImageAsset">,
) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    features: product.features,
    feature_list: product.featureList,
    cta_label: product.ctaLabel,
    cta_url: product.ctaUrl,
    featured_asset_id: product.featuredAssetId,
    og_image_asset_id: product.ogImageAssetId,
    meta_title: product.metaTitle,
    meta_description: product.metaDescription,
    order_index: product.orderIndex,
    is_published: product.isPublished,
    created_at: product.createdAt,
    updated_at: product.updatedAt,
    featured_asset: product.featuredAsset ? serializeMediaAsset(product.featuredAsset) : null,
    og_image_asset: product.ogImageAsset ? serializeMediaAsset(product.ogImageAsset) : null,
  };
}

export function serializeService(
  service: WithAsset<WithAsset<Service, "featuredAsset">, "ogImageAsset">,
) {
  return {
    id: service.id,
    name: service.name,
    slug: service.slug,
    description: service.description,
    icon_name: service.iconName,
    highlight_list: service.highlightList,
    cta_label: service.ctaLabel,
    cta_url: service.ctaUrl,
    featured_asset_id: service.featuredAssetId,
    og_image_asset_id: service.ogImageAssetId,
    meta_title: service.metaTitle,
    meta_description: service.metaDescription,
    order_index: service.orderIndex,
    is_published: service.isPublished,
    created_at: service.createdAt,
    updated_at: service.updatedAt,
    featured_asset: service.featuredAsset ? serializeMediaAsset(service.featuredAsset) : null,
    og_image_asset: service.ogImageAsset ? serializeMediaAsset(service.ogImageAsset) : null,
  };
}

export function serializeTestimonial(testimonial: Testimonial) {
  return {
    id: testimonial.id,
    quote: testimonial.quote,
    author: testimonial.author,
    author_role: testimonial.authorRole,
    company_name: testimonial.companyName,
    location: testimonial.location,
    rating: testimonial.rating,
    source_url: testimonial.sourceUrl,
    is_featured: testimonial.isFeatured,
    order_index: testimonial.orderIndex,
    is_published: testimonial.isPublished,
    created_at: testimonial.createdAt,
    updated_at: testimonial.updatedAt,
  };
}

export function serializeContentSection(section: ContentSection) {
  return {
    id: section.id,
    section_name: section.sectionName,
    content: section.content,
    updated_by: section.updatedBy,
    created_at: section.createdAt,
    updated_at: section.updatedAt,
  };
}

export function serializeSiteSettings(
  settings: WithAsset<WithAsset<SiteSettings, "logoAsset">, "defaultOgImageAsset">,
) {
  return {
    id: settings.id,
    company_name: settings.companyName,
    site_tagline: settings.siteTagline,
    company_summary: settings.companySummary,
    phone: settings.phone,
    whatsapp_number: settings.whatsappNumber,
    whatsapp_link: settings.whatsappLink,
    email: settings.email,
    address: settings.address,
    social_links: settings.socialLinks,
    footer_motto: settings.footerMotto,
    footer_tagline: settings.footerTagline,
    footer_summary: settings.footerSummary,
    footer_quick_links: settings.footerQuickLinks,
    footer_product_links: settings.footerProductLinks,
    logo_asset_id: settings.logoAssetId,
    default_og_image_asset_id: settings.defaultOgImageAssetId,
    meta_title: settings.metaTitle,
    meta_description: settings.metaDescription,
    canonical_base_url: settings.canonicalBaseUrl,
    created_at: settings.createdAt,
    updated_at: settings.updatedAt,
    logo_asset: settings.logoAsset ? serializeMediaAsset(settings.logoAsset) : null,
    default_og_image_asset: settings.defaultOgImageAsset
      ? serializeMediaAsset(settings.defaultOgImageAsset)
      : null,
  };
}

export function serializeHomePage(
  page: WithAsset<WithAsset<HomePage, "heroVisualAsset">, "ogImageAsset">,
) {
  return {
    id: page.id,
    slug: page.slug,
    is_published: page.isPublished,
    hero_eyebrow: page.heroEyebrow,
    hero_heading: page.heroHeading,
    hero_subheading: page.heroSubheading,
    hero_primary_cta_label: page.heroPrimaryCtaLabel,
    hero_primary_cta_url: page.heroPrimaryCtaUrl,
    hero_secondary_cta_label: page.heroSecondaryCtaLabel,
    hero_secondary_cta_url: page.heroSecondaryCtaUrl,
    hero_stats: page.heroStats,
    hero_visual_asset_id: page.heroVisualAssetId,
    about_summary_title: page.aboutSummaryTitle,
    about_summary_subtitle: page.aboutSummarySubtitle,
    about_summary_cta_label: page.aboutSummaryCtaLabel,
    about_summary_cta_url: page.aboutSummaryCtaUrl,
    about_mission_title: page.aboutMissionTitle,
    about_mission_body: page.aboutMissionBody,
    about_why_choose_title: page.aboutWhyChooseTitle,
    about_why_choose_points: page.aboutWhyChoosePoints,
    products_section_title: page.productsSectionTitle,
    products_section_intro: page.productsSectionIntro,
    services_section_title: page.servicesSectionTitle,
    services_section_intro: page.servicesSectionIntro,
    projects_section_title: page.projectsSectionTitle,
    projects_section_intro: page.projectsSectionIntro,
    testimonials_section_title: page.testimonialsSectionTitle,
    testimonials_section_intro: page.testimonialsSectionIntro,
    custom_solutions_title: page.customSolutionsTitle,
    custom_solutions_subtitle: page.customSolutionsSubtitle,
    custom_solutions_development_title: page.customSolutionsDevelopmentTitle,
    custom_solutions_development_body: page.customSolutionsDevelopmentBody,
    custom_solutions_features: page.customSolutionsFeatures,
    custom_solutions_process_title: page.customSolutionsProcessTitle,
    custom_solutions_process_steps: page.customSolutionsProcessSteps,
    custom_solutions_cta_label: page.customSolutionsCtaLabel,
    custom_solutions_cta_url: page.customSolutionsCtaUrl,
    contact_cta_title: page.contactCtaTitle,
    contact_cta_body: page.contactCtaBody,
    contact_cta_actions: page.contactCtaActions,
    meta_title: page.metaTitle,
    meta_description: page.metaDescription,
    og_image_asset_id: page.ogImageAssetId,
    created_at: page.createdAt,
    updated_at: page.updatedAt,
    hero_visual_asset: page.heroVisualAsset ? serializeMediaAsset(page.heroVisualAsset) : null,
    og_image_asset: page.ogImageAsset ? serializeMediaAsset(page.ogImageAsset) : null,
  };
}

export function serializeAboutPage(
  page: WithAsset<WithAsset<AboutPage, "portraitAsset">, "ogImageAsset">,
) {
  return {
    id: page.id,
    slug: page.slug,
    is_published: page.isPublished,
    page_title: page.pageTitle,
    page_subtitle: page.pageSubtitle,
    founder_name: page.founderName,
    founder_role: page.founderRole,
    portrait_asset_id: page.portraitAssetId,
    short_bio: page.shortBio,
    long_story: page.longStory,
    mission: page.mission,
    vision: page.vision,
    values: page.values,
    certifications: page.certifications,
    years_of_experience: page.yearsOfExperience,
    stats: page.stats,
    service_locations: page.serviceLocations,
    credibility_points: page.credibilityPoints,
    primary_cta_label: page.primaryCtaLabel,
    primary_cta_url: page.primaryCtaUrl,
    meta_title: page.metaTitle,
    meta_description: page.metaDescription,
    og_image_asset_id: page.ogImageAssetId,
    created_at: page.createdAt,
    updated_at: page.updatedAt,
    portrait_asset: page.portraitAsset ? serializeMediaAsset(page.portraitAsset) : null,
    og_image_asset: page.ogImageAsset ? serializeMediaAsset(page.ogImageAsset) : null,
  };
}

export function serializePageSection(section: WithAsset<PageSection, "featuredAsset">) {
  return {
    id: section.id,
    page_type: section.pageType,
    section_key: section.sectionKey,
    title: section.title,
    subtitle: section.subtitle,
    body: section.body,
    content: section.content,
    cta_label: section.ctaLabel,
    cta_url: section.ctaUrl,
    featured_asset_id: section.featuredAssetId,
    order_index: section.orderIndex,
    is_published: section.isPublished,
    created_at: section.createdAt,
    updated_at: section.updatedAt,
    featured_asset: section.featuredAsset ? serializeMediaAsset(section.featuredAsset) : null,
  };
}
