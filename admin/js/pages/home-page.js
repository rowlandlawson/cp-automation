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

    class HomePageEditor {
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
                            <p class="eyebrow text-primary mb-2">Homepage narrative</p>
                            <h3 class="mb-2">Edit the homepage structure, proof points, and calls to action.</h3>
                            <p class="page-summary">
                                This screen controls the homepage hero, section intros, custom solutions story,
                                contact CTA, and default homepage SEO settings.
                            </p>
                        </div>
                        <div class="stack-actions">
                            <button class="btn btn-soft" id="refreshHomePageBtn" type="button">
                                <i class="fa-solid fa-rotate me-2"></i>Refresh
                            </button>
                            <button class="btn btn-primary" id="saveHomePageBtn" type="button">
                                Save home page
                            </button>
                        </div>
                    </section>

                    <div class="editor-layout">
                        <div class="editor-main">
                            <form id="homePageForm" class="editor-main" novalidate>
                                <section class="panel-card editor-section">
                                    <div class="inline-status-row mb-3">
                                        <div>
                                            <h3 class="mb-1">Publishing and hero</h3>
                                            <p class="helper-text mb-0">Control the homepage visibility and first impression.</p>
                                        </div>
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" id="homePagePublish" type="checkbox" checked />
                                            <label class="form-check-label" for="homePagePublish">Published</label>
                                        </div>
                                    </div>
                                    <div class="field-grid">
                                        <div>
                                            <label class="form-label" for="homePageSlug">Slug</label>
                                            <input class="form-control" id="homePageSlug" type="text" placeholder="home" />
                                        </div>
                                        <div>
                                            <label class="form-label" for="homeHeroEyebrow">Hero eyebrow</label>
                                            <input class="form-control" id="homeHeroEyebrow" type="text" placeholder="Trusted automation partner" />
                                        </div>
                                        <div class="field-span-full">
                                            <label class="form-label" for="homeHeroHeading">Hero heading</label>
                                            <input class="form-control" id="homeHeroHeading" type="text" required />
                                        </div>
                                        <div class="field-span-full">
                                            <label class="form-label" for="homeHeroSubheading">Hero subheading</label>
                                            <textarea class="form-control" id="homeHeroSubheading" rows="4"></textarea>
                                        </div>
                                        <div>
                                            <label class="form-label" for="homeHeroPrimaryLabel">Primary CTA label</label>
                                            <input class="form-control" id="homeHeroPrimaryLabel" type="text" />
                                        </div>
                                        <div>
                                            <label class="form-label" for="homeHeroPrimaryUrl">Primary CTA URL</label>
                                            <input class="form-control" id="homeHeroPrimaryUrl" type="text" />
                                        </div>
                                        <div>
                                            <label class="form-label" for="homeHeroSecondaryLabel">Secondary CTA label</label>
                                            <input class="form-control" id="homeHeroSecondaryLabel" type="text" />
                                        </div>
                                        <div>
                                            <label class="form-label" for="homeHeroSecondaryUrl">Secondary CTA URL</label>
                                            <input class="form-control" id="homeHeroSecondaryUrl" type="text" />
                                        </div>
                                        <div class="field-span-full">
                                            <label class="form-label" for="homeHeroStats">Hero stats</label>
                                            <textarea class="form-control" id="homeHeroStats" rows="5" placeholder="Projects Completed | 120"></textarea>
                                            <div class="helper-text mt-2">Use one stat per line in the format <code>Label | Value</code>.</div>
                                        </div>
                                        <div>
                                            <label class="form-label" for="homeHeroImage">Hero image</label>
                                            <input class="form-control" id="homeHeroImage" type="file" accept="image/*" />
                                        </div>
                                        <div>
                                            <label class="form-label" for="homeHeroImageTitle">Hero asset title</label>
                                            <input class="form-control" id="homeHeroImageTitle" type="text" />
                                        </div>
                                        <div class="field-span-full">
                                            <label class="form-label" for="homeHeroImageAlt">Hero image alt text</label>
                                            <input class="form-control" id="homeHeroImageAlt" type="text" />
                                        </div>
                                    </div>
                                    <div class="mt-3" id="homeHeroImagePreview"></div>
                                </section>

                                <section class="panel-card editor-section">
                                    <h3 class="mb-1">About summary and section intros</h3>
                                    <p class="helper-text mb-3">Shape the proof and context around the core collections on the homepage.</p>
                                    <div class="field-grid">
                                        <div>
                                            <label class="form-label" for="homeAboutTitle">About summary title</label>
                                            <input class="form-control" id="homeAboutTitle" type="text" />
                                        </div>
                                        <div>
                                            <label class="form-label" for="homeAboutCtaLabel">About CTA label</label>
                                            <input class="form-control" id="homeAboutCtaLabel" type="text" />
                                        </div>
                                        <div class="field-span-full">
                                            <label class="form-label" for="homeAboutSubtitle">About summary subtitle</label>
                                            <textarea class="form-control" id="homeAboutSubtitle" rows="3"></textarea>
                                        </div>
                                        <div>
                                            <label class="form-label" for="homeAboutCtaUrl">About CTA URL</label>
                                            <input class="form-control" id="homeAboutCtaUrl" type="text" />
                                        </div>
                                        <div>
                                            <label class="form-label" for="homeMissionTitle">Mission card title</label>
                                            <input class="form-control" id="homeMissionTitle" type="text" />
                                        </div>
                                        <div class="field-span-full">
                                            <label class="form-label" for="homeMissionBody">Mission card body</label>
                                            <textarea class="form-control" id="homeMissionBody" rows="3"></textarea>
                                        </div>
                                        <div>
                                            <label class="form-label" for="homeWhyChooseTitle">Why choose us title</label>
                                            <input class="form-control" id="homeWhyChooseTitle" type="text" />
                                        </div>
                                        <div class="field-span-full">
                                            <label class="form-label" for="homeWhyChoosePoints">Why choose us points</label>
                                            <textarea class="form-control" id="homeWhyChoosePoints" rows="5" placeholder="Reliable product engineering"></textarea>
                                            <div class="helper-text mt-2">Use one point per line.</div>
                                        </div>
                                        <div>
                                            <label class="form-label" for="homeProductsTitle">Products section title</label>
                                            <input class="form-control" id="homeProductsTitle" type="text" />
                                        </div>
                                        <div>
                                            <label class="form-label" for="homeProductsIntro">Products section intro</label>
                                            <textarea class="form-control" id="homeProductsIntro" rows="3"></textarea>
                                        </div>
                                        <div>
                                            <label class="form-label" for="homeServicesTitle">Services section title</label>
                                            <input class="form-control" id="homeServicesTitle" type="text" />
                                        </div>
                                        <div>
                                            <label class="form-label" for="homeServicesIntro">Services section intro</label>
                                            <textarea class="form-control" id="homeServicesIntro" rows="3"></textarea>
                                        </div>
                                        <div>
                                            <label class="form-label" for="homeProjectsTitle">Projects section title</label>
                                            <input class="form-control" id="homeProjectsTitle" type="text" />
                                        </div>
                                        <div>
                                            <label class="form-label" for="homeProjectsIntro">Projects section intro</label>
                                            <textarea class="form-control" id="homeProjectsIntro" rows="3"></textarea>
                                        </div>
                                        <div>
                                            <label class="form-label" for="homeTestimonialsTitle">Testimonials section title</label>
                                            <input class="form-control" id="homeTestimonialsTitle" type="text" />
                                        </div>
                                        <div>
                                            <label class="form-label" for="homeTestimonialsIntro">Testimonials section intro</label>
                                            <textarea class="form-control" id="homeTestimonialsIntro" rows="3"></textarea>
                                        </div>
                                    </div>
                                </section>

                                <section class="panel-card editor-section">
                                    <h3 class="mb-1">Custom solutions section</h3>
                                    <p class="helper-text mb-3">Control the custom-build story, feature bullets, process steps, and conversion CTA.</p>
                                    <div class="field-grid">
                                        <div>
                                            <label class="form-label" for="homeCustomTitle">Section title</label>
                                            <input class="form-control" id="homeCustomTitle" type="text" />
                                        </div>
                                        <div>
                                            <label class="form-label" for="homeCustomProcessTitle">Process title</label>
                                            <input class="form-control" id="homeCustomProcessTitle" type="text" />
                                        </div>
                                        <div class="field-span-full">
                                            <label class="form-label" for="homeCustomSubtitle">Section subtitle</label>
                                            <textarea class="form-control" id="homeCustomSubtitle" rows="3"></textarea>
                                        </div>
                                        <div>
                                            <label class="form-label" for="homeCustomDevTitle">Development card title</label>
                                            <input class="form-control" id="homeCustomDevTitle" type="text" />
                                        </div>
                                        <div>
                                            <label class="form-label" for="homeCustomCtaLabel">CTA label</label>
                                            <input class="form-control" id="homeCustomCtaLabel" type="text" />
                                        </div>
                                        <div class="field-span-full">
                                            <label class="form-label" for="homeCustomDevBody">Development card body</label>
                                            <textarea class="form-control" id="homeCustomDevBody" rows="4"></textarea>
                                        </div>
                                        <div class="field-span-full">
                                            <label class="form-label" for="homeCustomFeatures">Feature points</label>
                                            <textarea class="form-control" id="homeCustomFeatures" rows="5" placeholder="Custom circuit design and PCB development"></textarea>
                                            <div class="helper-text mt-2">Use one feature per line.</div>
                                        </div>
                                        <div class="field-span-full">
                                            <label class="form-label" for="homeCustomSteps">Process steps</label>
                                            <textarea class="form-control" id="homeCustomSteps" rows="5" placeholder="Consultation | We discuss your specific requirements"></textarea>
                                            <div class="helper-text mt-2">Use one step per line in the format <code>Step title | Step body</code>.</div>
                                        </div>
                                        <div class="field-span-full">
                                            <label class="form-label" for="homeCustomCtaUrl">CTA URL</label>
                                            <input class="form-control" id="homeCustomCtaUrl" type="text" />
                                        </div>
                                    </div>
                                </section>

                                <section class="panel-card editor-section">
                                    <h3 class="mb-1">Contact CTA and SEO</h3>
                                    <p class="helper-text mb-3">Finish the homepage with a conversion CTA and search-ready metadata.</p>
                                    <div class="field-grid">
                                        <div>
                                            <label class="form-label" for="homeContactTitle">Contact CTA title</label>
                                            <input class="form-control" id="homeContactTitle" type="text" />
                                        </div>
                                        <div>
                                            <label class="form-label" for="homeMetaTitle">Meta title</label>
                                            <input class="form-control" id="homeMetaTitle" type="text" />
                                        </div>
                                        <div class="field-span-full">
                                            <label class="form-label" for="homeContactBody">Contact CTA body</label>
                                            <textarea class="form-control" id="homeContactBody" rows="4"></textarea>
                                        </div>
                                        <div class="field-span-full">
                                            <label class="form-label" for="homeContactActions">Contact CTA actions</label>
                                            <textarea class="form-control" id="homeContactActions" rows="4" placeholder="Book consultation | https://wa.me/234..."></textarea>
                                            <div class="helper-text mt-2">Use one action per line in the format <code>Label | URL</code>.</div>
                                        </div>
                                        <div class="field-span-full">
                                            <label class="form-label" for="homeMetaDescription">Meta description</label>
                                            <textarea class="form-control" id="homeMetaDescription" rows="3"></textarea>
                                        </div>
                                    </div>
                                </section>
                            </form>
                        </div>

                        <aside class="editor-side">
                            <section class="panel-card preview-card">
                                <div class="inline-status-row mb-3">
                                    <div>
                                        <h3 class="mb-1">Homepage preview</h3>
                                        <p class="helper-text mb-0">Live summary of the homepage narrative and launch status.</p>
                                    </div>
                                    <span class="status-pill is-live">Live preview</span>
                                </div>
                                <div class="preview-stack" id="homePagePreview"></div>
                            </section>
                        </aside>
                    </div>
                </div>
            `;
        }

        static cacheElements() {
            this.form = document.getElementById("homePageForm");
            this.saveButton = document.getElementById("saveHomePageBtn");
            this.preview = document.getElementById("homePagePreview");

            this.publishInput = document.getElementById("homePagePublish");
            this.slugInput = document.getElementById("homePageSlug");
            this.heroEyebrowInput = document.getElementById("homeHeroEyebrow");
            this.heroHeadingInput = document.getElementById("homeHeroHeading");
            this.heroSubheadingInput = document.getElementById("homeHeroSubheading");
            this.heroPrimaryLabelInput = document.getElementById("homeHeroPrimaryLabel");
            this.heroPrimaryUrlInput = document.getElementById("homeHeroPrimaryUrl");
            this.heroSecondaryLabelInput = document.getElementById("homeHeroSecondaryLabel");
            this.heroSecondaryUrlInput = document.getElementById("homeHeroSecondaryUrl");
            this.heroStatsInput = document.getElementById("homeHeroStats");

            this.heroImageInput = document.getElementById("homeHeroImage");
            this.heroImageTitleInput = document.getElementById("homeHeroImageTitle");
            this.heroImageAltInput = document.getElementById("homeHeroImageAlt");
            this.heroImagePreview = document.getElementById("homeHeroImagePreview");

            this.aboutTitleInput = document.getElementById("homeAboutTitle");
            this.aboutSubtitleInput = document.getElementById("homeAboutSubtitle");
            this.aboutCtaLabelInput = document.getElementById("homeAboutCtaLabel");
            this.aboutCtaUrlInput = document.getElementById("homeAboutCtaUrl");
            this.missionTitleInput = document.getElementById("homeMissionTitle");
            this.missionBodyInput = document.getElementById("homeMissionBody");
            this.whyChooseTitleInput = document.getElementById("homeWhyChooseTitle");
            this.whyChoosePointsInput = document.getElementById("homeWhyChoosePoints");

            this.productsTitleInput = document.getElementById("homeProductsTitle");
            this.productsIntroInput = document.getElementById("homeProductsIntro");
            this.servicesTitleInput = document.getElementById("homeServicesTitle");
            this.servicesIntroInput = document.getElementById("homeServicesIntro");
            this.projectsTitleInput = document.getElementById("homeProjectsTitle");
            this.projectsIntroInput = document.getElementById("homeProjectsIntro");
            this.testimonialsTitleInput = document.getElementById("homeTestimonialsTitle");
            this.testimonialsIntroInput = document.getElementById("homeTestimonialsIntro");

            this.customTitleInput = document.getElementById("homeCustomTitle");
            this.customSubtitleInput = document.getElementById("homeCustomSubtitle");
            this.customDevTitleInput = document.getElementById("homeCustomDevTitle");
            this.customDevBodyInput = document.getElementById("homeCustomDevBody");
            this.customFeaturesInput = document.getElementById("homeCustomFeatures");
            this.customProcessTitleInput = document.getElementById("homeCustomProcessTitle");
            this.customStepsInput = document.getElementById("homeCustomSteps");
            this.customCtaLabelInput = document.getElementById("homeCustomCtaLabel");
            this.customCtaUrlInput = document.getElementById("homeCustomCtaUrl");

            this.contactTitleInput = document.getElementById("homeContactTitle");
            this.contactBodyInput = document.getElementById("homeContactBody");
            this.contactActionsInput = document.getElementById("homeContactActions");

            this.metaTitleInput = document.getElementById("homeMetaTitle");
            this.metaDescriptionInput = document.getElementById("homeMetaDescription");
        }

        static bindEvents() {
            document
                .getElementById("refreshHomePageBtn")
                .addEventListener("click", () => this.loadPage());
            this.saveButton.addEventListener("click", () => this.savePage());
            this.form.addEventListener("submit", async (event) => {
                event.preventDefault();
                await this.savePage();
            });

            this.form.querySelectorAll("input, textarea").forEach((field) => {
                field.addEventListener("input", () => this.updatePreview());
            });

            this.heroImageInput.addEventListener("change", () => {
                this.updateAssetPreview("hero");
                this.updatePreview();
            });
        }

        static createEmptyPage() {
            return {
                slug: "home",
                is_published: true,
                hero_stats: [],
                about_why_choose_points: [],
                custom_solutions_features: [],
                custom_solutions_process_steps: [],
                contact_cta_actions: [],
                hero_visual_asset: null,
                og_image_asset: null,
            };
        }

        static populateForm(page) {
            this.publishInput.checked = Boolean(page.is_published ?? true);
            this.slugInput.value = page.slug || "home";
            this.heroEyebrowInput.value = page.hero_eyebrow || "";
            this.heroHeadingInput.value = page.hero_heading || "";
            this.heroSubheadingInput.value = page.hero_subheading || "";
            this.heroPrimaryLabelInput.value = page.hero_primary_cta_label || "";
            this.heroPrimaryUrlInput.value = page.hero_primary_cta_url || "";
            this.heroSecondaryLabelInput.value = page.hero_secondary_cta_label || "";
            this.heroSecondaryUrlInput.value = page.hero_secondary_cta_url || "";
            this.heroStatsInput.value = window.AdminUI.formatStatLines(page.hero_stats);

            this.heroImageTitleInput.value = page.hero_visual_asset?.title || "";
            this.heroImageAltInput.value = page.hero_visual_asset?.alt_text || "";

            this.aboutTitleInput.value = page.about_summary_title || "";
            this.aboutSubtitleInput.value = page.about_summary_subtitle || "";
            this.aboutCtaLabelInput.value = page.about_summary_cta_label || "";
            this.aboutCtaUrlInput.value = page.about_summary_cta_url || "";
            this.missionTitleInput.value = page.about_mission_title || "";
            this.missionBodyInput.value = page.about_mission_body || "";
            this.whyChooseTitleInput.value = page.about_why_choose_title || "";
            this.whyChoosePointsInput.value = window.AdminUI.linesToText(
                page.about_why_choose_points,
            );

            this.productsTitleInput.value = page.products_section_title || "";
            this.productsIntroInput.value = page.products_section_intro || "";
            this.servicesTitleInput.value = page.services_section_title || "";
            this.servicesIntroInput.value = page.services_section_intro || "";
            this.projectsTitleInput.value = page.projects_section_title || "";
            this.projectsIntroInput.value = page.projects_section_intro || "";
            this.testimonialsTitleInput.value = page.testimonials_section_title || "";
            this.testimonialsIntroInput.value = page.testimonials_section_intro || "";

            this.customTitleInput.value = page.custom_solutions_title || "";
            this.customSubtitleInput.value = page.custom_solutions_subtitle || "";
            this.customDevTitleInput.value = page.custom_solutions_development_title || "";
            this.customDevBodyInput.value = page.custom_solutions_development_body || "";
            this.customFeaturesInput.value = window.AdminUI.linesToText(
                page.custom_solutions_features,
            );
            this.customProcessTitleInput.value = page.custom_solutions_process_title || "";
            this.customStepsInput.value = window.AdminUI.formatProcessStepLines(
                page.custom_solutions_process_steps,
            );
            this.customCtaLabelInput.value = page.custom_solutions_cta_label || "";
            this.customCtaUrlInput.value = page.custom_solutions_cta_url || "";

            this.contactTitleInput.value = page.contact_cta_title || "";
            this.contactBodyInput.value = page.contact_cta_body || "";
            this.contactActionsInput.value = window.AdminUI.formatLinkLines(
                page.contact_cta_actions,
            );

            this.metaTitleInput.value = page.meta_title || "";
            this.metaDescriptionInput.value = page.meta_description || "";

            this.heroImageInput.value = "";

            this.updateAssetPreview("hero");
            this.updatePreview();
        }

        static updateAssetPreview(kind) {
            const asset = this.state.current?.hero_visual_asset;
            const fileInput = this.heroImageInput;
            const preview = this.heroImagePreview;
            const alt =
                this.heroImageAltInput.value.trim() ||
                this.heroHeadingInput.value.trim() ||
                "Homepage hero image";

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
                "",
            );
        }

        static updatePreview() {
            const heroStats = (() => {
                try {
                    return window.AdminUI.parseStatLines(this.heroStatsInput.value);
                } catch (_error) {
                    return [];
                }
            })();
            const whyChoosePoints = window.AdminUI.splitLines(this.whyChoosePointsInput.value);
            const customFeatures = window.AdminUI.splitLines(this.customFeaturesInput.value);
            const processSteps = (() => {
                try {
                    return window.AdminUI.parseProcessStepLines(this.customStepsInput.value);
                } catch (_error) {
                    return [];
                }
            })();
            const contactActions = (() => {
                try {
                    return window.AdminUI.parseLinkLines(this.contactActionsInput.value);
                } catch (_error) {
                    return [];
                }
            })();

            this.preview.innerHTML = `
                <div class="preview-block">
                    <div class="inline-status-row mb-2">
                        <div class="preview-label">Homepage status</div>
                        ${window.AdminUI.renderStatusPill(this.publishInput.checked)}
                    </div>
                    <div class="preview-title">${window.AdminUI.escapeHTML(this.heroHeadingInput.value.trim() || "Homepage hero heading")}</div>
                    <p class="preview-copy">${window.AdminUI.safeText(this.heroSubheadingInput.value.trim(), "Add the core homepage promise here.")}</p>
                </div>

                <div class="preview-block">
                    <div class="preview-label">Hero stats</div>
                    <div class="preview-metrics">
                        ${(heroStats.length
                            ? heroStats
                            : [{ label: "Stats", value: "Add hero stats" }]
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
                    <div class="preview-label">Section rhythm</div>
                    <ul class="preview-list">
                        <li>About: ${window.AdminUI.safeText(this.aboutTitleInput.value.trim(), "Missing section title")}</li>
                        <li>Products: ${window.AdminUI.safeText(this.productsTitleInput.value.trim(), "Missing section title")}</li>
                        <li>Services: ${window.AdminUI.safeText(this.servicesTitleInput.value.trim(), "Missing section title")}</li>
                        <li>Projects: ${window.AdminUI.safeText(this.projectsTitleInput.value.trim(), "Missing section title")}</li>
                        <li>Testimonials: ${window.AdminUI.safeText(this.testimonialsTitleInput.value.trim(), "Missing section title")}</li>
                    </ul>
                </div>

                <div class="preview-block">
                    <div class="preview-label">Proof and conversion</div>
                    <ul class="preview-list">
                        <li>${window.AdminUI.safeText(whyChoosePoints[0], "Add differentiators for the About summary")}</li>
                        <li>${window.AdminUI.safeText(customFeatures[0], "Add a custom solutions feature")}</li>
                        <li>${window.AdminUI.safeText(processSteps[0]?.title, "Add the first custom process step")}</li>
                        <li>${window.AdminUI.safeText(contactActions[0]?.label, "Add a contact CTA action")}</li>
                    </ul>
                </div>

                <div class="preview-block">
                    <div class="preview-label">Media assets</div>
                    ${window.AdminUI.renderMediaSummary(this.state.current?.hero_visual_asset, "No hero asset connected yet")}
                </div>
            `;
        }

        static async loadPage() {
            this.saveButton.disabled = true;

            try {
                const page = await window.api.getHomePage();
                this.state.current = page;
                this.populateForm(page);
            } catch (error) {
                if (error.status === 404) {
                    this.state.current = this.createEmptyPage();
                    this.populateForm(this.state.current);
                    window.showAlert(
                        "Home page content is empty. Save this form to create the singleton record.",
                        "info",
                    );
                } else {
                    this.preview.innerHTML = window.AdminUI.renderEmptyState(
                        "Unable to load home page content",
                        error.message || "The home page endpoint did not respond as expected.",
                        "fa-triangle-exclamation",
                    );
                }
            } finally {
                this.saveButton.disabled = false;
            }
        }

        static async savePage() {
            window.AdminUI.setButtonBusy(this.saveButton, true, "Save home page", "Saving...");

            try {
                const heroHeading = this.heroHeadingInput.value.trim();
                if (!heroHeading) {
                    throw new Error("Hero heading is required.");
                }

                const heroStats = window.AdminUI.parseStatLines(this.heroStatsInput.value);
                const contactActions = window.AdminUI.parseLinkLines(
                    this.contactActionsInput.value,
                );
                const customProcessSteps = window.AdminUI.parseProcessStepLines(
                    this.customStepsInput.value,
                );

                const heroAsset = await syncMediaAsset({
                    altText: this.heroImageAltInput.value.trim() || heroHeading,
                    currentAsset: this.state.current?.hero_visual_asset,
                    fileInput: this.heroImageInput,
                    title: this.heroImageTitleInput.value.trim() || heroHeading,
                });

                const payload = {
                    about_mission_body: this.missionBodyInput.value.trim(),
                    about_mission_title: this.missionTitleInput.value.trim(),
                    about_summary_cta_label: this.aboutCtaLabelInput.value.trim(),
                    about_summary_cta_url: this.aboutCtaUrlInput.value.trim(),
                    about_summary_subtitle: this.aboutSubtitleInput.value.trim(),
                    about_summary_title: this.aboutTitleInput.value.trim(),
                    about_why_choose_points: window.AdminUI.splitLines(
                        this.whyChoosePointsInput.value,
                    ),
                    about_why_choose_title: this.whyChooseTitleInput.value.trim(),
                    contact_cta_actions: contactActions,
                    contact_cta_body: this.contactBodyInput.value.trim(),
                    contact_cta_title: this.contactTitleInput.value.trim(),
                    custom_solutions_cta_label: this.customCtaLabelInput.value.trim(),
                    custom_solutions_cta_url: this.customCtaUrlInput.value.trim(),
                    custom_solutions_development_body: this.customDevBodyInput.value.trim(),
                    custom_solutions_development_title: this.customDevTitleInput.value.trim(),
                    custom_solutions_features: window.AdminUI.splitLines(
                        this.customFeaturesInput.value,
                    ),
                    custom_solutions_process_steps: customProcessSteps,
                    custom_solutions_process_title: this.customProcessTitleInput.value.trim(),
                    custom_solutions_subtitle: this.customSubtitleInput.value.trim(),
                    custom_solutions_title: this.customTitleInput.value.trim(),
                    hero_eyebrow: this.heroEyebrowInput.value.trim(),
                    hero_heading: heroHeading,
                    hero_primary_cta_label: this.heroPrimaryLabelInput.value.trim(),
                    hero_primary_cta_url: this.heroPrimaryUrlInput.value.trim(),
                    hero_secondary_cta_label: this.heroSecondaryLabelInput.value.trim(),
                    hero_secondary_cta_url: this.heroSecondaryUrlInput.value.trim(),
                    hero_stats: heroStats,
                    hero_subheading: this.heroSubheadingInput.value.trim(),
                    hero_visual_asset_id: heroAsset?.id ?? null,
                    is_published: this.publishInput.checked,
                    meta_description: this.metaDescriptionInput.value.trim(),
                    meta_title: this.metaTitleInput.value.trim(),
                    og_image_asset_id: this.state.current?.og_image_asset?.id ?? null,
                    products_section_intro: this.productsIntroInput.value.trim(),
                    products_section_title: this.productsTitleInput.value.trim(),
                    projects_section_intro: this.projectsIntroInput.value.trim(),
                    projects_section_title: this.projectsTitleInput.value.trim(),
                    services_section_intro: this.servicesIntroInput.value.trim(),
                    services_section_title: this.servicesTitleInput.value.trim(),
                    slug: this.slugInput.value.trim() || "home",
                    testimonials_section_intro: this.testimonialsIntroInput.value.trim(),
                    testimonials_section_title: this.testimonialsTitleInput.value.trim(),
                };

                const savedPage = await window.api.updateHomePage(payload);
                this.state.current = savedPage;
                this.populateForm(savedPage);
                window.showAlert("Home page content updated successfully.", "success");
            } catch (error) {
                window.showAlert(error.message || "Failed to save home page content.", "danger");
            } finally {
                window.AdminUI.setButtonBusy(this.saveButton, false, "Save home page", "Saving...");
            }
        }
    }

    window.HomePageEditor = HomePageEditor;
})();
