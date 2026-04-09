(function () {
    class ProjectsPage {
        static init() {
            this.render();
            this.cacheElements();
            this.bindEvents();
            return this.loadProjects();
        }

        static render() {
            const contentArea = document.getElementById("contentArea");
            contentArea.innerHTML = `
                <div class="page-shell">
                    <section class="panel-card page-header-card">
                        <div>
                            <p class="eyebrow text-primary mb-2">Gallery manager</p>
                            <h3 class="mb-2">Showcase installations and finished automation work.</h3>
                            <p class="page-summary">
                                Publish standout projects, tune their display order, and update photos without
                                editing the public site by hand.
                            </p>
                        </div>
                        <div class="stack-actions">
                            <button class="btn btn-soft" id="refreshProjectsBtn" type="button">
                                <i class="fa-solid fa-rotate me-2"></i>Refresh
                            </button>
                            <button class="btn btn-primary" id="addProjectBtn" type="button">
                                <i class="fa-solid fa-plus me-2"></i>New project
                            </button>
                        </div>
                    </section>

                    <section class="page-layout">
                        <div class="form-card is-hidden" id="projectFormCard">
                            <div class="card-title-row">
                                <div>
                                    <h4 class="mb-1" id="projectFormTitle">New project</h4>
                                    <p class="helper-text mb-0">Add the details visitors should see on the site.</p>
                                </div>
                                <button class="btn btn-soft btn-sm" id="cancelProjectBtn" type="button">Close</button>
                            </div>

                            <form id="projectForm" novalidate>
                                <div class="mb-3">
                                    <label class="form-label" for="projectTitle">Project title</label>
                                    <input class="form-control" id="projectTitle" name="title" type="text" required />
                                </div>

                                <div class="row">
                                    <div class="col-md-7 mb-3">
                                        <label class="form-label" for="projectLocation">Location</label>
                                        <input class="form-control" id="projectLocation" name="location" type="text" />
                                    </div>
                                    <div class="col-md-5 mb-3">
                                        <label class="form-label" for="projectOrder">Display order</label>
                                        <input class="form-control" id="projectOrder" name="order_index" type="number" min="0" value="0" />
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label" for="projectDescription">Description</label>
                                    <textarea class="form-control" id="projectDescription" name="description"></textarea>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label" for="projectImage">Project image</label>
                                    <input class="form-control" id="projectImage" name="image" type="file" accept="image/*" />
                                </div>

                                <div class="mb-3">
                                    <label class="form-label" for="projectImageAlt">Image alt text</label>
                                    <input
                                        class="form-control"
                                        id="projectImageAlt"
                                        name="image_alt_text"
                                        type="text"
                                        placeholder="Describe what visitors should understand from the image"
                                    />
                                    <div class="helper-text mt-2">
                                        Add meaningful alt text so the project image is usable for accessibility and SEO.
                                    </div>
                                </div>

                                <div class="mb-3" id="projectImagePreview"></div>

                                <div class="form-check form-switch mb-4">
                                    <input class="form-check-input" id="projectPublished" name="is_published" type="checkbox" checked />
                                    <label class="form-check-label" for="projectPublished">Publish on the website</label>
                                </div>

                                <div class="stack-actions">
                                    <button class="btn btn-primary" id="saveProjectBtn" type="submit">
                                        Save project
                                    </button>
                                    <button class="btn btn-soft" id="resetProjectBtn" type="button">
                                        Reset
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div class="table-card">
                            <div class="table-responsive">
                                <table class="table align-middle">
                                    <thead>
                                        <tr>
                                            <th>Project</th>
                                            <th>Status</th>
                                            <th>Image</th>
                                            <th>Updated</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="projectsTableBody">
                                        ${window.AdminUI.renderLoadingTable(5, "Loading projects...")}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                </div>
            `;
        }

        static cacheElements() {
            this.form = document.getElementById("projectForm");
            this.formCard = document.getElementById("projectFormCard");
            this.formTitle = document.getElementById("projectFormTitle");
            this.tableBody = document.getElementById("projectsTableBody");
            this.imageInput = document.getElementById("projectImage");
            this.imageAltInput = document.getElementById("projectImageAlt");
            this.imagePreview = document.getElementById("projectImagePreview");
            this.titleInput = document.getElementById("projectTitle");
            this.locationInput = document.getElementById("projectLocation");
            this.descriptionInput = document.getElementById("projectDescription");
            this.orderInput = document.getElementById("projectOrder");
            this.publishedInput = document.getElementById("projectPublished");
            this.saveButton = document.getElementById("saveProjectBtn");
        }

        static bindEvents() {
            document.getElementById("addProjectBtn").addEventListener("click", () => {
                this.openCreateForm();
            });

            document.getElementById("refreshProjectsBtn").addEventListener("click", () => {
                this.loadProjects();
            });

            document.getElementById("cancelProjectBtn").addEventListener("click", () => {
                this.closeForm();
            });

            document.getElementById("resetProjectBtn").addEventListener("click", () => {
                this.openCreateForm();
            });

            this.imageInput.addEventListener("change", () => {
                const [file] = this.imageInput.files || [];
                if (!file) {
                    window.AdminUI.setImagePreview(
                        this.imagePreview,
                        this.form.dataset.currentImage || "",
                    );
                    return;
                }

                window.AdminUI.validateImageFile(file);
                const objectUrl = window.URL.createObjectURL(file);
                const alt =
                    this.imageAltInput.value.trim() || this.titleInput.value.trim() || file.name;
                window.AdminUI.setImagePreview(this.imagePreview, objectUrl, alt, "Pending upload");
            });

            this.imageAltInput.addEventListener("input", () => {
                const [file] = this.imageInput.files || [];
                if (!file) {
                    return;
                }

                const alt =
                    this.imageAltInput.value.trim() || this.titleInput.value.trim() || file.name;
                window.AdminUI.setImagePreview(
                    this.imagePreview,
                    window.URL.createObjectURL(file),
                    alt,
                    "Pending upload",
                );
            });

            this.form.addEventListener("submit", async (event) => {
                event.preventDefault();
                await this.saveProject();
            });
        }

        static openCreateForm() {
            this.form.reset();
            this.form.dataset.mode = "create";
            delete this.form.dataset.id;
            this.form.dataset.currentImage = "";
            this.formTitle.textContent = "New project";
            this.orderInput.value = "0";
            this.publishedInput.checked = true;
            this.imageAltInput.value = "";
            window.AdminUI.setImagePreview(this.imagePreview, "");
            this.formCard.classList.remove("is-hidden");
            this.titleInput.focus();
        }

        static openEditForm(project) {
            this.form.dataset.mode = "edit";
            this.form.dataset.id = String(project.id);
            this.form.dataset.currentImage = project.image_url || "";
            this.formTitle.textContent = `Edit: ${project.title}`;
            this.titleInput.value = project.title || "";
            this.locationInput.value = project.location || "";
            this.descriptionInput.value = project.description || "";
            this.orderInput.value = String(project.order_index ?? 0);
            this.publishedInput.checked = Boolean(project.is_published);
            this.imageAltInput.value = project.image_asset?.alt_text || project.title || "";
            this.imageInput.value = "";
            window.AdminUI.setImagePreview(
                this.imagePreview,
                project.image_url || "",
                project.image_asset?.alt_text || project.title,
                project.image_asset?.id ? `Asset ID ${project.image_asset.id}` : "",
            );
            this.formCard.classList.remove("is-hidden");
            document.querySelector(".main-content")?.scrollTo({ top: 0, behavior: "smooth" });
        }

        static closeForm() {
            this.formCard.classList.add("is-hidden");
            this.form.reset();
            this.form.dataset.currentImage = "";
            this.imageAltInput.value = "";
            window.AdminUI.setImagePreview(this.imagePreview, "");
        }

        static renderRows(projects) {
            if (!projects.length) {
                this.tableBody.innerHTML = `
                    <tr>
                        <td colspan="5">
                            ${window.AdminUI.renderEmptyState(
                                "No projects yet",
                                "Create your first project to start populating the gallery.",
                                "fa-images",
                            )}
                        </td>
                    </tr>
                `;
                return;
            }

            this.tableBody.innerHTML = projects
                .map(
                    (project) => `
                    <tr>
                        <td>
                            <div class="entity-title">${window.AdminUI.escapeHTML(project.title)}</div>
                            <div class="entity-meta">
                                ${window.AdminUI.safeText(project.location, "No location")}
                            </div>
                        </td>
                        <td>
                            ${window.AdminUI.renderStatusPill(project.is_published)}
                            <div class="entity-meta mt-2">Order: ${window.AdminUI.escapeHTML(project.order_index ?? 0)}</div>
                        </td>
                        <td>${window.AdminUI.renderImageThumb(project.image_url, project.title)}</td>
                        <td class="entity-meta">${window.AdminUI.formatDate(project.updated_at)}</td>
                        <td>
                            <div class="stack-actions">
                                <button class="btn btn-sm btn-soft" data-action="edit" data-id="${project.id}" type="button">
                                    <i class="fa-solid fa-pen-to-square me-1"></i>Edit
                                </button>
                                <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${project.id}" type="button">
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
                    const project = await window.api.getProject(button.dataset.id);
                    this.openEditForm(project);
                });
            });

            this.tableBody.querySelectorAll("[data-action='delete']").forEach((button) => {
                button.addEventListener("click", async () => {
                    if (!window.confirm("Delete this project? This cannot be undone.")) {
                        return;
                    }

                    try {
                        await window.api.deleteProject(button.dataset.id);
                        window.showAlert("Project deleted successfully.", "success");
                        await this.loadProjects();
                    } catch (error) {
                        window.showAlert(error.message || "Failed to delete project.", "danger");
                    }
                });
            });
        }

        static async loadProjects() {
            this.tableBody.innerHTML = window.AdminUI.renderLoadingTable(5, "Loading projects...");

            try {
                const projects = await window.api.getProjects();
                this.renderRows(projects);
            } catch (error) {
                this.tableBody.innerHTML = `
                    <tr>
                        <td colspan="5">
                            ${window.AdminUI.renderEmptyState(
                                "Unable to load projects",
                                error.message ||
                                    "The projects endpoint did not respond as expected.",
                                "fa-triangle-exclamation",
                            )}
                        </td>
                    </tr>
                `;
            }
        }

        static async saveProject() {
            const submitLabel = this.form.dataset.mode === "edit" ? "Updating..." : "Saving...";
            this.saveButton.disabled = true;
            this.saveButton.textContent = submitLabel;

            try {
                const title = this.titleInput.value.trim();
                if (!title) {
                    throw new Error("Project title is required.");
                }

                const orderIndex = Number(this.orderInput.value || 0);
                if (!Number.isInteger(orderIndex) || orderIndex < 0) {
                    throw new Error("Display order must be a whole number of 0 or more.");
                }

                const imageAltText = this.imageAltInput.value.trim() || title;
                const formData = new window.FormData();
                formData.append("title", title);
                formData.append("location", this.locationInput.value.trim());
                formData.append("description", this.descriptionInput.value.trim());
                formData.append("order_index", String(orderIndex));
                formData.append("is_published", this.publishedInput.checked ? "true" : "false");
                formData.append("image_alt_text", imageAltText);

                const [imageFile] = this.imageInput.files || [];
                if (imageFile) {
                    window.AdminUI.validateImageFile(imageFile);
                    formData.append("image", imageFile);
                }

                let savedProject;
                if (this.form.dataset.mode === "edit" && this.form.dataset.id) {
                    savedProject = await window.api.updateProject(this.form.dataset.id, formData);
                    window.showAlert("Project updated successfully.", "success");
                } else {
                    savedProject = await window.api.createProject(formData);
                    window.showAlert("Project created successfully.", "success");
                }

                if (!imageFile && savedProject?.image_asset_id) {
                    await window.api.updateMediaAsset(savedProject.image_asset_id, {
                        alt_text: imageAltText,
                        title,
                    });
                }

                this.closeForm();
                await this.loadProjects();
            } catch (error) {
                window.showAlert(error.message || "Failed to save project.", "danger");
            } finally {
                this.saveButton.disabled = false;
                this.saveButton.textContent = "Save project";
            }
        }
    }

    window.ProjectsPage = ProjectsPage;
})();
