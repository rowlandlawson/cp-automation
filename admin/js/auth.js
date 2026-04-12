(function () {
    class AuthManager {
        constructor() {
            this.token = window.localStorage.getItem("adminToken") || "";
            this.user = this.getStoredUser();
            this.initialized = false;
        }

        getStoredUser() {
            try {
                const rawUser = window.localStorage.getItem("adminUser");
                return rawUser ? JSON.parse(rawUser) : null;
            } catch (_error) {
                return null;
            }
        }

        getPageType() {
            return document.body?.dataset.adminPage === "login" ? "login" : "dashboard";
        }

        isLoginPage() {
            return this.getPageType() === "login";
        }

        isAuthenticated() {
            return Boolean(this.token);
        }

        getMessageFromQuery() {
            return new URLSearchParams(window.location.search).get("message") || "";
        }

        clearMessageQuery() {
            const url = new URL(window.location.href);
            if (!url.searchParams.has("message")) {
                return;
            }

            url.searchParams.delete("message");
            window.history.replaceState({}, document.title, url.toString());
        }

        buildPageUrl(fileName, message = "") {
            const target = new URL(fileName, document.baseURI || window.location.href);
            target.search = "";
            target.hash = "";

            if (message) {
                target.searchParams.set("message", message);
            }

            return target.toString();
        }

        redirectToLogin(message = "") {
            const target = this.buildPageUrl("login.html", message);
            if (window.location.href !== target) {
                window.location.replace(target);
            }
        }

        redirectToDashboard() {
            const target = this.buildPageUrl("index.html");
            if (window.location.href !== target) {
                window.location.replace(target);
            }
        }

        persistSession(token, user) {
            this.token = token;
            this.user = user;
            window.localStorage.setItem("adminToken", token);
            window.localStorage.setItem("adminUser", JSON.stringify(user));
        }

        clearSession() {
            this.token = "";
            this.user = null;
            window.localStorage.removeItem("adminToken");
            window.localStorage.removeItem("adminUser");
        }

        updateSessionUI() {
            const sessionUser = document.getElementById("sessionUser");
            const sessionRole = document.getElementById("sessionRole");

            if (sessionUser) {
                sessionUser.textContent = this.user?.username || "Guest";
            }

            if (sessionRole) {
                sessionRole.textContent = this.user?.role || "Administrator";
            }
        }

        emitChange() {
            window.dispatchEvent(
                new window.CustomEvent("admin:auth-changed", {
                    detail: {
                        authenticated: this.isAuthenticated(),
                        user: this.user,
                    },
                }),
            );
        }

        renderLoginScreen(message = "", isBusy = false) {
            const loginView = document.getElementById("loginView");
            if (!loginView) {
                return;
            }

            loginView.innerHTML = `
                <div class="login-card">
                    <div class="login-story">
                        <div class="login-brand-lockup">
                            <div class="brand-mark">
                                <img
                                    class="brand-logo-image"
                                    data-admin-brand-logo
                                    alt="CP Automation logo"
                                    src="${window.AdminUI.escapeHTML(window.AdminUI.getDefaultImageUrl("logo"))}"
                                    loading="lazy"
                                />
                                <div class="brand-icon d-none" data-admin-brand-fallback>
                                    <i class="fa-solid fa-bolt"></i>
                                </div>
                            </div>
                            <div>
                                <p class="login-kicker text-white-50 mb-1">Automation control desk</p>
                                <div class="login-brand-title" data-admin-brand-name>CP Automation</div>
                            </div>
                        </div>
                        <h2>Manage your settings, About page, and projects from one place.</h2>
                        <p>
                            The CP Automation dashboard lets you keep the brand details, founder story,
                            and uploaded project work in sync with the public website.
                        </p>
                        <ul>
                            <li><i class="fa-solid fa-check"></i> Secure admin authentication</li>
                            <li><i class="fa-solid fa-check"></i> About-page editing with image upload</li>
                            <li><i class="fa-solid fa-check"></i> Project media uploads and updates</li>
                        </ul>
                    </div>
                    <div class="login-form-wrap">
                        <p class="login-kicker">Welcome back</p>
                        <h1 class="login-title">Admin Sign In</h1>
                        <p class="login-subtitle">Use your CP Automation admin credentials to continue.</p>
                        ${
                            isBusy
                                ? `
                                <div class="d-flex align-items-center gap-2 text-muted">
                                    <span class="login-spinner"></span>
                                    <span>Restoring your session...</span>
                                </div>
                            `
                                : `
                                <form id="loginForm" novalidate>
                                    <div class="mb-3">
                                        <label class="form-label" for="username">Username</label>
                                        <input class="form-control" id="username" name="username" type="text" autocomplete="username" required />
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label" for="password">Password</label>
                                        <input class="form-control" id="password" name="password" type="password" autocomplete="current-password" data-password-toggle required />
                                    </div>
                                    <div class="login-link-row">
                                        <a href="forgot-password.html" class="login-inline-link">Forgot password?</a>
                                        <span class="helper-text">Need a reset link or a fresh session?</span>
                                    </div>
                                    <button class="btn btn-primary w-100" id="loginSubmitBtn" type="submit">
                                        Sign in
                                    </button>
                                    <div class="alert alert-danger mt-3 ${message ? "" : "d-none"}" id="loginError">
                                        ${window.AdminUI.escapeHTML(message || "Unable to sign in.")}
                                    </div>
                                </form>
                            `
                        }
                    </div>
                </div>
            `;

            window.AdminUI.applyAdminBranding();
            window.AdminUI.initPasswordToggles(loginView);
            window.AdminUI.loadAdminBranding().catch(() => undefined);

            if (isBusy) {
                return;
            }

            const loginForm = document.getElementById("loginForm");
            if (loginForm) {
                loginForm.addEventListener("submit", async (event) => {
                    event.preventDefault();
                    const username = document.getElementById("username").value.trim();
                    const password = document.getElementById("password").value;
                    await this.login(username, password);
                });
            }

            const usernameInput = document.getElementById("username");
            if (usernameInput) {
                usernameInput.focus();
            }
        }

        showLoginPage(message = "") {
            if (!this.isLoginPage()) {
                this.updateSessionUI();
                this.emitChange();
                this.redirectToLogin();
                return;
            }

            document.body.classList.add("logged-out");
            document.body.classList.remove("sidebar-open");
            this.clearMessageQuery();
            this.renderLoginScreen(message, false);
            this.updateSessionUI();
            this.emitChange();
        }

        showDashboard() {
            if (this.isLoginPage()) {
                this.emitChange();
                this.redirectToDashboard();
                return;
            }

            document.body.classList.remove("logged-out");
            this.updateSessionUI();
            this.emitChange();
        }

        async validateSession() {
            try {
                const response = await window.fetch(`${window.AdminUI.getApiBaseUrl()}/auth/me`, {
                    headers: {
                        Authorization: `Bearer ${this.token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error("Session validation failed.");
                }

                const data = await response.json();
                this.persistSession(this.token, data.user);
                this.showDashboard();
            } catch (_error) {
                this.clearSession();
                this.showLoginPage();
            }
        }

        async login(username, password) {
            const errorBox = document.getElementById("loginError");
            const submitButton = document.getElementById("loginSubmitBtn");

            if (errorBox) {
                errorBox.classList.add("d-none");
                errorBox.textContent = "";
            }

            if (submitButton) {
                submitButton.disabled = true;
                submitButton.innerHTML =
                    '<span class="spinner-border spinner-border-sm me-2"></span>Signing in';
            }

            try {
                const response = await window.fetch(
                    `${window.AdminUI.getApiBaseUrl()}/auth/login`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            username,
                            password,
                        }),
                    },
                );

                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error("Wrong username or password.");
                }

                this.persistSession(data.token, data.user);
                this.showDashboard();

                if (!this.isLoginPage()) {
                    window.showAlert("Welcome back. You are now signed in.", "success");
                }
            } catch (error) {
                if (errorBox) {
                    errorBox.textContent = error.message || "Wrong username or password.";
                    errorBox.classList.remove("d-none");
                }
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = "Sign in";
                }
            }
        }

        logout(message = "") {
            this.clearSession();

            if (this.isLoginPage()) {
                this.showLoginPage(message || "You have been signed out.");
                return;
            }

            this.redirectToLogin(message || "You have been signed out.");
        }

        async init() {
            this.updateSessionUI();

            if (this.isLoginPage()) {
                this.renderLoginScreen("", true);

                if (this.token) {
                    await this.validateSession();
                } else {
                    this.showLoginPage();
                }

                this.initialized = true;
                return;
            }

            if (!this.token) {
                this.redirectToLogin();
                return;
            }

            await this.validateSession();
            this.initialized = true;
        }
    }

    window.auth = new AuthManager();
    document.addEventListener("DOMContentLoaded", () => {
        window.auth.init();
    });
})();
