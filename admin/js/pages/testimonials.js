(function () {
    class TestimonialsPage {
        static init() {
            this.render();
            this.cacheElements();
            this.bindEvents();
            return this.loadTestimonials();
        }

        static render() {
            document.getElementById("contentArea").innerHTML = `
                <div class="page-shell">
                    <section class="panel-card page-header-card">
                        <div>
                            <p class="eyebrow text-primary mb-2">Trust signals</p>
                            <h3 class="mb-2">Manage the stories and quotes that build buyer confidence.</h3>
                            <p class="page-summary">
                                Add new testimonials, refine the wording, and control what appears publicly.
                            </p>
                        </div>
                        <div class="stack-actions">
                            <button class="btn btn-soft" id="refreshTestimonialsBtn" type="button">
                                <i class="fa-solid fa-rotate me-2"></i>Refresh
                            </button>
                            <button class="btn btn-primary" id="addTestimonialBtn" type="button">
                                <i class="fa-solid fa-plus me-2"></i>New testimonial
                            </button>
                        </div>
                    </section>

                    <section class="page-layout">
                        <div class="form-card is-hidden" id="testimonialFormCard">
                            <div class="card-title-row">
                                <div>
                                    <h4 class="mb-1" id="testimonialFormTitle">New testimonial</h4>
                                    <p class="helper-text mb-0">Capture the quote, who said it, and how it should be ranked.</p>
                                </div>
                                <button class="btn btn-soft btn-sm" id="cancelTestimonialBtn" type="button">Close</button>
                            </div>

                            <form id="testimonialForm" novalidate>
                                <div class="mb-3">
                                    <label class="form-label" for="testimonialQuote">Type testimony</label>
                                    <textarea class="form-control" id="testimonialQuote" required></textarea>
                                </div>

                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label" for="testimonialAuthor">Client name</label>
                                        <input class="form-control" id="testimonialAuthor" type="text" />
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label" for="testimonialLocation">Location</label>
                                        <input class="form-control" id="testimonialLocation" type="text" />
                                    </div>
                                </div>

                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label" for="testimonialRating">Rating</label>
                                        <select class="form-select" id="testimonialRating">
                                            <option value="5">5 stars</option>
                                            <option value="4">4 stars</option>
                                            <option value="3">3 stars</option>
                                            <option value="2">2 stars</option>
                                            <option value="1">1 star</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label" for="testimonialOrder">Display order</label>
                                        <input class="form-control" id="testimonialOrder" type="number" min="0" value="0" />
                                    </div>
                                </div>

                                <div class="form-check form-switch mb-4">
                                    <input class="form-check-input" id="testimonialPublished" type="checkbox" checked />
                                    <label class="form-check-label" for="testimonialPublished">Published</label>
                                </div>

                                <div class="stack-actions">
                                    <button class="btn btn-primary" id="saveTestimonialBtn" type="submit">Save testimonial</button>
                                    <button class="btn btn-soft" id="resetTestimonialBtn" type="button">Reset</button>
                                </div>
                            </form>
                        </div>

                        <div class="table-card">
                            <div class="table-responsive">
                                <table class="table align-middle">
                                    <thead>
                                        <tr>
                                            <th>Quote</th>
                                            <th>Client name</th>
                                            <th>Status</th>
                                            <th>Updated</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="testimonialsTableBody">
                                        ${window.AdminUI.renderLoadingTable(5, "Loading testimonials...")}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                </div>
            `;
        }

        static cacheElements() {
            this.form = document.getElementById("testimonialForm");
            this.formCard = document.getElementById("testimonialFormCard");
            this.formTitle = document.getElementById("testimonialFormTitle");
            this.tableBody = document.getElementById("testimonialsTableBody");
            this.quoteInput = document.getElementById("testimonialQuote");
            this.authorInput = document.getElementById("testimonialAuthor");
            this.locationInput = document.getElementById("testimonialLocation");
            this.ratingInput = document.getElementById("testimonialRating");
            this.orderInput = document.getElementById("testimonialOrder");
            this.publishedInput = document.getElementById("testimonialPublished");
            this.saveButton = document.getElementById("saveTestimonialBtn");
        }

        static bindEvents() {
            document
                .getElementById("addTestimonialBtn")
                .addEventListener("click", () => this.openCreateForm());
            document
                .getElementById("refreshTestimonialsBtn")
                .addEventListener("click", () => this.loadTestimonials());
            document
                .getElementById("cancelTestimonialBtn")
                .addEventListener("click", () => this.closeForm());
            document
                .getElementById("resetTestimonialBtn")
                .addEventListener("click", () => this.openCreateForm());
            this.form.addEventListener("submit", async (event) => {
                event.preventDefault();
                await this.saveTestimonial();
            });
        }

        static openCreateForm() {
            this.form.reset();
            this.form.dataset.mode = "create";
            delete this.form.dataset.id;
            this.formTitle.textContent = "New testimonial";
            this.ratingInput.value = "5";
            this.orderInput.value = "0";
            this.publishedInput.checked = true;
            this.formCard.classList.remove("is-hidden");
            this.quoteInput.focus();
        }

        static openEditForm(testimonial) {
            this.form.dataset.mode = "edit";
            this.form.dataset.id = String(testimonial.id);
            this.formTitle.textContent = `Edit testimonial #${testimonial.id}`;
            this.quoteInput.value = testimonial.quote || "";
            this.authorInput.value = testimonial.author || "";
            this.locationInput.value = testimonial.location || "";
            this.ratingInput.value = String(testimonial.rating ?? 5);
            this.orderInput.value = String(testimonial.order_index ?? 0);
            this.publishedInput.checked = Boolean(testimonial.is_published);
            this.formCard.classList.remove("is-hidden");
            document.querySelector(".main-content")?.scrollTo({ top: 0, behavior: "smooth" });
        }

        static closeForm() {
            this.formCard.classList.add("is-hidden");
            this.form.reset();
        }

        static renderRows(testimonials) {
            if (!testimonials.length) {
                this.tableBody.innerHTML = `
                    <tr>
                        <td colspan="5">
                            ${window.AdminUI.renderEmptyState(
                                "No testimonials yet",
                                "Add customer feedback to build trust on the public site.",
                                "fa-comments",
                            )}
                        </td>
                    </tr>
                `;
                return;
            }

            this.tableBody.innerHTML = testimonials
                .map(
                    (testimonial) => `
                    <tr>
                        <td>
                            <div class="entity-title">${window.AdminUI.escapeHTML(window.AdminUI.truncate(testimonial.quote, 110))}</div>
                            <div class="entity-meta">Rating: ${window.AdminUI.escapeHTML(testimonial.rating ?? 5)} / 5</div>
                        </td>
                        <td>
                            <div>${window.AdminUI.safeText(testimonial.author, "Anonymous")}</div>
                            <div class="entity-meta">${window.AdminUI.safeText(testimonial.location, "No location")}</div>
                        </td>
                        <td>
                            ${window.AdminUI.renderStatusPill(testimonial.is_published)}
                            <div class="entity-meta mt-2">Order: ${window.AdminUI.escapeHTML(testimonial.order_index ?? 0)}</div>
                        </td>
                        <td class="entity-meta">${window.AdminUI.formatDate(testimonial.updated_at)}</td>
                        <td>
                            <div class="stack-actions">
                                <button class="btn btn-sm btn-soft" data-action="edit" data-id="${testimonial.id}" type="button">
                                    <i class="fa-solid fa-pen-to-square me-1"></i>Edit
                                </button>
                                <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${testimonial.id}" type="button">
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
                    const testimonial = await window.api.getTestimonial(button.dataset.id);
                    this.openEditForm(testimonial);
                });
            });

            this.tableBody.querySelectorAll("[data-action='delete']").forEach((button) => {
                button.addEventListener("click", async () => {
                    if (!window.confirm("Delete this testimonial?")) {
                        return;
                    }

                    try {
                        await window.api.deleteTestimonial(button.dataset.id);
                        window.showAlert("Testimonial deleted successfully.", "success");
                        await this.loadTestimonials();
                    } catch (error) {
                        window.showAlert(
                            error.message || "Failed to delete testimonial.",
                            "danger",
                        );
                    }
                });
            });
        }

        static async loadTestimonials() {
            this.tableBody.innerHTML = window.AdminUI.renderLoadingTable(
                5,
                "Loading testimonials...",
            );

            try {
                const testimonials = await window.api.getTestimonials();
                this.renderRows(testimonials);
            } catch (error) {
                this.tableBody.innerHTML = `
                    <tr>
                        <td colspan="5">
                            ${window.AdminUI.renderEmptyState(
                                "Unable to load testimonials",
                                error.message ||
                                    "The testimonials endpoint did not respond as expected.",
                                "fa-triangle-exclamation",
                            )}
                        </td>
                    </tr>
                `;
            }
        }

        static async saveTestimonial() {
            this.saveButton.disabled = true;
            this.saveButton.textContent =
                this.form.dataset.mode === "edit" ? "Updating..." : "Saving...";

            try {
                const quote = this.quoteInput.value.trim();
                if (!quote) {
                    throw new Error("Testimonial quote is required.");
                }

                const orderIndex = Number(this.orderInput.value || 0);
                if (!Number.isInteger(orderIndex) || orderIndex < 0) {
                    throw new Error("Display order must be a whole number of 0 or more.");
                }

                const payload = {
                    quote,
                    author: this.authorInput.value.trim(),
                    location: this.locationInput.value.trim(),
                    rating: Number(this.ratingInput.value || 5),
                    order_index: orderIndex,
                    is_published: this.publishedInput.checked,
                };

                if (this.form.dataset.mode === "edit" && this.form.dataset.id) {
                    await window.api.updateTestimonial(this.form.dataset.id, payload);
                    window.showAlert("Testimonial updated successfully.", "success");
                } else {
                    await window.api.createTestimonial(payload);
                    window.showAlert("Testimonial created successfully.", "success");
                }

                this.closeForm();
                await this.loadTestimonials();
            } catch (error) {
                window.showAlert(error.message || "Failed to save testimonial.", "danger");
            } finally {
                this.saveButton.disabled = false;
                this.saveButton.textContent = "Save testimonial";
            }
        }
    }

    window.TestimonialsPage = TestimonialsPage;
})();
