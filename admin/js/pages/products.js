(function () {
    class ProductsPage {
        static init() {
            this.render();
            this.cacheElements();
            this.bindEvents();
            return this.loadProducts();
        }

        static render() {
            document.getElementById("contentArea").innerHTML = `
                <div class="page-shell">
                    <section class="panel-card page-header-card">
                        <div>
                            <p class="eyebrow text-primary mb-2">Product catalog</p>
                            <h3 class="mb-2">Maintain the automation products promoted on the website.</h3>
                            <p class="page-summary">
                                Update names, selling points, and publish order so the public product section stays current.
                            </p>
                        </div>
                        <div class="stack-actions">
                            <button class="btn btn-soft" id="refreshProductsBtn" type="button">
                                <i class="fa-solid fa-rotate me-2"></i>Refresh
                            </button>
                            <button class="btn btn-primary" id="addProductBtn" type="button">
                                <i class="fa-solid fa-plus me-2"></i>New product
                            </button>
                        </div>
                    </section>

                    <section class="page-layout">
                        <div class="form-card is-hidden" id="productFormCard">
                            <div class="card-title-row">
                                <div>
                                    <h4 class="mb-1" id="productFormTitle">New product</h4>
                                    <p class="helper-text mb-0">Capture the message customers should read before contacting you.</p>
                                </div>
                                <button class="btn btn-soft btn-sm" id="cancelProductBtn" type="button">Close</button>
                            </div>

                            <form id="productForm" novalidate>
                                <div class="mb-3">
                                    <label class="form-label" for="productName">Product name</label>
                                    <input class="form-control" id="productName" type="text" required />
                                </div>

                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label" for="productOrder">Display order</label>
                                        <input class="form-control" id="productOrder" type="number" min="0" value="0" />
                                    </div>
                                    <div class="col-md-6 mb-3 d-flex align-items-end">
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" id="productPublished" type="checkbox" checked />
                                            <label class="form-check-label" for="productPublished">Published</label>
                                        </div>
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label" for="productDescription">Description</label>
                                    <textarea class="form-control" id="productDescription"></textarea>
                                </div>

                                <div class="mb-4">
                                    <label class="form-label" for="productFeatures">Key features</label>
                                    <textarea class="form-control" id="productFeatures" placeholder="One paragraph or a short list separated by commas."></textarea>
                                </div>

                                <div class="stack-actions">
                                    <button class="btn btn-primary" id="saveProductBtn" type="submit">Save product</button>
                                    <button class="btn btn-soft" id="resetProductBtn" type="button">Reset</button>
                                </div>
                            </form>
                        </div>

                        <div class="table-card">
                            <div class="table-responsive">
                                <table class="table align-middle">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Highlights</th>
                                            <th>Status</th>
                                            <th>Updated</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="productsTableBody">
                                        ${window.AdminUI.renderLoadingTable(5, "Loading products...")}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                </div>
            `;
        }

        static cacheElements() {
            this.form = document.getElementById("productForm");
            this.formCard = document.getElementById("productFormCard");
            this.formTitle = document.getElementById("productFormTitle");
            this.tableBody = document.getElementById("productsTableBody");
            this.nameInput = document.getElementById("productName");
            this.descriptionInput = document.getElementById("productDescription");
            this.featuresInput = document.getElementById("productFeatures");
            this.orderInput = document.getElementById("productOrder");
            this.publishedInput = document.getElementById("productPublished");
            this.saveButton = document.getElementById("saveProductBtn");
        }

        static bindEvents() {
            document
                .getElementById("addProductBtn")
                .addEventListener("click", () => this.openCreateForm());
            document
                .getElementById("refreshProductsBtn")
                .addEventListener("click", () => this.loadProducts());
            document
                .getElementById("cancelProductBtn")
                .addEventListener("click", () => this.closeForm());
            document
                .getElementById("resetProductBtn")
                .addEventListener("click", () => this.openCreateForm());
            this.form.addEventListener("submit", async (event) => {
                event.preventDefault();
                await this.saveProduct();
            });
        }

        static openCreateForm() {
            this.form.reset();
            this.form.dataset.mode = "create";
            delete this.form.dataset.id;
            this.formTitle.textContent = "New product";
            this.orderInput.value = "0";
            this.publishedInput.checked = true;
            this.formCard.classList.remove("is-hidden");
            this.nameInput.focus();
        }

        static openEditForm(product) {
            this.form.dataset.mode = "edit";
            this.form.dataset.id = String(product.id);
            this.formTitle.textContent = `Edit: ${product.name}`;
            this.nameInput.value = product.name || "";
            this.descriptionInput.value = product.description || "";
            this.featuresInput.value = product.features || "";
            this.orderInput.value = String(product.order_index ?? 0);
            this.publishedInput.checked = Boolean(product.is_published);
            this.formCard.classList.remove("is-hidden");
            document.querySelector(".main-content")?.scrollTo({ top: 0, behavior: "smooth" });
        }

        static closeForm() {
            this.formCard.classList.add("is-hidden");
            this.form.reset();
        }

        static renderRows(products) {
            if (!products.length) {
                this.tableBody.innerHTML = `
                    <tr>
                        <td colspan="5">
                            ${window.AdminUI.renderEmptyState(
                                "No products yet",
                                "Create a product entry to populate the catalog section.",
                                "fa-box-open",
                            )}
                        </td>
                    </tr>
                `;
                return;
            }

            this.tableBody.innerHTML = products
                .map(
                    (product) => `
                    <tr>
                        <td>
                            <div class="entity-title">${window.AdminUI.escapeHTML(product.name)}</div>
                            <div class="entity-meta">Order: ${window.AdminUI.escapeHTML(product.order_index ?? 0)}</div>
                        </td>
                        <td class="entity-meta">${window.AdminUI.escapeHTML(window.AdminUI.truncate(product.features || product.description || "No description", 120))}</td>
                        <td>${window.AdminUI.renderStatusPill(product.is_published)}</td>
                        <td class="entity-meta">${window.AdminUI.formatDate(product.updated_at)}</td>
                        <td>
                            <div class="stack-actions">
                                <button class="btn btn-sm btn-soft" data-action="edit" data-id="${product.id}" type="button">
                                    <i class="fa-solid fa-pen-to-square me-1"></i>Edit
                                </button>
                                <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${product.id}" type="button">
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
                    const product = await window.api.getProduct(button.dataset.id);
                    this.openEditForm(product);
                });
            });

            this.tableBody.querySelectorAll("[data-action='delete']").forEach((button) => {
                button.addEventListener("click", async () => {
                    if (!window.confirm("Delete this product?")) {
                        return;
                    }

                    try {
                        await window.api.deleteProduct(button.dataset.id);
                        window.showAlert("Product deleted successfully.", "success");
                        await this.loadProducts();
                    } catch (error) {
                        window.showAlert(error.message || "Failed to delete product.", "danger");
                    }
                });
            });
        }

        static async loadProducts() {
            this.tableBody.innerHTML = window.AdminUI.renderLoadingTable(5, "Loading products...");

            try {
                const products = await window.api.getProducts();
                this.renderRows(products);
            } catch (error) {
                this.tableBody.innerHTML = `
                    <tr>
                        <td colspan="5">
                            ${window.AdminUI.renderEmptyState(
                                "Unable to load products",
                                error.message ||
                                    "The product endpoint did not respond as expected.",
                                "fa-triangle-exclamation",
                            )}
                        </td>
                    </tr>
                `;
            }
        }

        static async saveProduct() {
            this.saveButton.disabled = true;
            this.saveButton.textContent =
                this.form.dataset.mode === "edit" ? "Updating..." : "Saving...";

            try {
                const name = this.nameInput.value.trim();
                if (!name) {
                    throw new Error("Product name is required.");
                }

                const orderIndex = Number(this.orderInput.value || 0);
                if (!Number.isInteger(orderIndex) || orderIndex < 0) {
                    throw new Error("Display order must be a whole number of 0 or more.");
                }

                const payload = {
                    name,
                    description: this.descriptionInput.value.trim(),
                    features: this.featuresInput.value.trim(),
                    order_index: orderIndex,
                    is_published: this.publishedInput.checked,
                };

                if (this.form.dataset.mode === "edit" && this.form.dataset.id) {
                    await window.api.updateProduct(this.form.dataset.id, payload);
                    window.showAlert("Product updated successfully.", "success");
                } else {
                    await window.api.createProduct(payload);
                    window.showAlert("Product created successfully.", "success");
                }

                this.closeForm();
                await this.loadProducts();
            } catch (error) {
                window.showAlert(error.message || "Failed to save product.", "danger");
            } finally {
                this.saveButton.disabled = false;
                this.saveButton.textContent = "Save product";
            }
        }
    }

    window.ProductsPage = ProductsPage;
})();
