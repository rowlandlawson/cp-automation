(function () {
    class ContentPage {
        static init() {
            this.render();
            this.cacheElements();
            this.bindEvents();
            return this.loadSections();
        }

        static render() {
            document.getElementById("contentArea").innerHTML = `
                <div class="page-shell">
                    <section class="panel-card page-header-card">
                        <div>
                            <p class="eyebrow text-primary mb-2">Reusable copy blocks</p>
                            <h3 class="mb-2">Manage the text sections that power the public website.</h3>
                            <p class="page-summary">
                                Use named content sections for hero copy, about text, call-to-actions,
                                contact notes, and any other reusable block you want to update quickly.
                            </p>
                        </div>
                        <div class="stack-actions">
                            <button class="btn btn-soft" id="refreshContentBtn" type="button">
                                <i class="fa-solid fa-rotate me-2"></i>Refresh
                            </button>
                            <button class="btn btn-primary" id="addContentBtn" type="button">
                                <i class="fa-solid fa-plus me-2"></i>New section
                            </button>
                        </div>
                    </section>

                    <section class="page-layout">
                        <div class="form-card is-hidden" id="contentFormCard">
                            <div class="card-title-row">
                                <div>
                                    <h4 class="mb-1" id="contentFormTitle">New content section</h4>
                                    <p class="helper-text mb-0">
                                        Give each block a stable section name so the frontend can reuse it reliably.
                                    </p>
                                </div>
                                <button class="btn btn-soft btn-sm" id="cancelContentBtn" type="button">Close</button>
                            </div>

                            <div class="panel-card subtle-panel mb-4">
                                <p class="helper-text mb-2">Suggested section names</p>
                                <div class="stack-actions wrap-actions">
                                    <button class="btn btn-soft btn-sm" data-template="hero_intro" type="button">hero_intro</button>
                                    <button class="btn btn-soft btn-sm" data-template="about_intro" type="button">about_intro</button>
                                    <button class="btn btn-soft btn-sm" data-template="services_overview" type="button">services_overview</button>
                                    <button class="btn btn-soft btn-sm" data-template="products_overview" type="button">products_overview</button>
                                    <button class="btn btn-soft btn-sm" data-template="contact_cta" type="button">contact_cta</button>
                                </div>
                            </div>

                            <form id="contentForm" novalidate>
                                <div class="mb-3">
                                    <label class="form-label" for="contentSectionName">Section name</label>
                                    <input
                                        class="form-control"
                                        id="contentSectionName"
                                        type="text"
                                        placeholder="hero_intro"
                                        required
                                    />
                                    <div class="helper-text mt-2">
                                        Use lowercase names with underscores so they stay predictable in code.
                                    </div>
                                </div>

                                <div class="mb-4">
                                    <label class="form-label" for="contentSectionBody">Content</label>
                                    <textarea
                                        class="form-control content-editor"
                                        id="contentSectionBody"
                                        rows="10"
                                        placeholder="Write the copy for this reusable section..."
                                    ></textarea>
                                </div>

                                <div class="stack-actions">
                                    <button class="btn btn-primary" id="saveContentBtn" type="submit">Save section</button>
                                    <button class="btn btn-soft" id="resetContentBtn" type="button">Reset</button>
                                </div>
                            </form>
                        </div>

                        <div class="table-card">
                            <div class="table-responsive">
                                <table class="table align-middle">
                                    <thead>
                                        <tr>
                                            <th>Section</th>
                                            <th>Preview</th>
                                            <th>Updated</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="contentTableBody">
                                        ${window.AdminUI.renderLoadingTable(4, "Loading content sections...")}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                </div>
            `;
        }

        static cacheElements() {
            this.form = document.getElementById("contentForm");
            this.formCard = document.getElementById("contentFormCard");
            this.formTitle = document.getElementById("contentFormTitle");
            this.tableBody = document.getElementById("contentTableBody");
            this.sectionNameInput = document.getElementById("contentSectionName");
            this.contentInput = document.getElementById("contentSectionBody");
            this.saveButton = document.getElementById("saveContentBtn");
        }

        static bindEvents() {
            document
                .getElementById("addContentBtn")
                .addEventListener("click", () => this.openCreateForm());
            document
                .getElementById("refreshContentBtn")
                .addEventListener("click", () => this.loadSections());
            document
                .getElementById("cancelContentBtn")
                .addEventListener("click", () => this.closeForm());
            document
                .getElementById("resetContentBtn")
                .addEventListener("click", () => this.openCreateForm());

            document.querySelectorAll("[data-template]").forEach((button) => {
                button.addEventListener("click", () => {
                    if (!this.sectionNameInput.value.trim()) {
                        this.sectionNameInput.value = button.dataset.template || "";
                    }
                    this.formCard.classList.remove("is-hidden");
                    this.sectionNameInput.focus();
                });
            });

            this.sectionNameInput.addEventListener("blur", () => {
                const normalized = this.normalizeSectionName(this.sectionNameInput.value);
                if (normalized) {
                    this.sectionNameInput.value = normalized;
                }
            });

            this.form.addEventListener("submit", async (event) => {
                event.preventDefault();
                await this.saveSection();
            });
        }

        static normalizeSectionName(value) {
            return String(value || "")
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "_")
                .replace(/^_+|_+$/g, "");
        }

        static openCreateForm() {
            this.form.reset();
            this.form.dataset.mode = "create";
            delete this.form.dataset.id;
            this.formTitle.textContent = "New content section";
            this.formCard.classList.remove("is-hidden");
            this.sectionNameInput.focus();
        }

        static openEditForm(section) {
            this.form.dataset.mode = "edit";
            this.form.dataset.id = String(section.id);
            this.formTitle.textContent = `Edit: ${section.section_name}`;
            this.sectionNameInput.value = section.section_name || "";
            this.contentInput.value = section.content || "";
            this.formCard.classList.remove("is-hidden");
            document.querySelector(".main-content")?.scrollTo({ top: 0, behavior: "smooth" });
        }

        static closeForm() {
            this.formCard.classList.add("is-hidden");
            this.form.reset();
        }

        static renderRows(sections) {
            if (!sections.length) {
                this.tableBody.innerHTML = `
                    <tr>
                        <td colspan="4">
                            ${window.AdminUI.renderEmptyState(
                                "No content sections yet",
                                "Create reusable text blocks for the hero, about, services, and contact areas.",
                                "fa-file-lines",
                            )}
                        </td>
                    </tr>
                `;
                return;
            }

            this.tableBody.innerHTML = sections
                .map(
                    (section) => `
                    <tr>
                        <td>
                            <div class="entity-title">${window.AdminUI.escapeHTML(section.section_name)}</div>
                            <div class="entity-meta">ID: ${window.AdminUI.escapeHTML(section.id)}</div>
                        </td>
                        <td class="entity-meta">${window.AdminUI.escapeHTML(
                            window.AdminUI.truncate(
                                section.content || "No content saved yet.",
                                160,
                            ),
                        )}</td>
                        <td class="entity-meta">${window.AdminUI.formatDate(section.updated_at)}</td>
                        <td>
                            <div class="stack-actions">
                                <button class="btn btn-sm btn-soft" data-action="edit" data-id="${section.id}" type="button">
                                    <i class="fa-solid fa-pen-to-square me-1"></i>Edit
                                </button>
                                <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${section.id}" type="button">
                                    <i class="fa-solid fa-trash me-1"></i>Delete
                                </button>
                            </div>
                        </td>
                    </tr>
                `,
                )
                .join("");

            this.tableBody.querySelectorAll("[data-action='edit']").forEach((button) => {
                button.addEventListener("click", async () => {
                    const section = await window.api.getContentSection(button.dataset.id);
                    this.openEditForm(section);
                });
            });

            this.tableBody.querySelectorAll("[data-action='delete']").forEach((button) => {
                button.addEventListener("click", async () => {
                    if (!window.confirm("Delete this content section?")) {
                        return;
                    }

                    try {
                        await window.api.deleteContentSection(button.dataset.id);
                        window.showAlert("Content section deleted successfully.", "success");
                        await this.loadSections();
                    } catch (error) {
                        window.showAlert(
                            error.message || "Failed to delete content section.",
                            "danger",
                        );
                    }
                });
            });
        }

        static async loadSections() {
            this.tableBody.innerHTML = window.AdminUI.renderLoadingTable(
                4,
                "Loading content sections...",
            );

            try {
                const sections = await window.api.getContentSections();
                this.renderRows(sections);
            } catch (error) {
                this.tableBody.innerHTML = `
                    <tr>
                        <td colspan="4">
                            ${window.AdminUI.renderEmptyState(
                                "Unable to load content sections",
                                error.message ||
                                    "The content endpoint did not respond as expected.",
                                "fa-triangle-exclamation",
                            )}
                        </td>
                    </tr>
                `;
            }
        }

        static async saveSection() {
            this.saveButton.disabled = true;
            this.saveButton.textContent =
                this.form.dataset.mode === "edit" ? "Updating..." : "Saving...";

            try {
                const payload = {
                    section_name: this.normalizeSectionName(this.sectionNameInput.value),
                    content: this.contentInput.value,
                };

                if (!payload.section_name) {
                    throw new Error("Section name is required.");
                }

                if (this.form.dataset.mode === "edit" && this.form.dataset.id) {
                    await window.api.updateContentSection(this.form.dataset.id, payload);
                    window.showAlert("Content section updated successfully.", "success");
                } else {
                    await window.api.createContentSection(payload);
                    window.showAlert("Content section created successfully.", "success");
                }

                this.closeForm();
                await this.loadSections();
            } catch (error) {
                window.showAlert(error.message || "Failed to save content section.", "danger");
            } finally {
                this.saveButton.disabled = false;
                this.saveButton.textContent = "Save section";
            }
        }
    }

    window.ContentPage = ContentPage;
})();
