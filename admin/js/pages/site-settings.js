(function () {
    const SOCIAL_FIELDS = [
        "website",
        "whatsapp",
        "facebook",
        "instagram",
        "linkedin",
        "twitter",
        "youtube",
    ];

    async function syncMediaAsset({ fileInput, currentAsset, title, altText }) {
        const [file] = fileInput.files || [];

        if (file) {
            window.AdminUI.validateImageFile(file);
            return window.api.uploadMediaAsset(file, {
                alt_text: altText,
                title,
            });
        }

        if (!currentAsset?.id) {
            return currentAsset || null;
        }

        const currentTitle = String(currentAsset.title || "").trim();
        const currentAlt = String(currentAsset.alt_text || "").trim();
        const nextTitle = String(title || "").trim();
        const nextAlt = String(altText || "").trim();

        if (currentTitle === nextTitle && currentAlt === nextAlt) {
            return currentAsset;
        }

        return window.api.updateMediaAsset(currentAsset.id, {
            alt_text: nextAlt,
            title: nextTitle,
        });
    }

    function getAssetUrl(asset) {
        return asset?.secure_url || asset?.url || "";
    }

    class SiteSettingsPage {
        static init() {
            this.state = {
                current: null,
            };
            this.render();
            this.cacheElements();
            this.bindEvents();
            return this.loadSettings();
        }

        static render() {
            document.getElementById("contentArea").innerHTML = `
                <div class="page-shell">
                    <section class="panel-card page-header-card">
                        <div>
                            <p class="eyebrow text-primary mb-2">Brand system</p>
                            <h3 class="mb-2">Control the company identity, contact layer, and footer details.</h3>
                            <p class="page-summary">
                                This screen manages the public brand shell: business details, social links,
                                footer messaging, logo, and default SEO assets.
                            </p>
                        </div>
                        <div class="stack-actions">
                            <button class="btn btn-soft" id="refreshSiteSettingsBtn" type="button">
                                <i class="fa-solid fa-rotate me-2"></i>Refresh
                            </button>
                            <button class="btn btn-primary" id="saveSiteSettingsBtn" type="button">
                                Save settings
                            </button>
                        </div>
                    </section>

                    <div class="editor-layout">
                        <div class="editor-main">
                            <form id="siteSettingsForm" class="editor-main" novalidate>
                                <section class="panel-card editor-section">
                                    <div class="inline-status-row mb-3">
                                        <div>
                                            <h3 class="mb-1">Brand identity</h3>
                                            <p class="helper-text mb-0">Set the company name, positioning, and visual identity used across the site.</p>
                                        </div>
                                        <span class="status-pill is-live">Singleton</span>
                                    </div>
                                    <div class="field-grid">
                                        <div>
                                            <label class="form-label" for="siteCompanyName">Company name</label>
                                            <input class="form-control" id="siteCompanyName" type="text" required />
                                        </div>
                                        <div>
                                            <label class="form-label" for="siteTagline">Site tagline</label>
                                            <input class="form-control" id="siteTagline" type="text" />
                                        </div>
                                        <div class="field-span-full">
                                            <label class="form-label" for="siteCompanySummary">Company summary</label>
                                            <textarea class="form-control" id="siteCompanySummary" rows="4"></textarea>
                                        </div>
                                        <div>
                                            <label class="form-label" for="siteLogoFile">Logo image</label>
                                            <input class="form-control" id="siteLogoFile" type="file" accept="image/*" />
                                        </div>
                                        <div>
                                            <label class="form-label" for="siteLogoTitle">Logo asset title</label>
                                            <input class="form-control" id="siteLogoTitle" type="text" placeholder="CP Automation logo" />
                                        </div>
                                        <div class="field-span-full">
                                            <label class="form-label" for="siteLogoAlt">Logo alt text</label>
                                            <input class="form-control" id="siteLogoAlt" type="text" placeholder="CP Automation logo" />
                                        </div>
                                    </div>
                                    <div class="mt-3" id="siteLogoPreview"></div>
                                </section>

                                <section class="panel-card editor-section">
                                    <h3 class="mb-1">Contact and sales channels</h3>
                                    <p class="helper-text mb-3">Keep the public contact information and fast-response channels current.</p>
                                    <div class="field-grid">
                                        <div>
                                            <label class="form-label" for="sitePhone">Phone</label>
                                            <input class="form-control" id="sitePhone" type="text" />
                                        </div>
                                        <div>
                                            <label class="form-label" for="siteWhatsappNumber">WhatsApp number</label>
                                            <input class="form-control" id="siteWhatsappNumber" type="text" />
                                        </div>
                                        <div>
                                            <label class="form-label" for="siteWhatsappLink">WhatsApp link</label>
                                            <input class="form-control" id="siteWhatsappLink" type="text" placeholder="https://wa.me/234..." />
                                        </div>
                                        <div>
                                            <label class="form-label" for="siteEmail">Email</label>
                                            <input class="form-control" id="siteEmail" type="email" />
                                        </div>
                                        <div class="field-span-full">
                                            <label class="form-label" for="siteAddress">Address</label>
                                            <input class="form-control" id="siteAddress" type="text" />
                                        </div>
                                    </div>
                                </section>

                                <section class="panel-card editor-section">
                                    <h3 class="mb-1">Social links</h3>
                                    <p class="helper-text mb-3">Add the public links that power footer icons and brand discovery.</p>
                                    <div class="field-grid" id="socialFieldsGrid">
                                        ${SOCIAL_FIELDS.map(
                                            (field) => `
                                            <div>
                                                <label class="form-label" for="social-${field}">${field.charAt(0).toUpperCase()}${field.slice(1)}</label>
                                                <input class="form-control" id="social-${field}" data-social-field="${field}" type="text" placeholder="https://..." />
                                            </div>
                                        `,
                                        ).join("")}
                                    </div>
                                </section>

                                <section class="panel-card editor-section">
                                    <h3 class="mb-1">Footer messaging</h3>
                                    <p class="helper-text mb-3">Shape the closing message, quick links, and product shortcuts used across the public site.</p>
                                    <div class="field-grid">
                                        <div>
                                            <label class="form-label" for="footerMotto">Footer motto</label>
                                            <input class="form-control" id="footerMotto" type="text" />
                                        </div>
                                        <div>
                                            <label class="form-label" for="footerTagline">Footer tagline</label>
                                            <input class="form-control" id="footerTagline" type="text" />
                                        </div>
                                        <div class="field-span-full">
                                            <label class="form-label" for="footerSummary">Footer summary</label>
                                            <textarea class="form-control" id="footerSummary" rows="4"></textarea>
                                        </div>
                                        <div>
                                            <label class="form-label" for="footerQuickLinks">Quick links</label>
                                            <textarea class="form-control" id="footerQuickLinks" rows="6" placeholder="Home | #home"></textarea>
                                            <div class="helper-text mt-2">Use one link per line in the format <code>Label | URL</code>.</div>
                                        </div>
                                        <div>
                                            <label class="form-label" for="footerProductLinks">Product links</label>
                                            <textarea class="form-control" id="footerProductLinks" rows="6" placeholder="CP Level Controller | #products"></textarea>
                                            <div class="helper-text mt-2">Use one link per line in the format <code>Label | URL</code>.</div>
                                        </div>
                                    </div>
                                </section>

                                <section class="panel-card editor-section">
                                    <h3 class="mb-1">SEO defaults</h3>
                                    <p class="helper-text mb-3">Set the site-wide metadata used when a page does not provide its own override.</p>
                                    <div class="field-grid">
                                        <div>
                                            <label class="form-label" for="siteCanonicalBaseUrl">Canonical base URL</label>
                                            <input class="form-control" id="siteCanonicalBaseUrl" type="text" placeholder="https://cpautomation.com" />
                                        </div>
                                        <div>
                                            <label class="form-label" for="siteMetaTitle">Default meta title</label>
                                            <input class="form-control" id="siteMetaTitle" type="text" />
                                        </div>
                                        <div class="field-span-full">
                                            <label class="form-label" for="siteMetaDescription">Default meta description</label>
                                            <textarea class="form-control" id="siteMetaDescription" rows="3"></textarea>
                                        </div>
                                    </div>
                                </section>
                            </form>
                        </div>

                        <aside class="editor-side">
                            <section class="panel-card preview-card">
                                <div class="inline-status-row mb-3">
                                    <div>
                                        <h3 class="mb-1">Brand preview</h3>
                                        <p class="helper-text mb-0">Live summary of what visitors will see across the public site shell.</p>
                                    </div>
                                    <span class="status-pill is-live">Live preview</span>
                                </div>
                                <div class="preview-stack" id="siteSettingsPreview"></div>
                            </section>
                        </aside>
                    </div>
                </div>
            `;
        }

        static cacheElements() {
            this.form = document.getElementById("siteSettingsForm");
            this.saveButton = document.getElementById("saveSiteSettingsBtn");
            this.preview = document.getElementById("siteSettingsPreview");

            this.companyNameInput = document.getElementById("siteCompanyName");
            this.siteTaglineInput = document.getElementById("siteTagline");
            this.companySummaryInput = document.getElementById("siteCompanySummary");
            this.phoneInput = document.getElementById("sitePhone");
            this.whatsappNumberInput = document.getElementById("siteWhatsappNumber");
            this.whatsappLinkInput = document.getElementById("siteWhatsappLink");
            this.emailInput = document.getElementById("siteEmail");
            this.addressInput = document.getElementById("siteAddress");

            this.footerMottoInput = document.getElementById("footerMotto");
            this.footerTaglineInput = document.getElementById("footerTagline");
            this.footerSummaryInput = document.getElementById("footerSummary");
            this.footerQuickLinksInput = document.getElementById("footerQuickLinks");
            this.footerProductLinksInput = document.getElementById("footerProductLinks");

            this.canonicalBaseUrlInput = document.getElementById("siteCanonicalBaseUrl");
            this.metaTitleInput = document.getElementById("siteMetaTitle");
            this.metaDescriptionInput = document.getElementById("siteMetaDescription");

            this.logoFileInput = document.getElementById("siteLogoFile");
            this.logoTitleInput = document.getElementById("siteLogoTitle");
            this.logoAltInput = document.getElementById("siteLogoAlt");
            this.logoPreview = document.getElementById("siteLogoPreview");

            this.socialInputs = SOCIAL_FIELDS.reduce((record, field) => {
                record[field] = document.querySelector(`[data-social-field="${field}"]`);
                return record;
            }, {});
        }

        static bindEvents() {
            document
                .getElementById("refreshSiteSettingsBtn")
                .addEventListener("click", () => this.loadSettings());
            this.saveButton.addEventListener("click", () => this.saveSettings());
            this.form.addEventListener("submit", async (event) => {
                event.preventDefault();
                await this.saveSettings();
            });

            this.form.querySelectorAll("input, textarea").forEach((field) => {
                field.addEventListener("input", () => this.updatePreview());
            });

            this.logoFileInput.addEventListener("change", () => {
                this.updateAssetPreview("logo");
                this.updatePreview();
            });

        }

        static createEmptySettings() {
            return {
                company_name: "CP Automation",
                social_links: [],
                footer_product_links: [],
                footer_quick_links: [],
                logo_asset: null,
                default_og_image_asset: null,
            };
        }

        static populateForm(settings) {
            const socialMap = window.AdminUI.socialLinksToMap(settings.social_links);

            this.companyNameInput.value = settings.company_name || "";
            this.siteTaglineInput.value = settings.site_tagline || "";
            this.companySummaryInput.value = settings.company_summary || "";
            this.phoneInput.value = settings.phone || "";
            this.whatsappNumberInput.value = settings.whatsapp_number || "";
            this.whatsappLinkInput.value = settings.whatsapp_link || "";
            this.emailInput.value = settings.email || "";
            this.addressInput.value = settings.address || "";

            this.footerMottoInput.value = settings.footer_motto || "";
            this.footerTaglineInput.value = settings.footer_tagline || "";
            this.footerSummaryInput.value = settings.footer_summary || "";
            this.footerQuickLinksInput.value = window.AdminUI.formatLinkLines(
                settings.footer_quick_links,
            );
            this.footerProductLinksInput.value = window.AdminUI.formatLinkLines(
                settings.footer_product_links,
            );

            this.canonicalBaseUrlInput.value = settings.canonical_base_url || "";
            this.metaTitleInput.value = settings.meta_title || "";
            this.metaDescriptionInput.value = settings.meta_description || "";

            this.logoTitleInput.value = settings.logo_asset?.title || "";
            this.logoAltInput.value = settings.logo_asset?.alt_text || "";
            Object.entries(this.socialInputs).forEach(([field, input]) => {
                input.value = socialMap[field] || "";
            });

            this.logoFileInput.value = "";
            this.updateAssetPreview("logo");
            this.updatePreview();
        }

        static updateAssetPreview(kind) {
            const asset = this.state.current?.logo_asset;
            const fileInput = this.logoFileInput;
            const preview = this.logoPreview;
            const alt =
                this.logoAltInput.value.trim() ||
                this.companyNameInput.value.trim() ||
                "Company logo";

            const [file] = fileInput.files || [];
            if (file) {
                window.AdminUI.validateImageFile(file);
                window.AdminUI.setImagePreview(
                    preview,
                    window.URL.createObjectURL(file),
                    alt,
                    `${file.name} · pending upload`,
                    window.AdminUI.getDefaultImageUrl("logo"),
                );
                return;
            }

            window.AdminUI.setImagePreview(
                preview,
                getAssetUrl(asset),
                alt,
                "",
                window.AdminUI.getDefaultImageUrl("logo"),
            );
        }

        static getSocialRecord() {
            return Object.entries(this.socialInputs).reduce((record, [field, input]) => {
                const value = String(input.value || "").trim();
                if (value) {
                    record[field] = value;
                }

                return record;
            }, {});
        }

        static renderPreviewLinks(items, emptyLabel) {
            if (!items.length) {
                return `<li>${window.AdminUI.escapeHTML(emptyLabel)}</li>`;
            }

            return items
                .map(
                    (item) =>
                        `<li>${window.AdminUI.escapeHTML(item.platform || item.label)}: ${window.AdminUI.escapeHTML(item.url)}</li>`,
                )
                .join("");
        }

        static updatePreview() {
            const companyName = this.companyNameInput.value.trim() || "CP Automation";
            const socialLinks = window.AdminUI.socialMapToLinks(this.getSocialRecord());
            const quickLinks = (() => {
                try {
                    return window.AdminUI.parseLinkLines(this.footerQuickLinksInput.value);
                } catch (_error) {
                    return [];
                }
            })();
            const productLinks = (() => {
                try {
                    return window.AdminUI.parseLinkLines(this.footerProductLinksInput.value);
                } catch (_error) {
                    return [];
                }
            })();

            this.preview.innerHTML = `
                <div class="preview-block">
                    <div class="preview-label">Brand shell</div>
                    <div class="preview-title">${window.AdminUI.escapeHTML(companyName)}</div>
                    <p class="preview-copy">${window.AdminUI.safeText(this.siteTaglineInput.value.trim(), "Add a short positioning line for the brand.")}</p>
                </div>

                <div class="preview-block">
                    <div class="preview-label">Contact snapshot</div>
                    <ul class="preview-list">
                        <li>Phone: ${window.AdminUI.safeText(this.phoneInput.value.trim(), "Add a public phone number")}</li>
                        <li>Email: ${window.AdminUI.safeText(this.emailInput.value.trim(), "Add a public email address")}</li>
                        <li>WhatsApp: ${window.AdminUI.safeText(this.whatsappNumberInput.value.trim(), "Add a WhatsApp number")}</li>
                        <li>Address: ${window.AdminUI.safeText(this.addressInput.value.trim(), "Add a service address")}</li>
                    </ul>
                </div>

                <div class="preview-block">
                    <div class="preview-label">Social footprint</div>
                    <ul class="preview-list">
                        ${this.renderPreviewLinks(socialLinks, "Add social links to activate the footer icons.")}
                    </ul>
                </div>

                <div class="preview-block">
                    <div class="preview-label">Footer navigation</div>
                    <ul class="preview-list">
                        ${this.renderPreviewLinks(
                            [...quickLinks.slice(0, 2), ...productLinks.slice(0, 2)],
                            "Quick links and product links will appear here.",
                        )}
                    </ul>
                </div>

                <div class="preview-block">
                    <div class="preview-label">Media assets</div>
                    ${window.AdminUI.renderMediaSummary(this.state.current?.logo_asset, "No logo connected yet", "logo")}
                </div>
            `;
        }

        static async loadSettings() {
            this.saveButton.disabled = true;

            try {
                const settings = await window.api.getSiteSettings();
                this.state.current = settings;
                window.AdminUI.updateAdminBranding(settings);
                this.populateForm(settings);
            } catch (error) {
                if (error.status === 404) {
                    this.state.current = this.createEmptySettings();
                    window.AdminUI.updateAdminBranding(this.state.current);
                    this.populateForm(this.state.current);
                    window.showAlert(
                        "Site settings are empty. Save this form to create the singleton record.",
                        "info",
                    );
                } else {
                    this.preview.innerHTML = window.AdminUI.renderEmptyState(
                        "Unable to load site settings",
                        error.message || "The site settings endpoint did not respond as expected.",
                        "fa-triangle-exclamation",
                    );
                }
            } finally {
                this.saveButton.disabled = false;
            }
        }

        static async saveSettings() {
            window.AdminUI.setButtonBusy(this.saveButton, true, "Save settings", "Saving...");

            try {
                const companyName = this.companyNameInput.value.trim();
                if (!companyName) {
                    throw new Error("Company name is required.");
                }

                const quickLinks = window.AdminUI.parseLinkLines(this.footerQuickLinksInput.value);
                const productLinks = window.AdminUI.parseLinkLines(
                    this.footerProductLinksInput.value,
                );

                const logoAsset = await syncMediaAsset({
                    altText: this.logoAltInput.value.trim() || `${companyName} logo`,
                    currentAsset: this.state.current?.logo_asset,
                    fileInput: this.logoFileInput,
                    title: this.logoTitleInput.value.trim() || `${companyName} logo`,
                });
                const payload = {
                    address: this.addressInput.value.trim(),
                    canonical_base_url: this.canonicalBaseUrlInput.value.trim(),
                    company_name: companyName,
                    company_summary: this.companySummaryInput.value.trim(),
                    default_og_image_asset_id: this.state.current?.default_og_image_asset?.id ?? null,
                    email: this.emailInput.value.trim(),
                    footer_motto: this.footerMottoInput.value.trim(),
                    footer_product_links: productLinks,
                    footer_quick_links: quickLinks,
                    footer_summary: this.footerSummaryInput.value.trim(),
                    footer_tagline: this.footerTaglineInput.value.trim(),
                    logo_asset_id: logoAsset?.id ?? null,
                    meta_description: this.metaDescriptionInput.value.trim(),
                    meta_title: this.metaTitleInput.value.trim(),
                    phone: this.phoneInput.value.trim(),
                    site_tagline: this.siteTaglineInput.value.trim(),
                    social_links: Object.entries(this.getSocialRecord()).map(([platform, url]) => ({
                        platform,
                        url,
                    })),
                    whatsapp_link: this.whatsappLinkInput.value.trim(),
                    whatsapp_number: this.whatsappNumberInput.value.trim(),
                };

                const savedSettings = await window.api.updateSiteSettings(payload);
                this.state.current = savedSettings;
                window.AdminUI.updateAdminBranding(savedSettings);
                this.populateForm(savedSettings);
                window.showAlert("Site settings updated successfully.", "success");
            } catch (error) {
                window.showAlert(error.message || "Failed to save site settings.", "danger");
            } finally {
                window.AdminUI.setButtonBusy(this.saveButton, false, "Save settings", "Saving...");
            }
        }
    }

    window.SiteSettingsPage = SiteSettingsPage;
})();
