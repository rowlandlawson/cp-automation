window.CPProjectsPage = (() => {
    const U = window.CPPublicUtils;
    if (!U) return { init() {} };

    const $ = (id) => document.getElementById(id);
    const esc = U.escapeHTML;
    const safe = U.safeText;
    const PAGE_SIZE = 6;
    const siteLink = (value, fallback = "/#home") => {
        const url = String(value || "").trim();
        if (/^#about$/i.test(url)) return "/about";
        if (/^#projects$/i.test(url)) return "/projects";
        if (url.startsWith("#")) return `/${url}`;
        return U.normalizeContentUrl(url || fallback, fallback);
    };
    const contactUrl = (settings) =>
        settings.whatsapp_link ||
        U.buildWhatsAppUrl("Hi, I would like to discuss a project.", settings);
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

    const state = { content: null, page: 1 };

    function currentPage() {
        const param = Number(new URLSearchParams(window.location.search).get("page") || 1);
        return Number.isInteger(param) && param > 0 ? param : 1;
    }

    function meta(content) {
        const site = content.siteSettings || {};
        const home = content.homePage || {};
        document.title = `Projects | ${site.company_name || "CP Automation"}`;
        let desc = document.querySelector('meta[name="description"]');
        if (!desc) {
            desc = document.createElement("meta");
            desc.name = "description";
            document.head.appendChild(desc);
        }
        desc.content =
            home.projects_section_intro ||
            site.meta_description ||
            "Browse recent CP Automation projects and installations.";
        let canonical = document.querySelector('link[rel="canonical"]');
        const base = String(site.canonical_base_url || "").trim().replace(/\/$/, "");
        const href = base ? `${base}/projects` : "";
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
        const box = $("projectsHeroContent");
        if (!box) return;
        const site = content.siteSettings || {};
        const home = content.homePage || {};
        const cta = contactUrl(site);
        box.innerHTML = `
            <div class="hero-clean text-center scroll-animate animate-fade-in">
                <h1 class="hero-clean-heading fw-800 text-white mb-3">${esc(home.projects_section_title || "Our Projects")}</h1>
                <p class="hero-clean-sub text-white-50 mb-5">${safe(home.projects_section_intro, "Browse recent installations and field work from CP Automation.")}</p>
                <div class="d-flex gap-3 justify-content-center flex-wrap">
                    <a href="${esc(cta)}" class="btn btn-primary px-4" ${U.buildLinkAttributes(cta)}><i class="bi bi-whatsapp me-2"></i>Book Consultation</a>
                    <a href="/about" class="btn btn-outline-light px-4">About Us</a>
                </div>
            </div>`;
    }

    function summary(items) {
        const box = $("projectsPageSummary");
        if (!box) return;
        box.innerHTML = `<h2 class="section-title mb-3">Project Library</h2><p class="lead text-muted mb-0">${items.length ? `${items.length} published project${items.length === 1 ? "" : "s"} currently available.` : "No published projects yet."}</p>`;
    }

    function listing(content) {
        const box = $("projectsListingContent");
        const pager = $("projectsPagination");
        if (!box || !pager) return;
        const items = Array.isArray(content.projects) ? content.projects : [];
        if (!items.length) {
            box.innerHTML = `<div class="col-12"><div class="public-empty-state text-center"><h3 class="h5 mb-2">Projects will appear here soon</h3><p class="text-muted mb-0">Upload projects from the admin dashboard to populate this page.</p></div></div>`;
            pager.innerHTML = "";
            return;
        }

        const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
        state.page = Math.min(currentPage(), pages);
        const start = (state.page - 1) * PAGE_SIZE;
        const visible = items.slice(start, start + PAGE_SIZE);

        box.innerHTML = visible.map((item, index) => `<div class="col-md-6 col-lg-4 scroll-animate"><div class="project-card-v2"><div class="project-card-v2-media product-theme-${["primary","warning","info","danger","success","secondary"][index % 6]}">${U.buildImageMarkup({ alt: U.resolveAssetAlt(item.image_asset, item.title || "Project image"), className: "img-fluid", imageStyle: "width:100%; height:100%; object-fit:cover;", placeholderClass: "text-dark", placeholderIcon: "bi-image", placeholderLabel: item.title || "Project image", url: U.resolveAssetUrl(item.image_asset, item.image_url) || "" })}</div><div class="project-card-v2-body"><h3 class="project-card-v2-title">${esc(item.title || "Project")}</h3><p class="project-card-v2-location"><i class="bi bi-geo-alt-fill"></i>${esc(item.location || "Nigeria")}</p><p class="project-card-v2-desc">${safe(item.description, "Recent automation installation by CP Automation.")}</p></div></div></div>`).join("");

        const button = (page, label, disabled = false, active = false) =>
            `<button class="page-number-btn${active ? " is-active" : ""}" type="button" data-page="${page}" ${disabled ? "disabled" : ""}>${esc(label)}</button>`;
        const range = Array.from({ length: pages }, (_, index) => index + 1);
        pager.innerHTML = `<div class="pagination-buttons">${button(state.page - 1, "Prev", state.page === 1)}${range.map((page) => button(page, String(page), false, page === state.page)).join("")}${button(state.page + 1, "Next", state.page === pages)}</div><p class="pagination-caption mb-0">Page ${state.page} of ${pages}</p>`;
        pager.querySelectorAll("[data-page]").forEach((element) => {
            element.addEventListener("click", () => {
                const next = Number(element.getAttribute("data-page"));
                if (!Number.isInteger(next) || next < 1 || next > pages || next === state.page) return;
                const url = new URL(window.location.href);
                if (next === 1) url.searchParams.delete("page");
                else url.searchParams.set("page", String(next));
                window.history.replaceState({}, "", url);
                listing(state.content);
                window.scrollTo({ top: 0, behavior: "smooth" });
            });
        });
    }

    function contact(content) {
        const box = $("projectsContactContent");
        if (!box) return;
        const site = content.siteSettings || {};
        const cta = contactUrl(site);
        box.innerHTML = `<div class="row justify-content-center"><div class="col-lg-8 scroll-animate"><div class="contact-cta-v2"><div class="contact-cta-v2-icon"><i class="bi bi-lightning-charge-fill"></i></div><h2 class="contact-cta-v2-title">Need a similar installation?</h2><p class="contact-cta-v2-body">Reach out to discuss a project, custom solution, or installation for your own home or business.</p><div class="d-flex gap-3 flex-wrap justify-content-center"><a href="${esc(cta)}" class="btn btn-primary px-4" ${U.buildLinkAttributes(cta)}><i class="bi bi-whatsapp me-2"></i>Book Consultation</a><a href="/about" class="btn btn-outline-primary px-4">About Us</a></div></div></div></div>`;
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
        state.content = content;
        brand(content);
        meta(content);
        hero(content);
        summary(Array.isArray(content.projects) ? content.projects : []);
        listing(content);
        contact(content);
        footer(content);
        U.revealAnimatedElements();
    }

    async function init() {
        U.initNavbarCollapse();
        state.page = currentPage();
        render(U.createDefaultPublicContent());
        try {
            render(await U.fetchPublicContent());
        } catch (error) {
            console.error("Failed to load live project content. Keeping fallback content.", error);
        }
    }

    return { init };
})();

window.CPProjectsPage.init();
