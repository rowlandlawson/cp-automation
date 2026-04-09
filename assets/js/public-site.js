window.CPPublicSite = (() => {
    const U = window.CPPublicUtils;
    if (!U) return { init() {} };

    const $ = (id) => document.getElementById(id);
    const esc = U.escapeHTML;
    const safe = U.safeText;
    const siteUrl = (value, fallback) => U.normalizeContentUrl(value || fallback, fallback);
    // Single source of truth for years of experience display value.
    // Pass content.aboutPage?.years_of_experience; falls back to "7+".
    const yrsDisplay = (raw) => {
        const n = Number(raw);
        return Number.isFinite(n) && n > 0 ? `${n}+` : (raw ? String(raw) : "7+");
    };
    const contactUrl = (settings) =>
        settings.whatsapp_link ||
        U.buildWhatsAppUrl("Hi, I would like to automate my space.", settings);
    const footerQuickUrl = (url) => {
        const value = String(url || "").trim();
        if (/^#about$/i.test(value)) return "/about";
        if (/^#projects$/i.test(value)) return "/projects";
        return U.normalizeContentUrl(value, "#home");
    };
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

    function meta(content) {
        const site = content.siteSettings || {};
        const home = content.homePage || {};
        document.title =
            home.meta_title ||
            site.meta_title ||
            "CP Automation - Smart Home & Business Automation Solutions";
        let desc = document.querySelector('meta[name="description"]');
        if (!desc) {
            desc = document.createElement("meta");
            desc.name = "description";
            document.head.appendChild(desc);
        }
        desc.content =
            home.meta_description ||
            site.meta_description ||
            "CP Automation provides innovative automation solutions for Nigerian homes and businesses.";
        let canonical = document.querySelector('link[rel="canonical"]');
        const canonicalUrl = String(site.canonical_base_url || "").trim();
        if (!canonicalUrl) {
            canonical?.remove();
            return;
        }
        if (!canonical) {
            canonical = document.createElement("link");
            canonical.rel = "canonical";
            document.head.appendChild(canonical);
        }
        canonical.href = canonicalUrl;
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

    function headers(content) {
        const home = content.homePage || {};
        [
            ["productsSectionTitle", home.products_section_title, "Our Products"],
            ["productsSectionIntro", home.products_section_intro, "Reliable automation products for everyday use."],
            ["servicesSectionTitle", home.services_section_title, "Our Services"],
            ["servicesSectionIntro", home.services_section_intro, "Professional automation support for homes and businesses."],
            ["projectsSectionTitle", home.projects_section_title, "Our Projects"],
            ["projectsSectionIntro", home.projects_section_intro, "A quick look at recent installations and field work."],
            ["testimonialsSectionTitle", home.testimonials_section_title, "What Our Clients Say"],
            ["testimonialsSectionIntro", home.testimonials_section_intro, "Real feedback from the people using our systems every day."],
        ].forEach(([id, value, fallback]) => {
            if ($(id)) $(id).textContent = value || fallback;
        });
    }

    function hero(content) {
        const box = $("heroContent");
        if (!box) return;
        const home = content.homePage || {};
        const site = content.siteSettings || {};
        const cta = siteUrl(home.hero_primary_cta_url, contactUrl(site));
        const cta2 = siteUrl(home.hero_secondary_cta_url, "#products");
        const yearsVal = yrsDisplay(content.aboutPage?.years_of_experience);
        const rawStats = U.resolveStatItems(home.hero_stats).slice(0, 3)
            .map((s) => (/year/i.test(s.label) ? { ...s, value: yearsVal } : s));
        const statItems = rawStats.length ? rawStats
            : [{ label: "Projects Done", value: "120+" }, { label: "Happy Clients", value: "95%" }, { label: "Years Active", value: yearsVal }];
        box.innerHTML = `
            <div class="hero-clean text-center scroll-animate animate-fade-in">
                <h1 class="hero-clean-heading fw-800 text-white mb-3">${safe(home.hero_heading, "Life Made Easy With CP Automation")}</h1>
                <p class="hero-clean-sub text-white-50 mb-5">${safe(home.hero_subheading, "We automate borehole pumps, security lights &amp; changeovers for Nigerian homes and businesses.")}</p>
                <div class="d-flex gap-3 justify-content-center flex-wrap mb-5">
                    <a class="btn btn-primary px-4 glow hero-primary-cta" href="${esc(cta)}" ${U.buildLinkAttributes(cta)}><i class="bi bi-whatsapp me-2"></i>${esc(home.hero_primary_cta_label || "Contact Us")}</a>
                    <a class="btn btn-outline-light px-4" href="${esc(cta2)}" ${U.buildLinkAttributes(cta2)}>${esc(home.hero_secondary_cta_label || "View Products")}</a>
                </div>
                <div class="hero-clean-stats">
                    ${statItems.map((s, i) => `${i > 0 ? '<span class="hero-clean-divider"></span>' : ''}<div class="hero-clean-stat"><span class="hero-clean-val">${esc(String(s.value))}</span><span class="hero-clean-lbl">${esc(s.label)}</span></div>`).join("")}
                </div>
            </div>`;
    }

    function products(items, settings) {
        const box = $("productsGrid");
        if (!box) return;
        if (!items?.length) {
            box.innerHTML = `<div class="col-12"><div class="public-empty-state text-center"><h3 class="h5 mb-2">Products will appear here soon</h3><p class="text-muted mb-0">Publish products in the database to populate this section.</p></div></div>`;
            return;
        }
        box.innerHTML = items.map((item, index) => {
            const visual = U.getProductVisual(item, index);
            const asset = item.featured_asset || item.image_asset || null;
            const features = U.resolveProductFeatures(item).slice(0, 3);
            const quoteUrl = siteUrl(item.cta_url, contactUrl(settings));
            const media = U.buildImageMarkup({
                alt: U.resolveAssetAlt(asset, item.name || "Product image"),
                className: "product-card-image",
                imageStyle: "width:100%; height:100%; object-fit:cover;",
                placeholderClass: "text-dark",
                url: U.resolveAssetUrl(asset) || "",
            });
            return `<div class="col-md-4 scroll-animate"><div class="product-card"><div class="product-card-visual product-theme-${esc(visual.bg)}">${media}</div><div class="product-card-content"><h4 class="product-card-name">${esc(item.name || "Product")}</h4><p class="product-card-text">${safe(item.description, "Reliable automation equipment built for everyday operations.")}</p><ul class="product-card-features">${(features.length ? features : ["Reliable installation-ready solution"]).map((feature) => `<li>${esc(feature)}</li>`).join("")}</ul><a href="${esc(quoteUrl)}" class="btn btn-primary btn-sm" ${U.buildLinkAttributes(quoteUrl)}>${esc(item.cta_label || "Get Quote")}</a></div></div></div>`;
        }).join("");
    }

    function services(items) {
        const box = $("servicesGrid");
        if (!box) return;
        if (!items?.length) {
            box.innerHTML = `<div class="col-12"><div class="public-empty-state text-center"><h3 class="h5 mb-2">Services will appear here soon</h3><p class="text-muted mb-0">Publish services in the database to populate this section.</p></div></div>`;
            return;
        }
        box.innerHTML = items.map((item, index) => {
            const list = U.resolveServiceHighlights(item);
            return `<div class="col-md-6 scroll-animate"><div class="service-card-new"><div class="service-icon-badge flex-shrink-0"><i class="bi ${esc(U.getServiceIcon(item, index))} fs-3"></i></div><div><h5 class="service-card-new-title">${esc(item.name || "Service")}</h5><p class="service-card-new-desc">${safe(item.description, "Professional automation support tailored to your setup.")}</p>${list.length ? `<ul class="text-muted small mt-2 mb-0 service-highlight-list">${list.map((entry) => `<li>${esc(entry)}</li>`).join("")}</ul>` : ""}</div></div></div>`;
        }).join("");
    }

    function projects(items) {
        const box = $("projectsGrid");
        const ctaBox = $("projectsPageCta");
        if (!box) return;
        if (!items?.length) {
            box.innerHTML = `<div class="col-12"><div class="public-empty-state text-center"><h3 class="h5 mb-2">Projects will appear here soon</h3><p class="text-muted mb-0">Publish projects in the database to populate this section.</p></div></div>`;
            if (ctaBox) ctaBox.innerHTML = "";
            return;
        }
        box.innerHTML = items.slice(0, 4).map((item, index) => `<div class="col-md-6 col-lg-3 scroll-animate"><div class="project-card-v2"><div class="project-card-v2-media product-theme-${["primary", "warning", "info", "danger"][index % 4]}">${U.buildImageMarkup({ alt: U.resolveAssetAlt(item.image_asset, item.title || "Project image"), className: "img-fluid", imageStyle: "width:100%; height:100%; object-fit:cover;", placeholderClass: "text-dark", placeholderIcon: "bi-image", placeholderLabel: item.title || "Project image", url: U.resolveAssetUrl(item.image_asset, item.image_url) || "" })}</div><div class="project-card-v2-body"><h5 class="project-card-v2-title">${esc(item.title || "Project")}</h5><p class="project-card-v2-location"><i class="bi bi-geo-alt-fill"></i>${safe(item.location, "Nigeria")}</p><p class="project-card-v2-desc">${safe(U.truncate(item.description, 120), "Recent automation installation.")}</p></div></div></div>`).join("");
        if (ctaBox) ctaBox.innerHTML = `<a class="btn btn-outline-primary btn-sm" href="/projects">View All Projects</a>`;
    }

    function custom(content) {
        const box = $("customSectionContent");
        if (!box) return;
        const home = content.homePage || {};
        const site = content.siteSettings || {};
        const features = U.normalizeList(home.custom_solutions_features).slice(0, 5);
        const steps = Array.isArray(home.custom_solutions_process_steps) ? home.custom_solutions_process_steps : [];
        const cta = siteUrl(home.custom_solutions_cta_url, contactUrl(site));
        const fallbackSteps = [
            { body: "We discuss your specific requirements and challenges.", step: 1, title: "Consultation" },
            { body: "We create a custom solution design and provide a clear quote.", step: 2, title: "Design & Proposal" },
            { body: "We build and test your custom automation solution.", step: 3, title: "Development" },
            { body: "We install the solution and provide support.", step: 4, title: "Installation & Support" },
        ];
        box.innerHTML = `<div class="text-center mb-5 scroll-animate"><h2 class="section-title mb-3">${esc(home.custom_solutions_title || "Custom Automation Solutions")}</h2><p class="lead text-muted">${safe(home.custom_solutions_subtitle, "Need something specific? We build custom automation devices tailored to unique requirements.")}</p></div><div class="row g-4"><div class="col-lg-6 scroll-animate"><div class="custom-solutions-panel"><div class="service-icon-badge mb-3"><i class="bi bi-gear fs-2"></i></div><h4 class="custom-solutions-panel-title text-primary">${esc(home.custom_solutions_development_title || "Custom Device Development")}</h4><p class="custom-solutions-panel-desc">${safe(home.custom_solutions_development_body, "We specialize in creating bespoke automation solutions for unique challenges.")}</p><ul class="custom-solutions-features">${(features.length ? features : ["Custom circuit design and controller logic", "Specialized automation controllers", "Integration with existing systems"]).map((item) => `<li>${esc(item)}</li>`).join("")}</ul></div></div><div class="col-lg-6 scroll-animate"><div class="custom-solutions-panel"><div class="product-icon-badge custom-icon-badge-alt mb-3"><i class="bi bi-lightbulb fs-2"></i></div><h4 class="custom-solutions-panel-title" style="color:var(--brand-red)">${esc(home.custom_solutions_process_title || "How It Works")}</h4><div class="timeline-stack mb-4">${(steps.length ? steps : fallbackSteps).map((step, index) => `<div class="timeline-item"><span class="timeline-step">${esc(step.step ?? index + 1)}</span><div><div class="timeline-title">${esc(step.title || "Step")}</div><p class="text-muted small mb-0">${safe(step.body, "")}</p></div></div>`).join("")}</div><a href="${esc(cta)}" class="btn btn-primary btn-sm" ${U.buildLinkAttributes(cta)}>${esc(home.custom_solutions_cta_label || "Request Custom Solution")}</a></div></div></div>`;
    }

    function testimonials(items) {
        const box = $("testimonialsCarouselInner");
        if (!box) return;
        const list = items?.length ? items : [{ author: "Satisfied CP Automation Client", location: "Port Harcourt", quote: "Good afternoon, yes it is. It is such a breath of fresh air. Thank you.", rating: 5 }];
        box.innerHTML = list.map((item, index) => `<div class="carousel-item ${index === 0 ? "active" : ""}"><div class="testimonial-v2"><div class="d-flex mb-3">${U.buildStars(item.rating || 5)}</div><p class="testimonial-v2-quote">"${esc(item.quote || "Client feedback will appear here.")}"</p><p class="testimonial-v2-author">— ${esc([item.author, item.author_role, item.location].filter(Boolean).join(", ") || "CP Automation Client")}</p></div></div>`).join("");
    }

    function contact(content) {
        const box = $("contactSectionContent");
        if (!box) return;
        const home = content.homePage || {};
        const site = content.siteSettings || {};
        const actions = Array.isArray(home.contact_cta_actions) && home.contact_cta_actions.length ? home.contact_cta_actions : [{ label: "Book Consultation", url: contactUrl(site) }];
        box.innerHTML = `<div class="row justify-content-center"><div class="col-lg-8 scroll-animate"><div class="contact-cta-v2"><div class="contact-cta-v2-icon"><i class="bi bi-lightning-charge-fill"></i></div><h2 class="contact-cta-v2-title">${esc(home.contact_cta_title || "Ready to Automate Your Space?")}</h2><p class="contact-cta-v2-body">${safe(home.contact_cta_body, "Contact us today to discuss how CP Automation can make your life and business easier.")}</p><div class="d-flex gap-3 flex-wrap justify-content-center">${actions.map((action, index) => {
            const url = siteUrl(action.url, contactUrl(site));
            return `<a href="${esc(url)}" class="btn btn-sm ${index === 0 ? "btn-primary" : "btn-outline-primary"}" ${U.buildLinkAttributes(url)}><i class="bi bi-whatsapp me-2"></i>${esc(action.label || "Book Consultation")}</a>`;
        }).join("")}</div></div></div></div>`;
    }

    function footer(content) {
        const box = $("footerContent");
        if (!box) return;
        const site = content.siteSettings || {};
        const social = Array.isArray(site.social_links) ? site.social_links.filter((item) => item && item.url && !item.isPlaceholder) : [];
        const quick = Array.isArray(site.footer_quick_links) ? site.footer_quick_links : [];
        const products = Array.isArray(site.footer_product_links) ? site.footer_product_links : [];
        const consult = contactUrl(site);
        box.innerHTML = `<div class="motto-section"><div class="motto">${esc(site.footer_motto || "Life Made Easy")}</div><p class="tagline">${safe(site.footer_tagline || site.company_summary || "Transforming homes and businesses with innovative automation solutions.")}</p></div><div class="row d-none d-md-flex"><div class="col-lg-4 col-md-6 mb-4"><div class="footer-brand"><img src="${esc(U.resolveAssetUrl(site.logo_asset, U.getDefaultImageUrl("logo")))}" alt="${esc(U.resolveAssetAlt(site.logo_asset, `${site.company_name || "CP Automation"} logo`))}" class="footer-logo" loading="lazy" /><h4>${esc(site.company_name || "CP Automation")}</h4></div><p>${safe(site.footer_summary || site.company_summary || "Providing cutting-edge automation solutions for homes and businesses.")}</p><div class="automation-badge"><i class="fas fa-robot me-2"></i>Smart Automation Experts</div>${social.length ? `<div class="social-links">${social.map((item) => {
            const url = U.normalizeContentUrl(item.url, consult);
            return `<a href="${esc(url)}" aria-label="${esc(item.platform || "Social link")}" ${U.buildLinkAttributes(url)}><i class="${esc(footerIcon(item.platform))}"></i></a>`;
        }).join("")}</div>` : ""}</div><div class="col-lg-2 col-md-6 mb-4"><div class="footer-links"><h5>Quick Links</h5><ul>${quick.map((item) => {
            const url = footerQuickUrl(item.url);
            return `<li><a href="${esc(url)}" ${U.buildLinkAttributes(url)}><i class="fas fa-chevron-right"></i>${esc(item.label || "Link")}</a></li>`;
        }).join("")}</ul></div></div><div class="col-lg-3 col-md-6 mb-4"><div class="footer-links"><h5>Our Solutions</h5><ul>${products.map((item) => {
            const url = U.normalizeContentUrl(item.url, "#products");
            return `<li><a href="${esc(url)}" ${U.buildLinkAttributes(url)}><i class="fas fa-chevron-right"></i>${esc(item.label || "Solution")}</a></li>`;
        }).join("")}</ul></div></div><div class="col-lg-3 col-md-6 mb-4"><div class="footer-links"><h5>Contact Us</h5><div class="contact-info">${site.address ? `<p><i class="fas fa-map-marker-alt"></i>${esc(site.address)}</p>` : ""}${site.phone ? `<p><i class="fas fa-phone"></i><a href="${esc(U.buildPhoneHref(site.phone))}" class="text-white text-decoration-none">${esc(site.phone)}</a></p>` : ""}${consult ? `<p><i class="fab fa-whatsapp"></i><a href="${esc(consult)}" class="text-white text-decoration-none" ${U.buildLinkAttributes(consult)}>${esc(site.phone || site.whatsapp_number || "+234 803 341 7657")}</a></p>` : ""}${site.email ? `<p><i class="fas fa-envelope"></i><a href="${esc(U.buildMailHref(site.email))}" class="text-white text-decoration-none">${esc(site.email)}</a></p>` : ""}</div><div class="mt-4"><a href="${esc(consult)}" class="btn btn-sm btn-outline-light me-2" ${U.buildLinkAttributes(consult)}><i class="fas fa-calendar-alt me-1"></i>Book Consultation</a></div></div></div></div><div class="copyright-custom"><div class="row align-items-center"><div class="col-md-6 text-center text-md-start">&copy; ${new Date().getFullYear()} ${esc(site.company_name || "CP Automation")}. All rights reserved.</div><div class="col-md-6 text-center text-md-end d-none d-md-block"><span>Designed for automation excellence</span></div></div></div>`;
    }

    function render(content) {
        brand(content);
        meta(content);
        hero(content);
        headers(content);
        products(content.products || [], content.siteSettings || {});
        services(content.services || []);
        projects(content.projects || []);
        custom(content);
        testimonials(content.testimonials || []);
        contact(content);
        footer(content);
        U.initCounterAnimations();
        U.revealAnimatedElements();
        U.initTestimonialCarousel();
    }

    async function init() {
        U.initNavbarCollapse();
        U.initSmoothScrolling();
        window.addEventListener("scroll", U.revealAnimatedElements, { passive: true });
        render(U.createDefaultPublicContent());
        try {
            render(await U.fetchPublicContent());
        } catch (error) {
            console.error("Failed to load live public content. Keeping fallback content.", error);
        }
        U.revealAnimatedElements();
    }

    return { init };
})();
