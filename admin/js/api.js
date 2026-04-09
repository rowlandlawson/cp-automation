(function () {
    class API {
        constructor(baseURL = window.AdminUI.getApiBaseUrl()) {
            this.baseURL = baseURL.replace(/\/$/, "");
        }

        async request(endpoint, options = {}) {
            const requestOptions = { ...options };
            const headers = { ...(requestOptions.headers || {}) };
            const isFormData = requestOptions.body instanceof window.FormData;
            const isObjectBody =
                requestOptions.body &&
                typeof requestOptions.body === "object" &&
                !isFormData &&
                !(requestOptions.body instanceof window.Blob);

            if (window.auth?.token) {
                headers.Authorization = `Bearer ${window.auth.token}`;
            }

            if (isObjectBody) {
                headers["Content-Type"] = headers["Content-Type"] || "application/json";
                requestOptions.body = JSON.stringify(requestOptions.body);
            } else if (!isFormData && requestOptions.body === undefined) {
                delete headers["Content-Type"];
            }

            requestOptions.headers = headers;

            const response = await window.fetch(`${this.baseURL}${endpoint}`, requestOptions);
            const contentType = response.headers.get("content-type") || "";
            const payload = contentType.includes("application/json")
                ? await response.json().catch(() => null)
                : await response.text().catch(() => "");

            if (!response.ok) {
                const message =
                    (payload && typeof payload === "object" && payload.error) ||
                    (typeof payload === "string" && payload) ||
                    `HTTP ${response.status}`;
                const error = new Error(message);
                error.status = response.status;
                error.payload = payload;

                if (response.status === 401 && options.logoutOnUnauthorized !== false) {
                    window.auth?.logout("Your session expired. Please sign in again.");
                }

                throw error;
            }

            return payload;
        }

        async getOverviewStats() {
            const results = await Promise.allSettled([
                this.getProjects(),
                this.getSiteSettings(),
                this.getAboutPage(),
            ]);

            return {
                aboutPage: results[2],
                projects: results[0],
                siteSettings: results[1],
            };
        }

        getPasswordPolicy() {
            return this.request("/auth/password-policy", {
                logoutOnUnauthorized: false,
            });
        }

        forgotPassword(payload) {
            return this.request("/auth/forgot-password", {
                body: payload,
                logoutOnUnauthorized: false,
                method: "POST",
            });
        }

        verifyResetCode(payload) {
            return this.request("/auth/verify-reset-code", {
                body: payload,
                logoutOnUnauthorized: false,
                method: "POST",
            });
        }

        resetPassword(payload) {
            return this.request("/auth/reset-password", {
                body: payload,
                logoutOnUnauthorized: false,
                method: "POST",
            });
        }

        changeEmail(payload) {
            return this.request("/auth/change-email", {
                body: payload,
                method: "POST",
            });
        }

        changePassword(payload) {
            return this.request("/auth/change-password", {
                body: payload,
                method: "POST",
            });
        }

        getProjects() {
            return this.request("/projects/admin/all");
        }

        getProject(id) {
            return this.request(`/projects/${id}`);
        }

        createProject(formData) {
            return this.request("/projects", {
                method: "POST",
                body: formData,
            });
        }

        updateProject(id, formData) {
            return this.request(`/projects/${id}`, {
                method: "PUT",
                body: formData,
            });
        }

        deleteProject(id) {
            return this.request(`/projects/${id}`, {
                method: "DELETE",
            });
        }

        getProducts() {
            return this.request("/products/admin/all");
        }

        getProduct(id) {
            return this.request(`/products/${id}`);
        }

        createProduct(payload) {
            return this.request("/products", {
                method: "POST",
                body: payload,
            });
        }

        updateProduct(id, payload) {
            return this.request(`/products/${id}`, {
                method: "PUT",
                body: payload,
            });
        }

        deleteProduct(id) {
            return this.request(`/products/${id}`, {
                method: "DELETE",
            });
        }

        getServices() {
            return this.request("/services/admin/all");
        }

        getService(id) {
            return this.request(`/services/${id}`);
        }

        createService(payload) {
            return this.request("/services", {
                method: "POST",
                body: payload,
            });
        }

        updateService(id, payload) {
            return this.request(`/services/${id}`, {
                method: "PUT",
                body: payload,
            });
        }

        deleteService(id) {
            return this.request(`/services/${id}`, {
                method: "DELETE",
            });
        }

        getTestimonials() {
            return this.request("/testimonials/admin/all");
        }

        getTestimonial(id) {
            return this.request(`/testimonials/${id}`);
        }

        createTestimonial(payload) {
            return this.request("/testimonials", {
                method: "POST",
                body: payload,
            });
        }

        updateTestimonial(id, payload) {
            return this.request(`/testimonials/${id}`, {
                method: "PUT",
                body: payload,
            });
        }

        deleteTestimonial(id) {
            return this.request(`/testimonials/${id}`, {
                method: "DELETE",
            });
        }

        getContentSections() {
            return this.request("/content");
        }

        getContentSection(id) {
            return this.request(`/content/${id}`);
        }

        createContentSection(payload) {
            return this.request("/content", {
                method: "POST",
                body: payload,
            });
        }

        updateContentSection(id, payload) {
            return this.request(`/content/${id}`, {
                method: "PUT",
                body: payload,
            });
        }

        deleteContentSection(id) {
            return this.request(`/content/${id}`, {
                method: "DELETE",
            });
        }

        getSiteSettings() {
            return this.request("/site-settings");
        }

        updateSiteSettings(payload) {
            return this.request("/site-settings", {
                method: "PUT",
                body: payload,
            });
        }

        getHomePage() {
            return this.request("/home-page");
        }

        updateHomePage(payload) {
            return this.request("/home-page", {
                method: "PUT",
                body: payload,
            });
        }

        getAboutPage() {
            return this.request("/about-page");
        }

        updateAboutPage(payload) {
            return this.request("/about-page", {
                method: "PUT",
                body: payload,
            });
        }

        getMediaAssets() {
            return this.request("/media");
        }

        getMediaAsset(id) {
            return this.request(`/media/${id}`);
        }

        uploadMediaAsset(file, metadata = {}) {
            const formData = new window.FormData();
            formData.append("image", file);

            if (metadata.title) {
                formData.append("title", metadata.title);
            }

            if (metadata.alt_text) {
                formData.append("alt_text", metadata.alt_text);
            }

            return this.request("/media/upload", {
                method: "POST",
                body: formData,
            });
        }

        updateMediaAsset(id, payload) {
            return this.request(`/media/${id}`, {
                method: "PUT",
                body: payload,
            });
        }

        deleteMediaAsset(id) {
            return this.request(`/media/${id}`, {
                method: "DELETE",
            });
        }
    }

    window.api = new API();
})();
