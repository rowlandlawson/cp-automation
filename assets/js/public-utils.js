window.CPPublicUtils = (() => {
    const API_BASE_URL =
        window.__CP_API_BASE_URL ||
        (window.location.protocol === "file:" ||
        ["localhost", "127.0.0.1"].includes(window.location.hostname)
            ? "http://localhost:5000/api"
            : `${window.location.origin.replace(/\/$/, "")}/api`);

    const DEFAULT_WHATSAPP_NUMBER = "2348033417657";
    const RESPONSIVE_IMAGE_SIZES = "(max-width: 767.98px) 100vw, (max-width: 1199.98px) 50vw, 33vw";
    const DEFAULT_GENERIC_IMAGE_URL = "assets/img/28753.jpg";
    const DEFAULT_LOGO_IMAGE_URL = "assets/img/logo.jpg";
    const DEFAULT_PORTRAIT_IMAGE_URL = "assets/img/28756.jpg";
    const LOCAL_RESPONSIVE_IMAGES = {
        "assets/img/28748.jpg": "assets/img/28748-small.jpg",
        "assets/img/28752.jpg": "assets/img/28752-small.jpg",
        "assets/img/28753.jpg": "assets/img/28753-small.jpg",
        "assets/img/28756.jpg": "assets/img/28756-small.jpg",
        "assets/img/28758.jpg": "assets/img/28758-small.jpg",
    };
    const INTERNAL_ROUTE_MAP = {
        "/": "/#home",
        "/about": "/about",
        "/contact": "/#contact",
        "/custom": "/#custom",
        "/home": "/#home",
        "/products": "/#products",
        "/projects": "/projects",
        "/services": "/#services",
        "/testimonials": "/#testimonials",
    };
    const DEFAULT_PUBLIC_CONTENT = Object.freeze(window.__CP_PUBLIC_DEFAULTS || {});

    function cloneDeep(value) {
        if (typeof window.structuredClone === "function") {
            return window.structuredClone(value);
        }

        return JSON.parse(JSON.stringify(value));
    }

    function createDefaultPublicContent() {
        const content = cloneDeep(DEFAULT_PUBLIC_CONTENT);
        content.pageSections = normalizePageSectionBuckets(content.pageSections);
        return content;
    }

    function escapeHTML(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");
    }

    function safeText(value, fallback = "") {
        if (value === null || value === undefined || value === "") {
            return fallback;
        }

        return escapeHTML(value);
    }

    function truncate(value, maxLength = 180) {
        const text = String(value ?? "").trim();
        if (text.length <= maxLength) {
            return text;
        }

        return `${text.slice(0, maxLength).trim()}...`;
    }

    function isNonEmptyString(value) {
        return typeof value === "string" && value.trim().length > 0;
    }

    function joinNonEmpty(parts, separator = " | ") {
        return parts.filter(Boolean).join(separator);
    }

    function normalizeList(value) {
        if (Array.isArray(value)) {
            return value.map((item) => String(item ?? "").trim()).filter(Boolean);
        }

        if (!isNonEmptyString(value)) {
            return [];
        }

        return String(value)
            .split(/\r?\n|,|;/)
            .map((item) => item.trim())
            .filter(Boolean);
    }

    function mergeContentObject(base, incoming) {
        const merged = { ...base };

        Object.entries(incoming || {}).forEach(([key, value]) => {
            if (value !== undefined) {
                merged[key] = value;
            }
        });

        return merged;
    }

    function normalizePageSectionBuckets(value) {
        return {
            about: { ...(value?.about || {}) },
            global: { ...(value?.global || {}) },
            home: { ...(value?.home || {}) },
        };
    }

    function mapPageSectionsByKey(sections) {
        if (!Array.isArray(sections)) {
            return {};
        }

        return sections.reduce((accumulator, section) => {
            const sectionKey = String(section?.section_key ?? "").trim();
            if (!sectionKey) {
                return accumulator;
            }

            accumulator[sectionKey] = section;
            return accumulator;
        }, {});
    }

    function sanitizeUrl(url, fallback = "#contact") {
        const normalized = String(url ?? "").trim();

        if (!normalized) {
            return fallback;
        }

        if (normalized.startsWith("#")) {
            return normalized;
        }

        if (/^(https?:|mailto:|tel:)/i.test(normalized)) {
            return normalized;
        }

        if (normalized.startsWith("/")) {
            return normalized;
        }

        return fallback;
    }

    function normalizeContentUrl(url, fallback = "#contact") {
        const sanitized = sanitizeUrl(url, fallback);
        if (sanitized.startsWith("/#")) {
            return sanitized;
        }
        if (!sanitized.startsWith("/")) {
            return sanitized;
        }

        return INTERNAL_ROUTE_MAP[sanitized.toLowerCase()] || sanitized;
    }

    function isHttpUrl(url) {
        return /^https?:\/\//i.test(String(url ?? "").trim());
    }

    function buildLinkAttributes(url) {
        return isHttpUrl(url) ? ' target="_blank" rel="noopener"' : "";
    }

    function getDefaultImageUrl(kind = "general") {
        if (kind === "logo") {
            return DEFAULT_LOGO_IMAGE_URL;
        }

        if (kind === "portrait") {
            return DEFAULT_PORTRAIT_IMAGE_URL;
        }

        return DEFAULT_GENERIC_IMAGE_URL;
    }

    function resolveAssetUrl(asset, fallback = "") {
        const secureUrl = String(asset?.secure_url || "").trim();
        if (secureUrl) {
            return secureUrl;
        }

        const url = String(asset?.url || "").trim();
        return url || fallback;
    }

    function resolveAssetAlt(asset, fallback = "CP Automation image") {
        const altText = String(asset?.alt_text || "").trim();
        if (altText) {
            return altText;
        }

        const title = String(asset?.title || "").trim();
        return title || fallback;
    }

    function getResponsiveImageData(imageUrl) {
        const normalizedUrl = String(imageUrl ?? "").trim();

        if (!normalizedUrl) {
            return { sizes: RESPONSIVE_IMAGE_SIZES, src: "", srcset: "" };
        }

        if (LOCAL_RESPONSIVE_IMAGES[normalizedUrl]) {
            return {
                sizes: RESPONSIVE_IMAGE_SIZES,
                src: normalizedUrl,
                srcset: `${LOCAL_RESPONSIVE_IMAGES[normalizedUrl]} 480w, ${normalizedUrl} 800w`,
            };
        }

        if (normalizedUrl.includes("res.cloudinary.com") && normalizedUrl.includes("/upload/")) {
            const small = normalizedUrl.replace("/upload/", "/upload/f_auto,q_auto,w_480/");
            const medium = normalizedUrl.replace("/upload/", "/upload/f_auto,q_auto,w_800/");
            const large = normalizedUrl.replace("/upload/", "/upload/f_auto,q_auto,w_1200/");

            return {
                sizes: RESPONSIVE_IMAGE_SIZES,
                src: medium,
                srcset: `${small} 480w, ${medium} 800w, ${large} 1200w`,
            };
        }

        return { sizes: RESPONSIVE_IMAGE_SIZES, src: normalizedUrl, srcset: "" };
    }

    function buildImageMarkup({
        alt,
        className = "img-fluid",
        fetchPriority = "auto",
        height,
        imageStyle = "width:100%; height:100%; object-fit:cover;",
        loading = "lazy",
        placeholderClass = "",
        placeholderIcon = "bi-image",
        placeholderLabel = "",
        fallbackUrl = DEFAULT_GENERIC_IMAGE_URL,
        url,
        width,
    }) {
        const image = getResponsiveImageData(url || fallbackUrl);

        if (!image.src) {
            return `
                <div class="h-100 w-100 d-flex flex-column align-items-center justify-content-center gap-2 ${escapeHTML(placeholderClass)}">
                    <i class="bi ${escapeHTML(placeholderIcon)} fs-1"></i>
                    ${placeholderLabel ? `<span class="small fw-semibold text-center">${escapeHTML(placeholderLabel)}</span>` : ""}
                </div>
            `;
        }

        return `
            <img
                src="${escapeHTML(image.src)}"
                ${image.srcset ? `srcset="${escapeHTML(image.srcset)}"` : ""}
                sizes="${escapeHTML(image.sizes)}"
                alt="${escapeHTML(alt || "CP Automation image")}"
                class="${escapeHTML(className)}"
                style="${escapeHTML(imageStyle)}"
                ${Number.isFinite(Number(width)) ? `width="${escapeHTML(width)}"` : ""}
                ${Number.isFinite(Number(height)) ? `height="${escapeHTML(height)}"` : ""}
                loading="${escapeHTML(loading)}"
                fetchpriority="${escapeHTML(fetchPriority)}"
                decoding="async"
            >
        `;
    }

    function extractWhatsAppNumber(siteSettings) {
        const explicitNumber = String(siteSettings?.whatsapp_number ?? "").replace(/[^\d]/g, "");
        if (explicitNumber) {
            return explicitNumber;
        }

        const whatsappLink = String(siteSettings?.whatsapp_link ?? "").trim();
        const urlMatch = whatsappLink.match(/wa\.me\/(\d+)/i);
        if (urlMatch?.[1]) {
            return urlMatch[1];
        }

        return whatsappLink.replace(/[^\d]/g, "") || DEFAULT_WHATSAPP_NUMBER;
    }

    function buildWhatsAppUrl(message, siteSettings) {
        return `https://wa.me/${extractWhatsAppNumber(siteSettings)}?text=${encodeURIComponent(message)}`;
    }

    function buildPhoneHref(phone) {
        const cleaned = String(phone ?? "").replace(/[^+\d]/g, "");
        return cleaned ? `tel:${cleaned}` : "#contact";
    }

    function buildMailHref(email) {
        const normalized = String(email ?? "").trim();
        return normalized ? `mailto:${normalized}` : "#contact";
    }

    function getProductVisual(product, index) {
        const title = String(product?.name ?? "").toLowerCase();

        if (/level|water|pump|borehole|sump/.test(title))
            return { bg: "info", icon: "bi-droplet-half" };
        if (/changeover|generator|power|switch/.test(title))
            return { bg: "warning", icon: "bi-lightning-charge" };
        if (/time|timer|timed|clock/.test(title))
            return { bg: "success", icon: "bi-clock-history" };

        return [
            { bg: "primary", icon: "bi-cpu" },
            { bg: "danger", icon: "bi-sliders2" },
            { bg: "secondary", icon: "bi-gear-wide-connected" },
        ][index % 3];
    }

    function sanitizeIconName(iconName) {
        const normalized = String(iconName ?? "")
            .trim()
            .toLowerCase();
        return /^[a-z0-9-]+$/.test(normalized) ? normalized : "";
    }

    function toBootstrapIcon(iconName, fallback = "bi-stars") {
        const normalized = sanitizeIconName(iconName);
        if (!normalized) {
            return fallback;
        }

        if (/^bi-[a-z0-9-]+$/.test(normalized)) {
            return normalized;
        }

        const token = normalized
            .replace(/^fa-(solid-|regular-|brands-)?/, "")
            .replace(/^fa[srbdl]-/, "");

        return (
            {
                "arrow-right": "bi-arrow-right",
                "bars-staggered": "bi-list-nested",
                bolt: "bi-lightning-charge",
                "calendar-alt": "bi-calendar-check",
                "calendar-check": "bi-calendar-check",
                "chevron-right": "bi-chevron-right",
                envelope: "bi-envelope",
                "facebook-f": "bi-facebook",
                gear: "bi-gear",
                gears: "bi-gear-wide-connected",
                headset: "bi-headset",
                instagram: "bi-instagram",
                link: "bi-link-45deg",
                "linkedin-in": "bi-linkedin",
                "map-marker-alt": "bi-geo-alt",
                microchip: "bi-cpu",
                phone: "bi-telephone",
                robot: "bi-cpu-fill",
                "screwdriver-wrench": "bi-wrench-adjustable-circle",
                "shield-halved": "bi-shield-check",
                sliders: "bi-sliders2",
                sliders2: "bi-sliders2",
                tiktok: "bi-tiktok",
                tools: "bi-tools",
                whatsapp: "bi-whatsapp",
                "x-twitter": "bi-twitter-x",
                youtube: "bi-youtube",
            }[token] || fallback
        );
    }

    function getServiceIcon(service, index) {
        const configuredIcon = toBootstrapIcon(service?.icon_name, "");
        if (configuredIcon) {
            return configuredIcon;
        }

        const combined = `${String(service?.name ?? "").toLowerCase()} ${String(service?.description ?? "").toLowerCase()}`;
        if (/install|setup|deploy/.test(combined)) return "bi-tools";
        if (/support|help|troubleshoot/.test(combined)) return "bi-headset";
        if (/custom|tailor|bespoke/.test(combined)) return "bi-gear-wide-connected";
        if (/maintain|service|repair/.test(combined)) return "bi-shield-check";

        return ["bi-lightning-charge", "bi-wrench-adjustable-circle", "bi-cpu", "bi-sliders2"][
            index % 4
        ];
    }

    function buildStars(rating) {
        const normalizedRating = Math.max(1, Math.min(5, Number(rating) || 5));
        return Array.from(
            { length: normalizedRating },
            () => '<i class="bi bi-star-fill text-warning"></i>',
        ).join("");
    }

    function resolveStatItems(stats) {
        if (!Array.isArray(stats)) {
            return [];
        }

        return stats
            .map((item) => ({
                label: String(item?.label ?? "").trim(),
                value: String(item?.value ?? "").trim(),
            }))
            .filter((item) => item.label && item.value);
    }

    function sortByOrderIndex(items) {
        return [...items].sort((left, right) => {
            const leftOrder = Number.isFinite(Number(left?.order_index))
                ? Number(left.order_index)
                : Number.MAX_SAFE_INTEGER;
            const rightOrder = Number.isFinite(Number(right?.order_index))
                ? Number(right.order_index)
                : Number.MAX_SAFE_INTEGER;
            return leftOrder - rightOrder;
        });
    }

    function resolveProductFeatures(product) {
        if (Array.isArray(product?.feature_list) && product.feature_list.length) {
            return normalizeList(product.feature_list);
        }

        return normalizeList(product?.features).slice(0, 5);
    }

    function resolveServiceHighlights(service) {
        return normalizeList(service?.highlight_list).slice(0, 4);
    }

    function revealAnimatedElements() {
        const windowHeight = window.innerHeight;

        document.querySelectorAll(".scroll-animate").forEach((element) => {
            if (!element.closest("#home") && !element.closest("#testimonials")) {
                element.classList.add("animated");
                return;
            }

            if (element.getBoundingClientRect().top < windowHeight - 100) {
                element.classList.add("animated");
            }
        });
    }

    async function fetchCollection(endpoint) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            cache: "no-store",
        });

        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }

        return response.json();
    }

    function logFetchFailure(label, reason) {
        console.warn(`Falling back to default ${label} content.`, reason);
    }

    async function fetchPublicContent() {
        const nextContent = createDefaultPublicContent();
        const requests = [
            { endpoint: "/site-settings", key: "siteSettings", type: "singleton" },
            { endpoint: "/home-page", key: "homePage", type: "singleton" },
            { endpoint: "/about-page", key: "aboutPage", type: "singleton" },
            { endpoint: "/products", key: "products", type: "collection" },
            { endpoint: "/services", key: "services", type: "collection" },
            { endpoint: "/projects", key: "projects", type: "collection" },
            { endpoint: "/testimonials", key: "testimonials", type: "collection" },
            {
                endpoint: "/page-sections/page/HOME",
                key: "pageSections",
                pageType: "home",
                type: "page-sections",
            },
            {
                endpoint: "/page-sections/page/ABOUT",
                key: "pageSections",
                pageType: "about",
                type: "page-sections",
            },
            {
                endpoint: "/page-sections/page/GLOBAL",
                key: "pageSections",
                pageType: "global",
                type: "page-sections",
            },
        ];

        const results = await Promise.allSettled(
            requests.map((request) => fetchCollection(request.endpoint)),
        );

        results.forEach((result, index) => {
            const request = requests[index];

            if (result.status !== "fulfilled") {
                logFetchFailure(request.key, result.reason);
                return;
            }

            const value = result.value;

            if (request.type === "singleton") {
                if (!value || typeof value !== "object" || Array.isArray(value)) {
                    return;
                }

                if (
                    (request.key === "homePage" || request.key === "aboutPage") &&
                    value.is_published === false
                ) {
                    logFetchFailure(
                        `${request.key} draft`,
                        new Error("Draft content is not rendered on the public site."),
                    );
                    return;
                }

                nextContent[request.key] = mergeContentObject(nextContent[request.key], value);
                return;
            }

            if (request.type === "page-sections") {
                nextContent.pageSections = normalizePageSectionBuckets(nextContent.pageSections);
                nextContent.pageSections[request.pageType] = {
                    ...nextContent.pageSections[request.pageType],
                    ...mapPageSectionsByKey(value),
                };
                return;
            }

            if (Array.isArray(value)) {
                nextContent[request.key] = sortByOrderIndex(
                    value.filter((item) => item?.is_published !== false),
                );
            }
        });

        return nextContent;
    }

    function initNavbarCollapse() {
        const navbarCollapseEl = document.getElementById("navbarSupportedContent");
        const toggler = document.querySelector(".navbar-toggler");
        if (!navbarCollapseEl || !toggler || toggler.dataset.collapseInitialized === "true") {
            return;
        }

        toggler.dataset.collapseInitialized = "true";

        const setExpandedState = (isExpanded) => {
            navbarCollapseEl.classList.toggle("show", isExpanded);
            toggler.setAttribute("aria-expanded", String(isExpanded));
        };

        toggler.addEventListener("click", () => {
            setExpandedState(!navbarCollapseEl.classList.contains("show"));
        });

        document.addEventListener(
            "click",
            (event) => {
                if (!navbarCollapseEl.classList.contains("show")) {
                    return;
                }

                if (
                    navbarCollapseEl.contains(event.target) ||
                    (toggler && toggler.contains(event.target))
                ) {
                    return;
                }

                setExpandedState(false);
            },
            { passive: true },
        );

        document
            .querySelectorAll(".navbar-nav a.nav-link, .navbar-nav .nav-item a")
            .forEach((link) => {
                link.addEventListener("click", () => {
                    if (navbarCollapseEl.classList.contains("show")) {
                        setExpandedState(false);
                    }
                });
            });

        window.addEventListener(
            "resize",
            () => {
                if (window.innerWidth >= 992 && navbarCollapseEl.classList.contains("show")) {
                    setExpandedState(false);
                }
            },
            { passive: true },
        );
    }

    function initSmoothScrolling() {
        document.addEventListener("click", (event) => {
            const anchor = event.target.closest('a[href^="#"]');
            if (!anchor) {
                return;
            }

            const href = anchor.getAttribute("href");
            if (!href || href === "#") {
                return;
            }

            const target = document.querySelector(href);
            if (!target) {
                return;
            }

            event.preventDefault();
            target.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    }

    function initCounterAnimations() {
        document.querySelectorAll(".counter[data-count]").forEach((counter) => {
            if (counter.dataset.counterInitialized === "true") {
                return;
            }

            const target = parseInt(counter.getAttribute("data-count"), 10);
            if (!Number.isFinite(target)) {
                counter.textContent = counter.getAttribute("data-count") || "0";
                counter.dataset.counterInitialized = "true";
                return;
            }

            counter.dataset.counterInitialized = "true";
            let current = 0;
            const increment = Math.max(1, Math.ceil(target / 40));
            const timer = window.setInterval(() => {
                current += increment;

                if (current >= target) {
                    counter.textContent = String(target);
                    window.clearInterval(timer);
                    return;
                }

                counter.textContent = String(current);
            }, 30);
        });
    }

    function initTestimonialCarousel() {
        const testimonialCarousel = document.getElementById("testimonialsCarousel");
        if (!testimonialCarousel) {
            return;
        }

        if (typeof testimonialCarousel.__cpCarouselCleanup === "function") {
            testimonialCarousel.__cpCarouselCleanup();
        }

        const slides = Array.from(testimonialCarousel.querySelectorAll(".carousel-item"));
        const previousButton = testimonialCarousel.querySelector(".carousel-control-prev");
        const nextButton = testimonialCarousel.querySelector(".carousel-control-next");

        if (!slides.length) {
            testimonialCarousel.__cpCarouselCleanup = null;
            return;
        }

        let currentIndex = Math.max(
            0,
            slides.findIndex((slide) => slide.classList.contains("active")),
        );
        let intervalId = null;

        const showSlide = (nextIndex) => {
            currentIndex = (nextIndex + slides.length) % slides.length;
            slides.forEach((slide, index) => {
                slide.classList.toggle("active", index === currentIndex);
            });
        };

        const stopAutoplay = () => {
            if (intervalId !== null) {
                window.clearInterval(intervalId);
                intervalId = null;
            }
        };

        const startAutoplay = () => {
            if (
                slides.length <= 1 ||
                window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ) {
                return;
            }

            stopAutoplay();
            intervalId = window.setInterval(() => {
                showSlide(currentIndex + 1);
            }, 5000);
        };

        const moveSlide = (step) => {
            showSlide(currentIndex + step);
            startAutoplay();
        };

        const handlePrevious = (event) => {
            event.preventDefault();
            moveSlide(-1);
        };

        const handleNext = (event) => {
            event.preventDefault();
            moveSlide(1);
        };

        previousButton?.addEventListener("click", handlePrevious);
        nextButton?.addEventListener("click", handleNext);
        testimonialCarousel.addEventListener("mouseenter", stopAutoplay);
        testimonialCarousel.addEventListener("mouseleave", startAutoplay);

        showSlide(currentIndex);
        startAutoplay();

        testimonialCarousel.__cpCarouselCleanup = () => {
            stopAutoplay();
            previousButton?.removeEventListener("click", handlePrevious);
            nextButton?.removeEventListener("click", handleNext);
            testimonialCarousel.removeEventListener("mouseenter", stopAutoplay);
            testimonialCarousel.removeEventListener("mouseleave", startAutoplay);
        };
    }

    return {
        DEFAULT_PUBLIC_CONTENT,
        buildImageMarkup,
        buildLinkAttributes,
        buildMailHref,
        buildPhoneHref,
        buildStars,
        buildWhatsAppUrl,
        createDefaultPublicContent,
        escapeHTML,
        fetchPublicContent,
        getDefaultImageUrl,
        getProductVisual,
        getServiceIcon,
        initCounterAnimations,
        initNavbarCollapse,
        initSmoothScrolling,
        initTestimonialCarousel,
        joinNonEmpty,
        normalizeContentUrl,
        normalizeList,
        resolveAssetAlt,
        resolveAssetUrl,
        resolveProductFeatures,
        resolveServiceHighlights,
        resolveStatItems,
        revealAnimatedElements,
        safeText,
        toBootstrapIcon,
        truncate,
    };
})();
