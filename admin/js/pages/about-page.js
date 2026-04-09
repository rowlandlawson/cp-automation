(function () {
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

    class AboutPageEditor {
        static init() {
            this.state = {
                current: null,
            };
            this.render();
            this.cacheElements();
            this.bindEvents();
            return this.loadPage();
        }

        static render() {
            document.getElementById("contentArea").innerHTML = `
                <div class="page-shell">
                    <section class="panel-card page-header-card">
                        <div>
                            <p class="eyebrow text-primary mb-2">Founder story</p>
                            <h3 class="mb-2">Manage the dedicated About page, portrait, and credibility layer.</h3>
                            <p class="page-summary">
                                This editor controls the founder profile, company story, mission and vision,
                                service reach, trust signals, and About-page SEO.
                            </p>
                        </div>
                        <div class="stack-actions">
                            <button class="btn btn-soft" id="refreshAboutPageBtn" type="button">
                                <i class="fa-solid fa-rotate me-2"></i>Refresh
                            </button>
                            <button class="btn btn-primary" id="saveAboutPageBtn" type="button">
                                Save about page
                            </button>
                        </div>
                    </section>

                    <div class="editor-layout">
                        <div class="editor-main">
                            <form id="aboutPageForm" class="editor-main" novalidate>
                                <section class="panel-card editor-section">
                                    <div class="inline-status-row mb-3">
                                        <div>
                                            <h3 class="mb-1">Page setup</h3>
                                            <p class="helper-text mb-0">Control visibility and the top-level positioning for the About page.</p>
                                        </div>
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" id="aboutPagePublish" type="checkbox" checked />
                                            <label class="form-check-label" for="aboutPagePublish">Published</label>
                                        </div>
                                    </div>
                                    <div class="field-grid">
                                        <div>
                                            <label class="form-label" for="aboutPageSlug">Slug</label>
                                            <input class="form-control" id="aboutPageSlug" type="text" placeholder="about" />
                                        </div>
                                        <div>
                                            <label class="form-label" for="aboutYears">Years of experience</label>
                                            <input class="form-control" id="aboutYears" type="number" min="0" />
                                        </div>
                                        <div class="field-span-full">
                                            <label class="form-label" for="aboutPageTitle">Page title</label>
                                            <input class="form-control" id="aboutPageTitle" type="text" />
                                        </div>
                                        <div class="field-span-full">
                                            <label class="form-label" for="aboutPageSubtitle">Page subtitle</label>
                                            <textarea class="form-control" id="aboutPageSubtitle" rows="3"></textarea>
                                        </div>
                                    </div>
                                </section>

                                <section class="panel-card editor-section">
                                    <h3 class="mb-1">Founder profile and portrait</h3>
                                    <p class="helper-text mb-3">Add the human story, role, summary bio, and portrait metadata used for the page.</p>
                                    <div class="field-grid">
                                        <div>
                                            <label class="form-label" for="aboutFounderName">Founder / admin name</label>
                                            <input class="form-control" id="aboutFounderName" type="text" required />
                                        </div>
                                        <div>
                                            <label class="form-label" for="aboutFounderRole">Founder / admin role</label>
                                            <input class="form-control" id="aboutFounderRole" type="text" />
                                        </div>
                                        <div class="field-span-full">
                                            <label class="form-label" for="aboutShortBio">Short bio</label>
                                            <textarea class="form-control" id="aboutShortBio" rows="4"></textarea>
                                        </div>
                                        <div class="field-span-full">
                                            <label class="form-label" for="aboutPortraitFile">Portrait image</label>
                                            <input class="form-control" id="aboutPortraitFile" type="file" accept="image/*" />
                                        </div>
                                        <div>
                                            <label class="form-label" for="aboutPortraitTitle">Portrait asset title</label>
                                            <input class="form-control" id="aboutPortraitTitle" type="text" />
                                        </div>
                                        <div>
                                            <label class="form-label" for="aboutPortraitAlt">Portrait alt text</label>
                                            <input class="form-control" id="aboutPortraitAlt" type="text" />
                                        </div>
                                    </div>
                                    <div class="mt-3" id="aboutPortraitPreview"></div>
                                </section>

                                <section class="panel-card editor-section">
                                    <h3 class="mb-1">Story, mission, and vision</h3>
                                    <p class="helper-text mb-3">Capture the longer founder narrative and the business direction behind the brand.</p>
                                    <div class="field-grid">
                                        <div class="field-span-full">
                                            <label class="form-label" for="aboutLongStory">Long story</label>
                                            <textarea class="form-control" id="aboutLongStory" rows="6"></textarea>
                                        </div>
                                        <div class="field-span-full">
                                            <label class="form-label" for="aboutMission">Mission</label>
                                            <textarea class="form-control" id="aboutMission" rows="4"></textarea>
                                        </div>
                                        <div class="field-span-full">
                                            <label class="form-label" for="aboutVision">Vision</label>
                                            <textarea class="form-control" id="aboutVision" rows="4"></textarea>
                                        </div>
                                    </div>
                                </section>

                                <section class="panel-card editor-section">
                                    <h3 class="mb-1">Credibility and reach</h3>
                                    <p class="helper-text mb-3">List the values, certifications, stats, locations, and differentiators that build trust.</p>
                                    <div class="field-grid">
                                        <div>
                                            <label class="form-label" for="aboutValues">Values</label>
                                            <textarea class="form-control" id="aboutValues" rows="5" placeholder="Reliability"></textarea>
                                            <div class="helper-text mt-2">Use one value per line.</div>
                                        </div>
                                        <div>
                                            <label class="form-label" for="aboutCertifications">Certifications</label>
                                            <textarea class="form-control" id="aboutCertifications" rows="5" placeholder="Professional certification"></textarea>
                                            <div class="helper-text mt-2">Use one certification per line.</div>
                                        </div>
                                        <div>
                                            <label class="form-label" for="aboutStats">Credibility stats</label>
                                            <textarea class="form-control" id="aboutStats" rows="5" placeholder="Projects completed | 120"></textarea>
                                            <div class="helper-text mt-2">Use one stat per line in the format <code>Label | Value</code>.</div>
                                        </div>
                                        <div>
                                            <label class="form-label" for="aboutLocations">Service locations</label>
                                            <textarea class="form-control" id="aboutLocations" rows="5" placeholder="Port Harcourt"></textarea>
                                            <div class="helper-text mt-2">Use one location per line.</div>
                                        </div>
                                        <div class="field-span-full">
                                            <label class="form-label" for="aboutCredibilityPoints">Credibility points</label>
                                            <textarea class="form-control" id="aboutCredibilityPoints" rows="5" placeholder="Trusted installation partner across Nigeria"></textarea>
                                            <div class="helper-text mt-2">Use one trust point per line.</div>
                                        </div>
                                    </div>
                                </section>

                                <section class="panel-card editor-section">
                                    <h3 class="mb-1">CTA and SEO</h3>
                                    <p class="helper-text mb-3">Manage the primary About-page CTA and the metadata shown when the page is shared.</p>
                                    <div class="field-grid">
                                        <div>
                                            <label class="form-label" for="aboutPrimaryCtaLabel">Primary CTA label</label>
                                            <input class="form-control" id="aboutPrimaryCtaLabel" type="text" />
                                        </div>
                                        <div>
                                            <label class="form-label" for="aboutPrimaryCtaUrl">Primary CTA URL</label>
                                            <input class="form-control" id="aboutPrimaryCtaUrl" type="text" />
                                        </div>
                                        <div>
                                            <label class="form-label" for="aboutMetaTitle">Meta title</label>
                                            <input class="form-control" id="aboutMetaTitle" type="text" />
                                        </div>
                                        <div class="field-span-full">
                                            <label class="form-label" for="aboutMetaDescription">Meta description</label>
                                            <textarea class="form-control" id="aboutMetaDescription" rows="3"></textarea>
                                        </div>
                                        <div>
                                            <label class="form-label" for="aboutOgImage">OG image</label>
                                            <input class="form-control" id="aboutOgImage" type="file" accept="image/*" />
                                        </div>
                                        <div>
                                            <label class="form-label" for="aboutOgImageTitle">OG asset title</label>
                                            <input class="form-control" id="aboutOgImageTitle" type="text" />
                                        </div>
                                        <div class="field-span-full">
                                            <label class="form-label" for="aboutOgImageAlt">OG image alt text</label>
                                            <input class="form-control" id="aboutOgImageAlt" type="text" />
                                        </div>
                                    </div>
                                    <div class="mt-3" id="aboutOgPreview"></div>
                                </section>
                            </form>
                        </div>

                        <aside class="editor-side">
                            <section class="panel-card preview-card">
                                <div class="inline-status-row mb-3">
                                    <div>
                                        <h3 class="mb-1">About-page preview</h3>
                                        <p class="helper-text mb-0">Live summary of the founder profile, trust signals, and page readiness.</p>
                                    </div>
                                    <span class="status-pill is-live">Live preview</span>
                                </div>
                                <div class="preview-stack" id="aboutPagePreview"></div>
                            </section>
                        </aside>
                    </div>
                </div>
            `;
        }

        static cacheElements() {
            this.form = document.getElementById("aboutPageForm");
            this.saveButton = document.getElementById("saveAboutPageBtn");
            this.preview = document.getElementById("aboutPagePreview");

            this.publishInput = document.getElementById("aboutPagePublish");
            this.slugInput = document.getElementById("aboutPageSlug");
            this.yearsInput = document.getElementById("aboutYears");
            this.pageTitleInput = document.getElementById("aboutPageTitle");
            this.pageSubtitleInput = document.getElementById("aboutPageSubtitle");

            this.founderNameInput = document.getElementById("aboutFounderName");
            this.founderRoleInput = document.getElementById("aboutFounderRole");
            this.shortBioInput = document.getElementById("aboutShortBio");
            this.portraitFileInput = document.getElementById("aboutPortraitFile");
            this.portraitTitleInput = document.getElementById("aboutPortraitTitle");
            this.portraitAltInput = document.getElementById("aboutPortraitAlt");
            this.portraitPreview = document.getElementById("aboutPortraitPreview");

            this.longStoryInput = document.getElementById("aboutLongStory");
            this.missionInput = document.getElementById("aboutMission");
            this.visionInput = document.getElementById("aboutVision");

            this.valuesInput = document.getElementById("aboutValues");
            this.certificationsInput = document.getElementById("aboutCertifications");
            this.statsInput = document.getElementById("aboutStats");
            this.locationsInput = document.getElementById("aboutLocations");
            this.credibilityPointsInput = document.getElementById("aboutCredibilityPoints");

            this.primaryCtaLabelInput = document.getElementById("aboutPrimaryCtaLabel");
            this.primaryCtaUrlInput = document.getElementById("aboutPrimaryCtaUrl");
            this.metaTitleInput = document.getElementById("aboutMetaTitle");
            this.metaDescriptionInput = document.getElementById("aboutMetaDescription");
            this.ogImageInput = document.getElementById("aboutOgImage");
            this.ogImageTitleInput = document.getElementById("aboutOgImageTitle");
            this.ogImageAltInput = document.getElementById("aboutOgImageAlt");
            this.ogPreview = document.getElementById("aboutOgPreview");
        }

        static bindEvents() {
            document
                .getElementById("refreshAboutPageBtn")
                .addEventListener("click", () => this.loadPage());
            this.saveButton.addEventListener("click", () => this.savePage());
            this.form.addEventListener("submit", async (event) => {
                event.preventDefault();
                await this.savePage();
            });

            this.form.querySelectorAll("input, textarea").forEach((field) => {
                field.addEventListener("input", () => this.updatePreview());
            });

            this.portraitFileInput.addEventListener("change", () => {
                this.updateAssetPreview("portrait");
                this.updatePreview();
            });

            this.ogImageInput.addEventListener("change", () => {
                this.updateAssetPreview("og");
                this.updatePreview();
            });
        }

        static createEmptyPage() {
            return {
                slug: "about",
                is_published: true,
                values: [],
                certifications: [],
                stats: [],
                service_locations: [],
                credibility_points: [],
                portrait_asset: null,
                og_image_asset: null,
            };
        }

        static populateForm(page) {
            this.publishInput.checked = Boolean(page.is_published ?? true);
            this.slugInput.value = page.slug || "about";
            this.yearsInput.value = page.years_of_experience ?? "";
            this.pageTitleInput.value = page.page_title || "";
            this.pageSubtitleInput.value = page.page_subtitle || "";

            this.founderNameInput.value = page.founder_name || "";
            this.founderRoleInput.value = page.founder_role || "";
            this.shortBioInput.value = page.short_bio || "";
            this.portraitTitleInput.value = page.portrait_asset?.title || "";
            this.portraitAltInput.value = page.portrait_asset?.alt_text || "";

            this.longStoryInput.value = page.long_story || "";
            this.missionInput.value = page.mission || "";
            this.visionInput.value = page.vision || "";

            this.valuesInput.value = window.AdminUI.linesToText(page.values);
            this.certificationsInput.value = window.AdminUI.linesToText(page.certifications);
            this.statsInput.value = window.AdminUI.formatStatLines(page.stats);
            this.locationsInput.value = window.AdminUI.linesToText(page.service_locations);
            this.credibilityPointsInput.value = window.AdminUI.linesToText(page.credibility_points);

            this.primaryCtaLabelInput.value = page.primary_cta_label || "";
            this.primaryCtaUrlInput.value = page.primary_cta_url || "";
            this.metaTitleInput.value = page.meta_title || "";
            this.metaDescriptionInput.value = page.meta_description || "";
            this.ogImageTitleInput.value = page.og_image_asset?.title || "";
            this.ogImageAltInput.value = page.og_image_asset?.alt_text || "";

            this.portraitFileInput.value = "";
            this.ogImageInput.value = "";

            this.updateAssetPreview("portrait");
            this.updateAssetPreview("og");
            this.updatePreview();
        }

        static updateAssetPreview(kind) {
            const asset =
                kind === "portrait"
                    ? this.state.current?.portrait_asset
                    : this.state.current?.og_image_asset;
            const fileInput = kind === "portrait" ? this.portraitFileInput : this.ogImageInput;
            const preview = kind === "portrait" ? this.portraitPreview : this.ogPreview;
            const alt =
                kind === "portrait"
                    ? this.portraitAltInput.value.trim() ||
                      this.founderNameInput.value.trim() ||
                      "Founder portrait"
                    : this.ogImageAltInput.value.trim() ||
                      this.pageTitleInput.value.trim() ||
                      "About-page social preview image";

            const [file] = fileInput.files || [];
            if (file) {
                window.AdminUI.validateImageFile(file);
                window.AdminUI.setImagePreview(
                    preview,
                    window.URL.createObjectURL(file),
                    alt,
                    `${file.name} · pending upload`,
                );
                return;
            }

            window.AdminUI.setImagePreview(
                preview,
                getAssetUrl(asset),
                alt,
                asset?.id ? `Asset ID ${asset.id}` : "",
            );
        }

        static updatePreview() {
            const stats = (() => {
                try {
                    return window.AdminUI.parseStatLines(this.statsInput.value);
                } catch (_error) {
                    return [];
                }
            })();
            const values = window.AdminUI.splitLines(this.valuesInput.value);
            const locations = window.AdminUI.splitLines(this.locationsInput.value);
            const credibilityPoints = window.AdminUI.splitLines(this.credibilityPointsInput.value);

            this.preview.innerHTML = `
                <div class="preview-block">
                    <div class="inline-status-row mb-2">
                        <div class="preview-label">About-page status</div>
                        ${window.AdminUI.renderStatusPill(this.publishInput.checked)}
                    </div>
                    <div class="preview-title">${window.AdminUI.escapeHTML(this.pageTitleInput.value.trim() || "About page title")}</div>
                    <p class="preview-copy">${window.AdminUI.safeText(this.pageSubtitleInput.value.trim(), "Add a subtitle that explains the founder story and company credibility.")}</p>
                </div>

                <div class="preview-block">
                    <div class="preview-label">Founder profile</div>
                    <ul class="preview-list">
                        <li>${window.AdminUI.safeText(this.founderNameInput.value.trim(), "Add the founder or admin name")}</li>
                        <li>${window.AdminUI.safeText(this.founderRoleInput.value.trim(), "Add the founder role")}</li>
                        <li>${window.AdminUI.safeText(this.shortBioInput.value.trim(), "Add the short bio")}</li>
                    </ul>
                </div>

                <div class="preview-block">
                    <div class="preview-label">Trust signals</div>
                    <div class="preview-metrics">
                        ${(stats.length
                            ? stats
                            : [{ label: "Stats", value: "Add credibility stats" }]
                        )
                            .slice(0, 4)
                            .map(
                                (item) => `
                            <div class="preview-metric">
                                <strong>${window.AdminUI.escapeHTML(item.value)}</strong>
                                <span>${window.AdminUI.escapeHTML(item.label)}</span>
                            </div>
                        `,
                            )
                            .join("")}
                    </div>
                </div>

                <div class="preview-block">
                    <div class="preview-label">Values and coverage</div>
                    <ul class="preview-list">
                        <li>${window.AdminUI.safeText(values[0], "Add a core value")}</li>
                        <li>${window.AdminUI.safeText(locations[0], "Add a service location")}</li>
                        <li>${window.AdminUI.safeText(credibilityPoints[0], "Add a credibility point")}</li>
                    </ul>
                </div>

                <div class="preview-block">
                    <div class="preview-label">Media assets</div>
                    ${window.AdminUI.renderMediaSummary(this.state.current?.portrait_asset, "No founder portrait connected yet")}
                    <div class="section-divider"></div>
                    ${window.AdminUI.renderMediaSummary(this.state.current?.og_image_asset, "No About-page OG image connected yet")}
                </div>
            `;
        }

        static async loadPage() {
            this.saveButton.disabled = true;

            try {
                const page = await window.api.getAboutPage();
                this.state.current = page;
                this.populateForm(page);
            } catch (error) {
                if (error.status === 404) {
                    this.state.current = this.createEmptyPage();
                    this.populateForm(this.state.current);
                    window.showAlert(
                        "About page content is empty. Save this form to create the singleton record.",
                        "info",
                    );
                } else {
                    this.preview.innerHTML = window.AdminUI.renderEmptyState(
                        "Unable to load About page content",
                        error.message || "The About page endpoint did not respond as expected.",
                        "fa-triangle-exclamation",
                    );
                }
            } finally {
                this.saveButton.disabled = false;
            }
        }

        static async savePage() {
            window.AdminUI.setButtonBusy(this.saveButton, true, "Save about page", "Saving...");

            try {
                const founderName = this.founderNameInput.value.trim();
                if (!founderName) {
                    throw new Error("Founder or admin name is required.");
                }

                const stats = window.AdminUI.parseStatLines(this.statsInput.value);
                const ogAsset = await syncMediaAsset({
                    altText:
                        this.ogImageAltInput.value.trim() ||
                        `${founderName} about-page social preview`,
                    currentAsset: this.state.current?.og_image_asset,
                    fileInput: this.ogImageInput,
                    title:
                        this.ogImageTitleInput.value.trim() || `${founderName} About page OG image`,
                });

                const formData = new window.FormData();
                formData.append("slug", this.slugInput.value.trim() || "about");
                formData.append("is_published", this.publishInput.checked ? "true" : "false");
                formData.append("page_title", this.pageTitleInput.value.trim());
                formData.append("page_subtitle", this.pageSubtitleInput.value.trim());
                formData.append("founder_name", founderName);
                formData.append("founder_role", this.founderRoleInput.value.trim());
                formData.append("short_bio", this.shortBioInput.value.trim());
                formData.append("long_story", this.longStoryInput.value.trim());
                formData.append("mission", this.missionInput.value.trim());
                formData.append("vision", this.visionInput.value.trim());
                formData.append(
                    "values",
                    JSON.stringify(window.AdminUI.splitLines(this.valuesInput.value)),
                );
                formData.append(
                    "certifications",
                    JSON.stringify(window.AdminUI.splitLines(this.certificationsInput.value)),
                );
                formData.append(
                    "years_of_experience",
                    this.yearsInput.value ? String(this.yearsInput.value) : "",
                );
                formData.append("stats", JSON.stringify(stats));
                formData.append(
                    "service_locations",
                    JSON.stringify(window.AdminUI.splitLines(this.locationsInput.value)),
                );
                formData.append(
                    "credibility_points",
                    JSON.stringify(window.AdminUI.splitLines(this.credibilityPointsInput.value)),
                );
                formData.append("primary_cta_label", this.primaryCtaLabelInput.value.trim());
                formData.append("primary_cta_url", this.primaryCtaUrlInput.value.trim());
                formData.append("meta_title", this.metaTitleInput.value.trim());
                formData.append("meta_description", this.metaDescriptionInput.value.trim());
                formData.append("og_image_asset_id", ogAsset?.id ? String(ogAsset.id) : "null");
                formData.append(
                    "portrait_title",
                    this.portraitTitleInput.value.trim() || `${founderName} portrait`,
                );
                formData.append(
                    "portrait_alt_text",
                    this.portraitAltInput.value.trim() || `${founderName} portrait`,
                );

                const [portraitFile] = this.portraitFileInput.files || [];
                if (portraitFile) {
                    window.AdminUI.validateImageFile(portraitFile);
                    formData.append("portrait", portraitFile);
                }

                const savedPage = await window.api.updateAboutPage(formData);

                if (!portraitFile && this.state.current?.portrait_asset?.id) {
                    await window.api.updateMediaAsset(this.state.current.portrait_asset.id, {
                        alt_text: this.portraitAltInput.value.trim() || `${founderName} portrait`,
                        title: this.portraitTitleInput.value.trim() || `${founderName} portrait`,
                    });
                }

                this.state.current = await window.api.getAboutPage();
                this.populateForm(this.state.current);
                window.showAlert("About page content updated successfully.", "success");
            } catch (error) {
                window.showAlert(error.message || "Failed to save About page content.", "danger");
            } finally {
                window.AdminUI.setButtonBusy(
                    this.saveButton,
                    false,
                    "Save about page",
                    "Saving...",
                );
            }
        }
    }

    window.AboutPageEditor = AboutPageEditor;
})();
