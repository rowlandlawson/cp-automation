(function () {
    class ServicesPage {
        static init() {
            this.render();
            this.cacheElements();
            this.bindEvents();
            return this.loadServices();
        }

        static render() {
            document.getElementById("contentArea").innerHTML = `
                <div class="page-shell">
                    <section class="panel-card page-header-card">
                        <div>
                            <p class="eyebrow text-primary mb-2">Service lineup</p>
                            <h3 class="mb-2">Control how CP Automation presents its service offerings.</h3>
                            <p class="page-summary">
                                Keep support, installation, maintenance, and custom-solution messaging clear and current.
                            </p>
                        </div>
                        <div class="stack-actions">
                            <button class="btn btn-soft" id="refreshServicesBtn" type="button">
                                <i class="fa-solid fa-rotate me-2"></i>Refresh
                            </button>
                            <button class="btn btn-primary" id="addServiceBtn" type="button">
                                <i class="fa-solid fa-plus me-2"></i>New service
                            </button>
                        </div>
                    </section>

                    <section class="page-layout">
                        <div class="form-card is-hidden" id="serviceFormCard">
                            <div class="card-title-row">
                                <div>
                                    <h4 class="mb-1" id="serviceFormTitle">New service</h4>
                                    <p class="helper-text mb-0">Capture the service headline, icon, and explanation.</p>
                                </div>
                                <button class="btn btn-soft btn-sm" id="cancelServiceBtn" type="button">Close</button>
                            </div>

                            <form id="serviceForm" novalidate>
                                <div class="mb-3">
                                    <label class="form-label" for="serviceName">Service name</label>
                                    <input class="form-control" id="serviceName" type="text" required />
                                </div>

                                <div class="row">
                                    <div class="col-md-7 mb-3">
                                        <label class="form-label" for="serviceIcon">Font Awesome icon name</label>
                                        <input class="form-control" id="serviceIcon" type="text" placeholder="shield-check" />
                                    </div>
                                    <div class="col-md-5 mb-3">
                                        <label class="form-label" for="serviceOrder">Display order</label>
                                        <input class="form-control" id="serviceOrder" type="number" min="0" value="0" />
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label" for="serviceDescription">Description</label>
                                    <textarea class="form-control" id="serviceDescription"></textarea>
                                </div>

                                <div class="form-check form-switch mb-4">
                                    <input class="form-check-input" id="servicePublished" type="checkbox" checked />
                                    <label class="form-check-label" for="servicePublished">Published</label>
                                </div>

                                <div class="stack-actions">
                                    <button class="btn btn-primary" id="saveServiceBtn" type="submit">Save service</button>
                                    <button class="btn btn-soft" id="resetServiceBtn" type="button">Reset</button>
                                </div>
                            </form>
                        </div>

                        <div class="table-card">
                            <div class="table-responsive">
                                <table class="table align-middle">
                                    <thead>
                                        <tr>
                                            <th>Service</th>
                                            <th>Icon</th>
                                            <th>Status</th>
                                            <th>Updated</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="servicesTableBody">
                                        ${window.AdminUI.renderLoadingTable(5, "Loading services...")}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                </div>
            `;
        }

        static cacheElements() {
            this.form = document.getElementById("serviceForm");
            this.formCard = document.getElementById("serviceFormCard");
            this.formTitle = document.getElementById("serviceFormTitle");
            this.tableBody = document.getElementById("servicesTableBody");
            this.nameInput = document.getElementById("serviceName");
            this.iconInput = document.getElementById("serviceIcon");
            this.descriptionInput = document.getElementById("serviceDescription");
            this.orderInput = document.getElementById("serviceOrder");
            this.publishedInput = document.getElementById("servicePublished");
            this.saveButton = document.getElementById("saveServiceBtn");
        }

        static bindEvents() {
            document
                .getElementById("addServiceBtn")
                .addEventListener("click", () => this.openCreateForm());
            document
                .getElementById("refreshServicesBtn")
                .addEventListener("click", () => this.loadServices());
            document
                .getElementById("cancelServiceBtn")
                .addEventListener("click", () => this.closeForm());
            document
                .getElementById("resetServiceBtn")
                .addEventListener("click", () => this.openCreateForm());
            this.form.addEventListener("submit", async (event) => {
                event.preventDefault();
                await this.saveService();
            });
        }

        static openCreateForm() {
            this.form.reset();
            this.form.dataset.mode = "create";
            delete this.form.dataset.id;
            this.formTitle.textContent = "New service";
            this.orderInput.value = "0";
            this.publishedInput.checked = true;
            this.formCard.classList.remove("is-hidden");
            this.nameInput.focus();
        }

        static openEditForm(service) {
            this.form.dataset.mode = "edit";
            this.form.dataset.id = String(service.id);
            this.formTitle.textContent = `Edit: ${service.name}`;
            this.nameInput.value = service.name || "";
            this.iconInput.value = service.icon_name || "";
            this.descriptionInput.value = service.description || "";
            this.orderInput.value = String(service.order_index ?? 0);
            this.publishedInput.checked = Boolean(service.is_published);
            this.formCard.classList.remove("is-hidden");
            document.querySelector(".main-content")?.scrollTo({ top: 0, behavior: "smooth" });
        }

        static closeForm() {
            this.formCard.classList.add("is-hidden");
            this.form.reset();
        }

        static renderRows(services) {
            if (!services.length) {
                this.tableBody.innerHTML = `
                    <tr>
                        <td colspan="5">
                            ${window.AdminUI.renderEmptyState(
                                "No services yet",
                                "Create a service entry to populate the services section.",
                                "fa-screwdriver-wrench",
                            )}
                        </td>
                    </tr>
                `;
                return;
            }

            this.tableBody.innerHTML = services
                .map(
                    (service) => `
                    <tr>
                        <td>
                            <div class="entity-title">${window.AdminUI.escapeHTML(service.name)}</div>
                            <div class="entity-meta">${window.AdminUI.escapeHTML(window.AdminUI.truncate(service.description || "No description", 90))}</div>
                        </td>
                        <td>
                            ${
                                service.icon_name
                                    ? `<i class="fa-solid fa-${window.AdminUI.escapeHTML(service.icon_name)} me-2"></i><span class="entity-meta">${window.AdminUI.escapeHTML(service.icon_name)}</span>`
                                    : '<span class="text-muted small">No icon</span>'
                            }
                        </td>
                        <td>
                            ${window.AdminUI.renderStatusPill(service.is_published)}
                            <div class="entity-meta mt-2">Order: ${window.AdminUI.escapeHTML(service.order_index ?? 0)}</div>
                        </td>
                        <td class="entity-meta">${window.AdminUI.formatDate(service.updated_at)}</td>
                        <td>
                            <div class="stack-actions">
                                <button class="btn btn-sm btn-soft" data-action="edit" data-id="${service.id}" type="button">
                                    <i class="fa-solid fa-pen-to-square me-1"></i>Edit
                                </button>
                                <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${service.id}" type="button">
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
                    const service = await window.api.getService(button.dataset.id);
                    this.openEditForm(service);
                });
            });

            this.tableBody.querySelectorAll("[data-action='delete']").forEach((button) => {
                button.addEventListener("click", async () => {
                    if (!window.confirm("Delete this service?")) {
                        return;
                    }

                    try {
                        await window.api.deleteService(button.dataset.id);
                        window.showAlert("Service deleted successfully.", "success");
                        await this.loadServices();
                    } catch (error) {
                        window.showAlert(error.message || "Failed to delete service.", "danger");
                    }
                });
            });
        }

        static async loadServices() {
            this.tableBody.innerHTML = window.AdminUI.renderLoadingTable(5, "Loading services...");

            try {
                const services = await window.api.getServices();
                this.renderRows(services);
            } catch (error) {
                this.tableBody.innerHTML = `
                    <tr>
                        <td colspan="5">
                            ${window.AdminUI.renderEmptyState(
                                "Unable to load services",
                                error.message ||
                                    "The services endpoint did not respond as expected.",
                                "fa-triangle-exclamation",
                            )}
                        </td>
                    </tr>
                `;
            }
        }

        static async saveService() {
            this.saveButton.disabled = true;
            this.saveButton.textContent =
                this.form.dataset.mode === "edit" ? "Updating..." : "Saving...";

            try {
                const name = this.nameInput.value.trim();
                if (!name) {
                    throw new Error("Service name is required.");
                }

                const orderIndex = Number(this.orderInput.value || 0);
                if (!Number.isInteger(orderIndex) || orderIndex < 0) {
                    throw new Error("Display order must be a whole number of 0 or more.");
                }

                const payload = {
                    name,
                    icon_name: this.iconInput.value.trim(),
                    description: this.descriptionInput.value.trim(),
                    order_index: orderIndex,
                    is_published: this.publishedInput.checked,
                };

                if (this.form.dataset.mode === "edit" && this.form.dataset.id) {
                    await window.api.updateService(this.form.dataset.id, payload);
                    window.showAlert("Service updated successfully.", "success");
                } else {
                    await window.api.createService(payload);
                    window.showAlert("Service created successfully.", "success");
                }

                this.closeForm();
                await this.loadServices();
            } catch (error) {
                window.showAlert(error.message || "Failed to save service.", "danger");
            } finally {
                this.saveButton.disabled = false;
                this.saveButton.textContent = "Save service";
            }
        }
    }

    window.ServicesPage = ServicesPage;
})();
