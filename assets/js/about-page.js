window.CPAboutPage = (() => {
    const U = window.CPPublicUtils;
    if (!U) return { init() {} };

    const $ = (id) => document.getElementById(id);
    const esc = U.escapeHTML;
    const safe = U.safeText;
    const yrsDisplay = (raw) => {
        const n = Number(raw);
        return Number.isFinite(n) && n > 0 ? `${n}+` : raw ? String(raw) : "7+";
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

    function meta(content) {
        const site = content.siteSettings || {};
        const about = content.aboutPage || {};
        document.title =
            about.meta_title ||
            `${about.page_title || "About CP Automation"} | ${site.company_name || "CP Automation"}`;
        let desc = document.querySelector('meta[name="description"]');
        if (!desc) {
            desc = document.createElement("meta");
            desc.name = "description";
            document.head.appendChild(desc);
        }
        desc.content =
            about.meta_description ||
            site.meta_description ||
            "Learn more about CP Automation, our company story, and our practical automation delivery.";
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
            logo.src = U.resolveAssetUrl(
                site.logo_asset,
                logo.getAttribute("src") || "assets/img/logo.jpg",
            );
            logo.alt = U.resolveAssetAlt(
                site.logo_asset,
                `${site.company_name || "CP Automation"} logo`,
            );
        }
        if ($("brandName")) $("brandName").textContent = site.company_name || "CP Automation";
        if ($("brandTagline")) {
            $("brandTagline").textContent =
                site.site_tagline || "Dependable automation for everyday systems";
        }
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
                <p class="hero-clean-sub text-white-50 mb-5">${safe(about.page_subtitle, "Learn about the company story, the leadership behind it, and the value CP Automation brings to everyday operations.")}</p>
                <div class="d-flex gap-3 justify-content-center flex-wrap">
                    <a class="btn btn-primary px-4" href="${esc(cta)}" ${U.buildLinkAttributes(cta)}>${esc(about.primary_cta_label || "Contact Us")}</a>
                    <a class="btn btn-outline-light px-4" href="/projects">View Projects</a>
                </div>
            </div>`;
    }

    function buildValueCards(about) {
        const values = Array.isArray(about.values) ? about.values : [];
        const benefits = Array.isArray(about.credibility_points) ? about.credibility_points : [];
        const combined = [...values, ...benefits]
            .map((item) => String(item || "").trim())
            .filter(Boolean)
            .slice(0, 4);

        if (combined.length) {
            return combined;
        }

        return [
            "Practical automation designed around real operating conditions.",
            "Reliable systems that reduce repeated manual effort.",
            "Clear communication from planning through support.",
            "Solutions shaped for long-term day-to-day use.",
        ];
    }

    function profile(content) {
        const box = $("aboutProfileContent");
        if (!box) return;

        const site = content.siteSettings || {};
        const about = content.aboutPage || {};
        const valueCards = buildValueCards(about);
        const leaderName = about.founder_name || site.company_name || "CP Automation";
        const leaderRole = about.founder_role || "Team leader and CEO";

        box.innerHTML = `
            <div class="about-simple-stack">
                <section class="about-simple-section about-page-card scroll-animate">
                    <div class="about-simple-head">
                        <span class="about-page-badge">About the company</span>
                        <h2 class="about-page-title mb-2">Our Story</h2>
                    </div>
                    <div class="row g-4 align-items-start">
                        <div class="col-12 col-lg-8">
                            <p class="text-muted mb-0">${safe(
                                about.long_story,
                                "CP Automation helps homes and businesses run important systems with less stress, less manual effort, and more dependable day-to-day control.",
                            )}</p>
                        </div>
                        <div class="col-12 col-lg-4">
                            <div class="about-simple-aside">
                                <div class="about-simple-meta">
                                    <span>Experience</span>
                                    <strong>${esc(yrsDisplay(about.years_of_experience))} years</strong>
                                </div>
                                <div class="about-simple-meta">
                                    <span>Mission</span>
                                    <p class="mb-0">${safe(
                                        about.mission,
                                        "To replace repeated manual work with dependable automation.",
                                    )}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section class="about-page-card scroll-animate">
                    <div class="row g-0">
                        <div class="col-12 col-lg-5">
                            <div class="about-page-media about-leader-media">
                                ${U.buildImageMarkup({
                                    alt: U.resolveAssetAlt(
                                        about.portrait_asset,
                                        `${leaderName} portrait`,
                                    ),
                                    className: "img-fluid",
                                    fallbackUrl: U.getDefaultImageUrl("portrait"),
                                    imageStyle: "width:100%; height:100%; object-fit:cover;",
                                    placeholderClass: "text-dark",
                                    placeholderIcon: "bi-person-circle",
                                    placeholderLabel: leaderName,
                                    url: U.resolveAssetUrl(about.portrait_asset) || "",
                                })}
                            </div>
                        </div>
                        <div class="col-12 col-lg-7">
                            <div class="about-page-copy about-leader-copy">
                                <span class="about-page-badge">Team leader and CEO</span>
                                <h2 class="about-page-title mb-1">${esc(leaderName)}</h2>
                                <p class="about-page-role">${safe(leaderRole, "Team leader and CEO")}</p>
                                <p class="text-muted mb-3">${safe(
                                    about.short_bio,
                                    site.company_summary ||
                                        "CP Automation is led by a practical automation specialist focused on reliable, real-world system performance.",
                                )}</p>
                                <div class="about-simple-note">
                                    <h3 class="h6 mb-2">What drives the work</h3>
                                    <p class="text-muted mb-0">${safe(
                                        about.vision,
                                        "To make dependable automation easier to access for homes, facilities, and growing businesses.",
                                    )}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section class="scroll-animate">
                    <div class="text-center mb-4">
                        <span class="about-page-badge">Our values</span>
                        <h2 class="about-page-title mb-2">The value CP Automation brings to you</h2>
                        <p class="text-muted mb-0">
                            Clear principles and practical outcomes that guide every installation and recommendation.
                        </p>
                    </div>
                    <div class="row g-3">
                        ${valueCards
                            .map(
                                (item, index) => `
                            <div class="col-12 col-sm-6">
                                <article class="about-simple-value-card">
                                    <div class="about-simple-value-icon">
                                        <i class="fa-solid ${
                                            ["fa-shield-heart", "fa-bolt", "fa-users", "fa-screwdriver-wrench"][
                                                index % 4
                                            ]
                                        }"></i>
                                    </div>
                                    <p class="mb-0">${esc(item)}</p>
                                </article>
                            </div>
                        `,
                            )
                            .join("")}
                    </div>
                </section>
            </div>
        `;
    }

    function footer(content) {
        const box = $("footerContent");
        if (!box) return;
        const site = content.siteSettings || {};
        const social = Array.isArray(site.social_links)
            ? site.social_links.filter((item) => item && item.url && !item.isPlaceholder)
            : [];
        const quick = Array.isArray(site.footer_quick_links) ? site.footer_quick_links : [];
        const products = Array.isArray(site.footer_product_links)
            ? site.footer_product_links
            : [];
        const consult = contactUrl(site);
        box.innerHTML = `<div class="motto-section"><div class="motto">${esc(site.footer_motto || "Life Made Easy")}</div><p class="tagline">${safe(site.footer_tagline || site.company_summary || "Transforming homes and businesses with innovative automation solutions.")}</p></div><div class="row d-none d-md-flex"><div class="col-lg-4 col-md-6 mb-4"><div class="footer-brand"><img src="${esc(U.resolveAssetUrl(site.logo_asset, U.getDefaultImageUrl("logo")))}" alt="${esc(U.resolveAssetAlt(site.logo_asset, `${site.company_name || "CP Automation"} logo`))}" class="footer-logo" loading="lazy" /><h4>${esc(site.company_name || "CP Automation")}</h4></div><p>${safe(site.footer_summary || site.company_summary || "Providing cutting-edge automation solutions for homes and businesses.")}</p><div class="automation-badge"><i class="fas fa-robot me-2"></i>Smart Automation Experts</div>${social.length ? `<div class="social-links">${social.map((item) => { const url = siteLink(item.url, consult); return `<a href="${esc(url)}" aria-label="${esc(item.platform || "Social link")}" ${U.buildLinkAttributes(url)}><i class="${esc(footerIcon(item.platform))}"></i></a>`; }).join("")}</div>` : ""}</div><div class="col-lg-2 col-md-6 mb-4"><div class="footer-links"><h5>Quick Links</h5><ul>${quick.map((item) => `<li><a href="${esc(siteLink(item.url, "/#home"))}" ${U.buildLinkAttributes(siteLink(item.url, "/#home"))}><i class="fas fa-chevron-right"></i>${esc(item.label || "Link")}</a></li>`).join("")}</ul></div></div><div class="col-lg-3 col-md-6 mb-4"><div class="footer-links"><h5>Our Solutions</h5><ul>${products.map((item) => `<li><a href="${esc(siteLink(item.url, "/#products"))}" ${U.buildLinkAttributes(siteLink(item.url, "/#products"))}><i class="fas fa-chevron-right"></i>${esc(item.label || "Solution")}</a></li>`).join("")}</ul></div></div><div class="col-lg-3 col-md-6 mb-4"><div class="footer-links"><h5>Contact Us</h5><div class="contact-info">${site.address ? `<p><i class="fas fa-map-marker-alt"></i>${esc(site.address)}</p>` : ""}${site.phone ? `<p><i class="fas fa-phone"></i><a href="${esc(U.buildPhoneHref(site.phone))}" class="text-white text-decoration-none">${esc(site.phone)}</a></p>` : ""}${consult ? `<p><i class="fab fa-whatsapp"></i><a href="${esc(consult)}" class="text-white text-decoration-none" ${U.buildLinkAttributes(consult)}>${esc(site.phone || site.whatsapp_number || "+234 803 341 7657")}</a></p>` : ""}${site.email ? `<p><i class="fas fa-envelope"></i><a href="${esc(U.buildMailHref(site.email))}" class="text-white text-decoration-none">${esc(site.email)}</a></p>` : ""}</div></div></div></div><div class="copyright-custom"><div class="row align-items-center"><div class="col-md-6 text-center text-md-start">&copy; ${new Date().getFullYear()} ${esc(site.company_name || "CP Automation")}. All rights reserved.</div><div class="col-md-6 text-center text-md-end d-none d-md-block"><span>Designed for automation excellence</span></div></div></div>`;
    }

    function render(content) {
        brand(content);
        meta(content);
        hero(content);
        profile(content);
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
