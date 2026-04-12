(function () {
    const PAGE_GROUPS = {
        overview: "workspace",
        "home-page": "content",
        "about-page": "content",
        products: "collections",
        services: "collections",
        projects: "collections",
        testimonials: "collections",
        "site-settings": "admin",
        "account-settings": "admin",
    };

    const Dashboard = {
        booted: false,
        hashListenerBound: false,
        currentPage: "overview",
        pages: {
            overview: {
                title: "Overview",
                caption: "Start here, then open the exact section you want to update.",
                render: renderOverview,
            },
            "home-page": {
                title: "Homepage",
                caption: "Edit every homepage section, headline, CTA, and SEO field.",
                render: () => window.HomePageEditor.init(),
            },
            "about-page": {
                title: "About Page",
                caption: "Manage the company story, CEO profile, values, and page metadata.",
                render: () => window.AboutPageEditor.init(),
            },
            products: {
                title: "Products",
                caption: "Add, edit, reorder, and delete the products shown on the website.",
                render: () => window.ProductsPage.init(),
            },
            services: {
                title: "Services",
                caption: "Manage service cards and the public service lineup.",
                render: () => window.ServicesPage.init(),
            },
            projects: {
                title: "Projects",
                caption: "Showcase installations with images, locations, and publishing control.",
                render: () => window.ProjectsPage.init(),
            },
            testimonials: {
                title: "Testimonials",
                caption: "Control the customer proof shown on the homepage and public pages.",
                render: () => window.TestimonialsPage.init(),
            },
            "site-settings": {
                title: "Site Settings",
                caption: "Manage the logo, company details, footer content, and global contact info.",
                render: () => window.SiteSettingsPage.init(),
            },
            "account-settings": {
                title: "Account Settings",
                caption: "Update the recovery email and password for the admin account.",
                render: () => window.AccountSettingsPage.init(),
            },
        },

        init() {
            window.addEventListener("admin:auth-changed", (event) => {
                if (event.detail?.authenticated) {
                    this.boot();
                    const requestedPage =
                        window.location.hash.replace(/^#/, "") || this.currentPage;
                    this.loadPage(requestedPage, false);
                    return;
                }

                this.teardown();
            });
        },

        boot() {
            if (!this.booted) {
                this.setupNavigation();
                this.setupSidebarControls();
                this.setupLogout();
                this.booted = true;
            }

            this.refreshSessionInfo();
            this.refreshBranding();
        },

        teardown() {
            this.setSidebarOpen(false);
            this.refreshSessionInfo();
        },

        isCompactViewport() {
            if (typeof window.matchMedia === "function") {
                return window.matchMedia("(max-width: 991.98px)").matches;
            }

            return window.innerWidth <= 991;
        },

        setSidebarOpen(isOpen) {
            document.body.classList.toggle("sidebar-open", Boolean(isOpen));
        },

        refreshSessionInfo() {
            return;
        },

        refreshBranding(forceRefresh = false) {
            if (!window.AdminUI?.loadAdminBranding) {
                return;
            }

            window.AdminUI.loadAdminBranding(forceRefresh).catch(() => undefined);
        },

        setupNavigation() {
            document.querySelectorAll("[data-page]").forEach((link) => {
                link.addEventListener("click", (event) => {
                    event.preventDefault();
                    this.loadPage(event.currentTarget.getAttribute("data-page"), true, {
                        preserveSidebar: true,
                    });
                });
            });

            document.querySelectorAll("[data-nav-group-toggle]").forEach((button) => {
                button.addEventListener("click", () => {
                    const group = button.closest("[data-nav-group]");
                    if (!group) {
                        return;
                    }

                    const willOpen = !group.classList.contains("is-open");
                    group.classList.toggle("is-open", willOpen);
                    button.setAttribute("aria-expanded", willOpen ? "true" : "false");
                });
            });

            if (!this.hashListenerBound) {
                window.addEventListener("hashchange", () => {
                    const requestedPage = window.location.hash.replace(/^#/, "") || "overview";
                    if (requestedPage === this.currentPage) {
                        return;
                    }

                    this.loadPage(requestedPage, false, {
                        preserveSidebar: document.body.classList.contains("sidebar-open"),
                    });
                });
                this.hashListenerBound = true;
            }
        },

        setupSidebarControls() {
            const sidebarToggle = document.getElementById("sidebarToggle");
            const sidebarBackdrop = document.getElementById("sidebarBackdrop");

            sidebarToggle?.addEventListener("click", () => {
                this.setSidebarOpen(!document.body.classList.contains("sidebar-open"));
            });

            sidebarBackdrop?.addEventListener("click", () => {
                this.setSidebarOpen(false);
            });
        },

        setupLogout() {
            const logoutButton = document.getElementById("logoutBtn");
            if (!logoutButton) {
                return;
            }

            logoutButton.addEventListener("click", (event) => {
                event.preventDefault();
                if (window.confirm("Sign out of the admin dashboard?")) {
                    window.auth.logout();
                }
            });
        },

        openGroupForPage(page) {
            const targetGroup = PAGE_GROUPS[page];
            document.querySelectorAll("[data-nav-group]").forEach((group) => {
                const toggle = group.querySelector("[data-nav-group-toggle]");
                const shouldOpen = group.querySelector(`[data-page="${page}"]`) || false;

                if (shouldOpen) {
                    group.classList.add("is-open");
                    toggle?.setAttribute("aria-expanded", "true");
                    return;
                }

                if (!targetGroup && !group.classList.contains("is-open")) {
                    toggle?.setAttribute("aria-expanded", "false");
                }
            });
        },

        setActivePage(page) {
            document.querySelectorAll("[data-page]").forEach((link) => {
                link.classList.toggle("active", link.getAttribute("data-page") === page);
            });

            this.openGroupForPage(page);

            const pageTitle = document.getElementById("pageTitle");
            if (pageTitle) {
                pageTitle.textContent = this.pages[page]?.title || "Overview";
            }

            const pageCaption = document.getElementById("pageCaption");
            if (pageCaption) {
                pageCaption.textContent =
                    this.pages[page]?.caption ||
                    "A simple control center for your public website content.";
            }
        },

        async loadPage(page, updateHash = true, options = {}) {
            const targetPage = this.pages[page] ? page : "overview";
            const preserveSidebar = Boolean(options.preserveSidebar && this.isCompactViewport());
            this.currentPage = targetPage;
            this.setActivePage(targetPage);

            if (updateHash && window.location.hash !== `#${targetPage}`) {
                window.location.hash = targetPage;
            }

            const contentArea = document.getElementById("contentArea");
            if (!contentArea) {
                return;
            }

            try {
                await this.pages[targetPage].render();
            } catch (error) {
                contentArea.innerHTML = window.AdminUI.renderEmptyState(
                    "Unable to load page",
                    error.message || "Something went wrong while loading this view.",
                    "fa-triangle-exclamation",
                );
                window.showAlert(error.message || "Page load failed.", "danger");
            } finally {
                if (preserveSidebar) {
                    window.requestAnimationFrame(() => {
                        this.setSidebarOpen(true);
                    });
                    return;
                }

                if (this.isCompactViewport()) {
                    this.setSidebarOpen(false);
                }
            }
        },
    };

    function renderOverviewCard(title, description, page, icon, tone = "") {
        return `
            <button class="workspace-card ${tone}" type="button" data-open-page="${page}">
                <span class="workspace-card-icon">
                    <i class="fa-solid ${icon}"></i>
                </span>
                <span class="workspace-card-body">
                    <strong>${window.AdminUI.escapeHTML(title)}</strong>
                    <span>${window.AdminUI.escapeHTML(description)}</span>
                </span>
                <span class="workspace-card-arrow">
                    <i class="fa-solid fa-arrow-right"></i>
                </span>
            </button>
        `;
    }

    function renderChecklistItem(label, state, tone = "is-muted") {
        return `
            <div class="workspace-check-row">
                <span>${window.AdminUI.escapeHTML(label)}</span>
                <span class="status-pill ${tone}">${window.AdminUI.escapeHTML(state)}</span>
            </div>
        `;
    }

    async function renderOverview() {
        const contentArea = document.getElementById("contentArea");
        if (!contentArea) {
            return;
        }

        contentArea.innerHTML = `
            <div class="page-shell">
                <section class="panel-card workspace-hero">
                    <div>
                        <p class="eyebrow text-primary mb-2">Simple control center</p>
                        <h3 class="mb-2">Everything is grouped by what the admin wants to update.</h3>
                        <p class="page-summary mb-0">
                            Open a section, make the change, save it, and move on. The navigation now
                            separates website content, collections, and admin settings so the dashboard
                            feels lighter and easier to understand.
                        </p>
                    </div>
                </section>

                <section class="workspace-grid">
                    ${renderOverviewCard(
                        "Homepage",
                        "Edit hero text, section intros, CTAs, and homepage SEO.",
                        "home-page",
                        "fa-window-maximize",
                    )}
                    ${renderOverviewCard(
                        "About Page",
                        "Manage the company story, team leader profile, and value cards.",
                        "about-page",
                        "fa-user-tie",
                    )}
                    ${renderOverviewCard(
                        "Products & Services",
                        "Add, edit, and delete the collections shown on the public site.",
                        "products",
                        "fa-layer-group",
                    )}
                    ${renderOverviewCard(
                        "Brand Settings",
                        "Update logo, contact details, footer links, and company identity.",
                        "site-settings",
                        "fa-building",
                    )}
                </section>

                <section class="workspace-panels">
                    <article class="panel-card workspace-panel">
                        <div class="workspace-panel-header">
                            <div>
                                <p class="preview-label mb-2">Recommended workflow</p>
                                <h3 class="mb-0">Update content in this order</h3>
                            </div>
                        </div>
                        <div class="workspace-step-list">
                            <button class="workspace-step" type="button" data-open-page="site-settings">
                                <span class="workspace-step-count">1</span>
                                <span>
                                    <strong>Set brand basics</strong>
                                    <span>Logo, company details, footer, and contact information.</span>
                                </span>
                            </button>
                            <button class="workspace-step" type="button" data-open-page="home-page">
                                <span class="workspace-step-count">2</span>
                                <span>
                                    <strong>Update homepage sections</strong>
                                    <span>Hero, intros, custom solutions, contact CTA, and SEO.</span>
                                </span>
                            </button>
                            <button class="workspace-step" type="button" data-open-page="about-page">
                                <span class="workspace-step-count">3</span>
                                <span>
                                    <strong>Refine the About page</strong>
                                    <span>Company story, CEO profile, and value cards.</span>
                                </span>
                            </button>
                            <button class="workspace-step" type="button" data-open-page="projects">
                                <span class="workspace-step-count">4</span>
                                <span>
                                    <strong>Publish collections</strong>
                                    <span>Products, services, projects, and testimonials.</span>
                                </span>
                            </button>
                        </div>
                    </article>

                    <article class="panel-card workspace-panel" id="workspaceStatusPanel">
                        <div class="workspace-panel-header">
                            <div>
                                <p class="preview-label mb-2">Publishing status</p>
                                <h3 class="mb-0">Quick site check</h3>
                            </div>
                        </div>
                        <div class="workspace-checklist">
                            ${renderChecklistItem("Loading homepage", "Checking")}
                            ${renderChecklistItem("Loading About page", "Checking")}
                            ${renderChecklistItem("Loading projects", "Checking")}
                        </div>
                    </article>
                </section>
            </div>
        `;

        contentArea.querySelectorAll("[data-open-page]").forEach((button) => {
            button.addEventListener("click", () => {
                Dashboard.loadPage(button.getAttribute("data-open-page"), true);
            });
        });

        const [homePageResult, aboutPageResult, siteSettingsResult, projectsResult] =
            await Promise.allSettled([
                window.api.getHomePage(),
                window.api.getAboutPage(),
                window.api.getSiteSettings(),
                window.api.getProjects(),
            ]);
        const statusPanel = document.getElementById("workspaceStatusPanel");
        if (!statusPanel) {
            return;
        }

        const projectCount = projectsResult.status === "fulfilled" ? projectsResult.value.length : 0;

        statusPanel.innerHTML = `
            <div class="workspace-panel-header">
                <div>
                    <p class="preview-label mb-2">Publishing status</p>
                    <h3 class="mb-0">Quick site check</h3>
                </div>
            </div>
            <div class="workspace-checklist">
                ${renderChecklistItem(
                    "Homepage content",
                    homePageResult.status === "fulfilled" ? "Ready" : "Needs review",
                    homePageResult.status === "fulfilled" ? "is-live" : "is-danger",
                )}
                ${renderChecklistItem(
                    "About page",
                    aboutPageResult.status === "fulfilled" ? "Ready" : "Needs review",
                    aboutPageResult.status === "fulfilled" ? "is-live" : "is-danger",
                )}
                ${renderChecklistItem(
                    "Brand settings",
                    siteSettingsResult.status === "fulfilled" ? "Ready" : "Needs review",
                    siteSettingsResult.status === "fulfilled" ? "is-live" : "is-danger",
                )}
                ${renderChecklistItem("Projects published", String(projectCount))}
            </div>
        `;
    }

    window.Dashboard = Dashboard;
    Dashboard.init();
})();
