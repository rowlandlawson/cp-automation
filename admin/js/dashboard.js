(function () {
    const Dashboard = {
        booted: false,
        hashListenerBound: false,
        currentPage: "overview",
        pages: {
            overview: { title: "Overview", render: renderOverview },
            "site-settings": { title: "Settings", render: () => window.SiteSettingsPage.init() },
            "about-page": { title: "About Page", render: () => window.AboutPageEditor.init() },
            projects: { title: "Projects", render: () => window.ProjectsPage.init() },
            "account-settings": {
                title: "Account Settings",
                render: () => window.AccountSettingsPage.init(),
            },
        },

        init() {
            window.addEventListener("admin:auth-changed", (event) => {
                if (event.detail?.authenticated) {
                    this.boot();
                    const requestedPage = window.location.hash.replace("#", "") || this.currentPage;
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
            const badge = document.getElementById("apiBaseBadge");
            if (badge) {
                badge.textContent = window.AdminUI.getApiBaseUrl();
            }
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

        setActivePage(page) {
            document.querySelectorAll("[data-page]").forEach((link) => {
                link.classList.toggle("active", link.getAttribute("data-page") === page);
            });

            const pageTitle = document.getElementById("pageTitle");
            if (pageTitle) {
                pageTitle.textContent = this.pages[page]?.title || "Overview";
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
                }
            }
        },
    };

    async function renderOverview() {
        const contentArea = document.getElementById("contentArea");
        if (!contentArea) {
            return;
        }

        contentArea.innerHTML = `
            <div class="page-shell">
                <section class="panel-card page-header-card">
                    <div>
                        <p class="eyebrow text-primary mb-2">Focused workspace</p>
                        <h3 class="mb-2">Manage the core information that now drives the public site.</h3>
                        <p class="page-summary">
                            This dashboard is now centered on the sections you asked for:
                            company settings, the dedicated About page, uploaded projects, and your admin account.
                        </p>
                    </div>
                </section>

                <section class="overview-grid" id="overviewMetrics">
                    ${renderMetricCardSkeleton("Settings", "fa-building", "is-blue")}
                    ${renderMetricCardSkeleton("About Page", "fa-user-tie", "is-orange")}
                    ${renderMetricCardSkeleton("Projects", "fa-images", "is-green")}
                </section>

                <section class="insight-layout">
                    <div class="insight-card" id="systemHealthCard">
                        <h3>System health</h3>
                        <div class="system-list">
                            <div class="system-row"><span>Admin auth</span><span class="status-pill is-live">Ready</span></div>
                            <div class="system-row"><span>API base URL</span><span>${window.AdminUI.escapeHTML(window.AdminUI.getApiBaseUrl())}</span></div>
                            <div class="system-row"><span>Dashboard mode</span><span class="status-pill is-muted">Loading data</span></div>
                        </div>
                    </div>

                    <div class="insight-card">
                        <h3>Next actions</h3>
                        <div class="quick-list">
                            <div class="quick-row">
                                <div>
                                    <strong>Update brand details</strong>
                                    <div class="entity-meta">Keep the logo, company name, phone, WhatsApp, email, and footer details in sync.</div>
                                </div>
                            </div>
                            <div class="quick-row">
                                <div>
                                    <strong>Finish the About page</strong>
                                    <div class="entity-meta">Add your portrait, full bio, mission, locations, and trust signals.</div>
                                </div>
                            </div>
                            <div class="quick-row">
                                <div>
                                    <strong>Upload project images</strong>
                                    <div class="entity-meta">The homepage preview and dedicated projects page both pull from the same project records.</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        `;

        const results = await window.api.getOverviewStats();
        const metrics = [
            {
                icon: "fa-building",
                subtitle: "brand, logo, and contact layer",
                tone: "is-blue",
                value: results.siteSettings.status === "fulfilled" ? "Ready" : "Missing",
            },
            {
                icon: "fa-user-tie",
                subtitle: "founder story and About-page media",
                tone: "is-orange",
                value: results.aboutPage.status === "fulfilled" ? "Ready" : "Missing",
            },
            {
                icon: "fa-images",
                subtitle: "uploaded public project entries",
                tone: "is-green",
                value:
                    results.projects.status === "fulfilled" ? results.projects.value.length : "n/a",
            },
        ];

        const metricsContainer = document.getElementById("overviewMetrics");
        if (metricsContainer) {
            metricsContainer.innerHTML = metrics.map((metric) => renderMetricCard(metric)).join("");
        }

        const healthCard = document.getElementById("systemHealthCard");
        if (healthCard) {
            healthCard.innerHTML = `
                <h3>System health</h3>
                <div class="system-list">
                    <div class="system-row">
                        <span>Admin auth</span>
                        <span class="status-pill is-live">Ready</span>
                    </div>
                    <div class="system-row">
                        <span>Settings</span>
                        <span class="status-pill ${results.siteSettings.status === "fulfilled" ? "is-live" : "is-danger"}">
                            ${results.siteSettings.status === "fulfilled" ? "Configured" : "Missing"}
                        </span>
                    </div>
                    <div class="system-row">
                        <span>About page</span>
                        <span class="status-pill ${results.aboutPage.status === "fulfilled" ? "is-live" : "is-danger"}">
                            ${results.aboutPage.status === "fulfilled" ? "Ready" : "Missing"}
                        </span>
                    </div>
                    <div class="system-row">
                        <span>Project records</span>
                        <span>${window.AdminUI.escapeHTML(
                            results.projects.status === "fulfilled"
                                ? String(results.projects.value.length)
                                : "n/a",
                        )}</span>
                    </div>
                    <div class="system-row">
                        <span>API base URL</span>
                        <span>${window.AdminUI.escapeHTML(window.AdminUI.getApiBaseUrl())}</span>
                    </div>
                </div>
            `;
        }
    }

    function renderMetricCardSkeleton(label, icon, tone) {
        return `
            <article class="metric-card">
                <div class="metric-icon ${tone}">
                    <i class="fa-solid ${icon}"></i>
                </div>
                <div class="metric-value">...</div>
                <p class="metric-subtitle mb-0">${window.AdminUI.escapeHTML(label)}</p>
            </article>
        `;
    }

    function renderMetricCard(metric) {
        return `
            <article class="metric-card">
                <div class="metric-icon ${metric.tone}">
                    <i class="fa-solid ${metric.icon}"></i>
                </div>
                <div class="metric-value">${window.AdminUI.escapeHTML(metric.value)}</div>
                <p class="metric-subtitle">${window.AdminUI.escapeHTML(metric.subtitle)}</p>
            </article>
        `;
    }

    window.Dashboard = Dashboard;
    Dashboard.init();
})();
