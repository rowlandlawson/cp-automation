window.CPAboutPage = (() => {
    const U = window.CPPublicUtils;
    if (!U) return { init() {} };

    const $ = (id) => document.getElementById(id);
    const esc = U.escapeHTML;
    const safe = U.safeText;
    const yrsDisplay = (raw) => {
        const n = Number(raw);
        return Number.isFinite(n) && n > 0 ? `${n}+` : (raw ? String(raw) : "7+");
    };
    const siteLink = (value, fallback = "/#home") => {
        const url = String(value || "").trim();
        if (/^#about$/i.test(url)) return "/about";
        if (/^#projects$/i.test(url)) return "/projects";
        if (url.startsWith("#")) return `/${url}`;
        return U.normalizeContentUrl(url || fallback, fallback);
    };
    const contactUrl = (settings) =>
        settings.whatsapp_link ||
        U.buildWhatsAppUrl("Hi, I would like to learn more about CP Automation.", settings);
    const footerIcon = (platform) =>
        ({
            facebook: "fab fa-facebook-f",
            instagram: "fab fa-instagram",
            linkedin: "fab fa-linkedin-in",
            tiktok: "fab fa-tiktok",
            twitter: "fab fa-twitter",
            website: "fas fa-globe",
            whatsapp: "fab fa-whatsapp",
            x: "fab fa-x-twitter",
            youtube: "fab fa-youtube",
        }[String(platform || "").trim().toLowerCase()] || "fas fa-link");
    const lines = (items, empty) =>
        `<ul class="about-detail-list mb-0">${(items?.length ? items : [empty]).map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`;

    function meta(content) {
        const site = content.siteSettings || {};
        const about = content.aboutPage || {};
        document.title = about.meta_title || `${about.page_title || "About CP Automation"} | ${site.company_name || "CP Automation"}`;
        let desc = document.querySelector('meta[name="description"]');
        if (!desc) {
            desc = document.createElement("meta");
            desc.name = "description";
            document.head.appendChild(desc);
        }
        desc.content =
            about.meta_description ||
            site.meta_description ||
            "Learn more about CP Automation, our founder story, and our practical automation delivery.";
        let canonical = document.querySelector('link[rel="canonical"]');
        const base = String(site.canonical_base_url || "").trim().replace(/\/$/, "");
        const href = base ? `${base}/about` : "";
        if (!href) {
            canonical?.remove();
            return;
        }
        if (!canonical) {
            canonical = document.createElement("link");
            canonical.rel = "canonical";
            document.head.appendChild(canonical);
        }
        canonical.href = href;
    }

    function brand(content) {
        const site = content.siteSettings || {};
        const logo = $("navbarLogo");
        if (logo) {
            logo.src = U.resolveAssetUrl(site.logo_asset, logo.getAttribute("src") || "assets/img/logo.jpg");
            logo.alt = U.resolveAssetAlt(site.logo_asset, `${site.company_name || "CP Automation"} logo`);
        }
        if ($("brandName")) $("brandName").textContent = site.company_name || "CP Automation";
        if ($("brandTagline")) $("brandTagline").textContent = site.site_tagline || "Dependable automation for everyday systems";
    }

    function hero(content) {
        const box = $("aboutHeroContent");
        if (!box) return;
        const site = content.siteSettings || {};
        const about = content.aboutPage || {};
        const cta = siteLink(about.primary_cta_url, contactUrl(site));
        box.innerHTML = `
            <div class="hero-clean text-center scroll-animate animate-fade-in">
                <h1 class="hero-clean-heading fw-800 text-white mb-3">${safe(about.page_title, "About CP Automation")}</h1>
                <p class="hero-clean-sub text-white-50 mb-5">${safe(about.page_subtitle, "The founder story, values, and practical delivery approach behind CP Automation.")}</p>
                <div class="d-flex gap-3 justify-content-center flex-wrap">
                    <a class="btn btn-primary px-4" href="${esc(cta)}" ${U.buildLinkAttributes(cta)}>${esc(about.primary_cta_label || "Contact Us")}</a>
                    <a class="btn btn-outline-light px-4" href="/projects">View Projects</a>
                </div>
            </div>`;
    }

    function profile(content) {
        const box = $("aboutProfileContent");
        if (!box) return;
        const site = content.siteSettings || {};
        const about = content.aboutPage || {};
        const credibility = content.pageSections?.about?.["credibility-highlights"]?.content;
        box.innerHTML = `<div class="row g-4 align-items-start"><div class="col-lg-5"><div class="about-page-card scroll-animate"><div class="about-page-media">${U.buildImageMarkup({ alt: U.resolveAssetAlt(about.portrait_asset, `${about.founder_name || "Founder"} portrait`), className: "img-fluid", fallbackUrl: U.getDefaultImageUrl("portrait"), imageStyle: "width:100%; height:100%; object-fit:cover;", placeholderClass: "text-dark", placeholderIcon: "bi-person-circle", placeholderLabel: about.founder_name || "Founder portrait", url: U.resolveAssetUrl(about.portrait_asset) || "" })}</div><div class="about-page-copy"><span class="about-page-badge">${yrsDisplay(about.years_of_experience)} years of experience</span><h2 class="about-page-title">${esc(about.founder_name || site.company_name || "CP Automation")}</h2><p class="about-page-role">${safe(about.founder_role, "Founder & Lead Automation Specialist")}</p><p class="text-muted mb-0">${safe(about.short_bio, site.company_summary || "Practical automation delivery for homes and businesses.")}</p></div></div></div><div class="col-lg-7"><div class="about-page-card scroll-animate"><div class="row g-4"><div class="col-12"><h3 class="section-title h4 mb-3">Our Story</h3><p class="text-muted mb-0">${safe(about.long_story, "CP Automation was built to reduce avoidable manual strain around water, power, lighting, and workflow control.")}</p></div><div class="col-md-6"><div class="about-detail-card"><h4 class="h6 mb-2">Mission</h4><p class="text-muted mb-0">${safe(about.mission, "To replace repetitive manual work with dependable automation.")}</p></div></div><div class="col-md-6"><div class="about-detail-card"><h4 class="h6 mb-2">Vision</h4><p class="text-muted mb-0">${safe(about.vision, "To make dependable automation more accessible.")}</p></div></div><div class="col-md-6"><div class="about-detail-card"><h4 class="h6 mb-2">Values</h4>${lines(Array.isArray(about.values) ? about.values : [], "Add values in the admin dashboard.")}</div></div><div class="col-md-6"><div class="about-detail-card"><h4 class="h6 mb-2">Certifications</h4>${lines(Array.isArray(about.certifications) ? about.certifications : [], "Add certifications in the admin dashboard.")}</div></div><div class="col-md-6"><div class="about-detail-card"><h4 class="h6 mb-2">Service Locations</h4>${lines(Array.isArray(about.service_locations) ? about.service_locations : [], "Add service locations in the admin dashboard.")}</div></div><div class="col-md-6"><div class="about-detail-card"><h4 class="h6 mb-2">Why Clients Trust Us</h4>${lines(Array.isArray(about.credibility_points) ? about.credibility_points : [], "Add credibility points in the admin dashboard.")}</div></div>${Array.isArray(credibility) && credibility.length ? `<div class="col-12"><div class="about-detail-card"><h4 class="h6 mb-2">Professional Differentiators</h4>${lines(credibility, "Practical automation delivery.")}</div></div>` : ""}</div></div></div></div>`;
    }

    function gallery(content) {
        const box = $("aboutGalleryContent");
        if (!box) return;
        const site = content.siteSettings || {};
        const about = content.aboutPage || {};
        const galleryItems = [
            about.portrait_asset
                ? {
                      asset: about.portrait_asset,
                      description: about.short_bio || "Founder portrait",
                      title: about.founder_name || "Founder portrait",
                  }
                : null,
            ...(Array.isArray(content.projects) ? content.projects : [])
                .filter((project) => U.resolveAssetUrl(project.image_asset, project.image_url))
                .slice(0, 4)
                .map((project) => ({
                    asset: project.image_asset || { url: project.image_url, secure_url: project.image_url },
                    description: project.location || site.address || "Nigeria",
                    title: project.title || "Project",
                })),
        ].filter(Boolean);

        box.innerHTML = `<div class="text-center mb-5 scroll-animate"><h2 class="section-title mb-3">Pictures and Field Work</h2><p class="lead text-muted mb-0">The About page now pulls imagery from the founder profile and uploaded projects so the story stays connected to the work.</p></div><div class="row g-4">${(galleryItems.length ? galleryItems : [{ asset: site.logo_asset, description: site.company_summary || "Company image", title: site.company_name || "CP Automation" }]).map((item) => `<div class="col-md-6 col-lg-4 scroll-animate"><div class="about-gallery-card"><div class="about-gallery-media">${U.buildImageMarkup({ alt: U.resolveAssetAlt(item.asset, item.title || "Gallery image"), className: "img-fluid", imageStyle: "width:100%; height:100%; object-fit:cover;", placeholderClass: "text-dark", placeholderIcon: "bi-image", placeholderLabel: item.title || "Gallery image", url: U.resolveAssetUrl(item.asset) || "" })}</div><div class="about-gallery-copy"><h3 class="h6 mb-2">${esc(item.title || "Gallery image")}</h3><p class="text-muted mb-0">${safe(item.description, "CP Automation field work.")}</p></div></div></div>`).join("")}</div>`;
    }

    function contact(content) {
        const box = $("aboutContactContent");
        if (!box) return;
        const site = content.siteSettings || {};
        const home = content.homePage || {};
        const cta = siteLink(content.aboutPage?.primary_cta_url, contactUrl(site));
        box.innerHTML = `<div class="row justify-content-center"><div class="col-lg-8 scroll-animate"><div class="contact-cta-v2"><div class="contact-cta-v2-icon"><i class="bi bi-lightning-charge-fill"></i></div><h2 class="contact-cta-v2-title">${esc(home.contact_cta_title || "Ready to talk about your automation needs?")}</h2><p class="contact-cta-v2-body">${safe(home.contact_cta_body, "Reach out for consultations, project discussions, and installation support.")}</p><div class="d-flex gap-3 flex-wrap justify-content-center"><a href="${esc(cta)}" class="btn btn-primary px-4" ${U.buildLinkAttributes(cta)}><i class="bi bi-whatsapp me-2"></i>${esc(content.aboutPage?.primary_cta_label || "Book Consultation")}</a><a href="/projects" class="btn btn-outline-primary px-4">See Projects</a></div></div></div></div>`;
    }

    function footer(content) {
        const box = $("footerContent");
        if (!box) return;
        const site = content.siteSettings || {};
        const social = Array.isArray(site.social_links) ? site.social_links.filter((item) => item && item.url && !item.isPlaceholder) : [];
        const quick = Array.isArray(site.footer_quick_links) ? site.footer_quick_links : [];
        const products = Array.isArray(site.footer_product_links) ? site.footer_product_links : [];
        const consult = contactUrl(site);
        box.innerHTML = `<div class="motto-section"><div class="motto">${esc(site.footer_motto || "Life Made Easy")}</div><p class="tagline">${safe(site.footer_tagline || site.company_summary || "Transforming homes and businesses with innovative automation solutions.")}</p></div><div class="row d-none d-md-flex"><div class="col-lg-4 col-md-6 mb-4"><div class="footer-brand"><img src="${esc(U.resolveAssetUrl(site.logo_asset, U.getDefaultImageUrl("logo")))}" alt="${esc(U.resolveAssetAlt(site.logo_asset, `${site.company_name || "CP Automation"} logo`))}" class="footer-logo" loading="lazy" /><h4>${esc(site.company_name || "CP Automation")}</h4></div><p>${safe(site.footer_summary || site.company_summary || "Providing cutting-edge automation solutions for homes and businesses.")}</p><div class="automation-badge"><i class="fas fa-robot me-2"></i>Smart Automation Experts</div>${social.length ? `<div class="social-links">${social.map((item) => { const url = siteLink(item.url, consult); return `<a href="${esc(url)}" aria-label="${esc(item.platform || "Social link")}" ${U.buildLinkAttributes(url)}><i class="${esc(footerIcon(item.platform))}"></i></a>`; }).join("")}</div>` : ""}</div><div class="col-lg-2 col-md-6 mb-4"><div class="footer-links"><h5>Quick Links</h5><ul>${quick.map((item) => `<li><a href="${esc(siteLink(item.url, "/#home"))}" ${U.buildLinkAttributes(siteLink(item.url, "/#home"))}><i class="fas fa-chevron-right"></i>${esc(item.label || "Link")}</a></li>`).join("")}</ul></div></div><div class="col-lg-3 col-md-6 mb-4"><div class="footer-links"><h5>Our Solutions</h5><ul>${products.map((item) => `<li><a href="${esc(siteLink(item.url, "/#products"))}" ${U.buildLinkAttributes(siteLink(item.url, "/#products"))}><i class="fas fa-chevron-right"></i>${esc(item.label || "Solution")}</a></li>`).join("")}</ul></div></div><div class="col-lg-3 col-md-6 mb-4"><div class="footer-links"><h5>Contact Us</h5><div class="contact-info">${site.address ? `<p><i class="fas fa-map-marker-alt"></i>${esc(site.address)}</p>` : ""}${site.phone ? `<p><i class="fas fa-phone"></i><a href="${esc(U.buildPhoneHref(site.phone))}" class="text-white text-decoration-none">${esc(site.phone)}</a></p>` : ""}${consult ? `<p><i class="fab fa-whatsapp"></i><a href="${esc(consult)}" class="text-white text-decoration-none" ${U.buildLinkAttributes(consult)}>${esc(site.phone || site.whatsapp_number || "+234 803 341 7657")}</a></p>` : ""}${site.email ? `<p><i class="fas fa-envelope"></i><a href="${esc(U.buildMailHref(site.email))}" class="text-white text-decoration-none">${esc(site.email)}</a></p>` : ""}</div></div></div></div><div class="copyright-custom"><div class="row align-items-center"><div class="col-md-6 text-center text-md-start">&copy; ${new Date().getFullYear()} ${esc(site.company_name || "CP Automation")}. All rights reserved.</div><div class="col-md-6 text-center text-md-end d-none d-md-block"><span>Designed for automation excellence</span></div></div></div>`;
    }

    function render(content) {
        brand(content);
        meta(content);
        hero(content);
        profile(content);
        gallery(content);
        contact(content);
        footer(content);
        U.revealAnimatedElements();
    }

    async function init() {
        U.initNavbarCollapse();
        const fallback = U.createDefaultPublicContent();
        render(fallback);
        try {
            render(await U.fetchPublicContent());
        } catch (error) {
            console.error("Failed to load live About content. Keeping fallback content.", error);
        }
    }

    return { init };
})();

window.CPAboutPage.init();
