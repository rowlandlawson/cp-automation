(function () {
    const PASSWORD_POLICY_MESSAGE = window.AdminUI.getPasswordPolicyMessage();

    const AccountSettingsPage = {
        init() {
            const contentArea = document.getElementById("contentArea");
            if (!contentArea) {
                return;
            }

            const user = window.auth?.user || {};

            contentArea.innerHTML = `
                <div class="page-shell">
                    <section class="panel-card page-header-card">
                        <div>
                            <p class="eyebrow text-primary mb-2">Admin security</p>
                            <h3 class="mb-2">Manage your recovery email and password from one place.</h3>
                            <p class="page-summary">
                                The recovery email saved on this account receives future forgot-password reset links
                                and verification codes. Password changes still issue a fresh admin session
                                immediately.
                            </p>
                        </div>
                    </section>

                    <div class="page-layout">
                        <section class="form-card">
                            <div class="card-title-row">
                                <div>
                                    <h3 class="mb-1">Update recovery email</h3>
                                    <p class="helper-text mb-0">
                                        Use your current password to confirm the change before the new email becomes
                                        the recovery destination.
                                    </p>
                                </div>
                            </div>

                            <form id="accountEmailForm" novalidate>
                                <div class="field-stack">
                                    <div>
                                        <label class="form-label" for="accountEmail">New recovery email</label>
                                        <input
                                            class="form-control"
                                            id="accountEmail"
                                            name="accountEmail"
                                            type="email"
                                            autocomplete="email"
                                            value="${window.AdminUI.escapeHTML(user.email || "")}"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label class="form-label" for="confirmAccountEmail">Confirm new recovery email</label>
                                        <input
                                            class="form-control"
                                            id="confirmAccountEmail"
                                            name="confirmAccountEmail"
                                            type="email"
                                            autocomplete="email"
                                            value="${window.AdminUI.escapeHTML(user.email || "")}"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label class="form-label" for="currentPasswordForEmail">Current password</label>
                                        <input
                                            class="form-control"
                                            id="currentPasswordForEmail"
                                            name="currentPasswordForEmail"
                                            type="password"
                                            autocomplete="current-password"
                                            data-password-toggle
                                            required
                                        />
                                    </div>
                                </div>

                                <div class="alert alert-danger mt-3 d-none" id="accountEmailError" role="alert"></div>

                                <div class="stack-actions mt-4">
                                    <button class="btn btn-primary" id="accountEmailSubmit" type="submit">Update email</button>
                                    <button class="btn btn-soft" id="accountEmailReset" type="button">Clear email form</button>
                                </div>
                            </form>

                            <div class="border-top pt-4 mt-4">
                                <div class="card-title-row">
                                    <div>
                                        <h3 class="mb-1">Change password</h3>
                                        <p class="helper-text mb-0">${window.AdminUI.escapeHTML(PASSWORD_POLICY_MESSAGE)}</p>
                                    </div>
                                </div>

                                <form id="accountPasswordForm" novalidate>
                                    <div class="field-stack">
                                        <div>
                                            <label class="form-label" for="currentPassword">Current password</label>
                                            <input class="form-control" id="currentPassword" name="currentPassword" type="password" autocomplete="current-password" data-password-toggle required />
                                        </div>
                                        <div>
                                            <label class="form-label" for="newPassword">New password</label>
                                            <input class="form-control" id="newPassword" name="newPassword" type="password" autocomplete="new-password" data-password-toggle required />
                                        </div>
                                        <div>
                                            <label class="form-label" for="confirmNewPassword">Confirm new password</label>
                                            <input class="form-control" id="confirmNewPassword" name="confirmNewPassword" type="password" autocomplete="new-password" data-password-toggle required />
                                        </div>
                                    </div>

                                    <div class="login-link-row mt-3">
                                        <a href="forgot-password.html" class="login-inline-link">Open forgot-password flow</a>
                                        <span class="helper-text">You can recover by email link or verification code.</span>
                                    </div>

                                    <div class="alert alert-danger mt-3 d-none" id="accountPasswordError" role="alert"></div>

                                    <div class="stack-actions mt-4">
                                        <button class="btn btn-primary" id="accountPasswordSubmit" type="submit">Update password</button>
                                        <button class="btn btn-soft" id="accountPasswordReset" type="button">Clear password form</button>
                                    </div>
                                </form>
                            </div>
                        </section>

                        <aside class="panel-card preview-card">
                            <div class="preview-stack">
                                <div class="preview-block">
                                    <div class="preview-label">Signed-in account</div>
                                    <div class="preview-title" data-account-username>${window.AdminUI.escapeHTML(user.username || "Admin user")}</div>
                                    <p class="preview-copy mb-0" data-account-email>${window.AdminUI.escapeHTML(user.email || "No email found for this session.")}</p>
                                </div>

                                <div class="preview-block">
                                    <div class="preview-label">Role</div>
                                    <p class="preview-copy mb-0" data-account-role>${window.AdminUI.escapeHTML(user.role || "admin")}</p>
                                </div>

                                <div class="preview-block">
                                    <div class="preview-label">Password standard</div>
                                    <ul class="settings-policy-list mb-0">
                                        <li>At least 12 characters</li>
                                        <li>One uppercase letter</li>
                                        <li>One lowercase letter</li>
                                        <li>One number</li>
                                        <li>One symbol</li>
                                    </ul>
                                </div>

                                <div class="preview-block">
                                    <div class="preview-label">Recovery path</div>
                                    <p class="preview-copy mb-0">
                                        Future forgot-password requests are sent to the recovery email shown above and can
                                        be completed with either the email link or the verification-code flow.
                                    </p>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            `;

            this.bindEvents();
            window.AdminUI.initPasswordToggles(contentArea);
            this.updatePreview(user);
        },

        bindEvents() {
            const emailForm = document.getElementById("accountEmailForm");
            const passwordForm = document.getElementById("accountPasswordForm");
            const emailResetButton = document.getElementById("accountEmailReset");
            const passwordResetButton = document.getElementById("accountPasswordReset");

            emailForm?.addEventListener("submit", (event) => {
                event.preventDefault();
                this.handleEmailSubmit();
            });

            passwordForm?.addEventListener("submit", (event) => {
                event.preventDefault();
                this.handlePasswordSubmit();
            });

            emailResetButton?.addEventListener("click", () => {
                emailForm?.reset();
                const currentEmail = window.auth?.user?.email || "";
                const accountEmail = document.getElementById("accountEmail");
                const confirmAccountEmail = document.getElementById("confirmAccountEmail");
                if (accountEmail) {
                    accountEmail.value = currentEmail;
                }
                if (confirmAccountEmail) {
                    confirmAccountEmail.value = currentEmail;
                }
                this.showError("accountEmailError", "");
            });

            passwordResetButton?.addEventListener("click", () => {
                passwordForm?.reset();
                this.showError("accountPasswordError", "");
            });
        },

        showError(elementId, message) {
            const errorBox = document.getElementById(elementId);
            if (!errorBox) {
                return;
            }

            if (!message) {
                errorBox.textContent = "";
                errorBox.classList.add("d-none");
                return;
            }

            errorBox.textContent = message;
            errorBox.classList.remove("d-none");
        },

        syncSession(response) {
            if (response?.token && response?.user && window.auth) {
                window.auth.persistSession(response.token, response.user);
                window.auth.updateSessionUI?.();
                window.auth.emitChange?.();
                this.updatePreview(response.user);
            }
        },

        updatePreview(user = window.auth?.user || {}) {
            const username = document.querySelector("[data-account-username]");
            const email = document.querySelector("[data-account-email]");
            const role = document.querySelector("[data-account-role]");
            const accountEmailInput = document.getElementById("accountEmail");
            const confirmAccountEmailInput = document.getElementById("confirmAccountEmail");

            if (username) {
                username.textContent = user.username || "Admin user";
            }

            if (email) {
                email.textContent = user.email || "No email found for this session.";
            }

            if (role) {
                role.textContent = user.role || "admin";
            }

            if (accountEmailInput && !accountEmailInput.value) {
                accountEmailInput.value = user.email || "";
            }

            if (confirmAccountEmailInput && !confirmAccountEmailInput.value) {
                confirmAccountEmailInput.value = user.email || "";
            }
        },

        async handleEmailSubmit() {
            const submitButton = document.getElementById("accountEmailSubmit");
            const email = document.getElementById("accountEmail")?.value?.trim().toLowerCase() || "";
            const confirmEmail =
                document.getElementById("confirmAccountEmail")?.value?.trim().toLowerCase() || "";
            const currentPassword = document.getElementById("currentPasswordForEmail")?.value || "";

            this.showError("accountEmailError", "");

            if (email !== confirmEmail) {
                this.showError("accountEmailError", "New email and confirmation do not match.");
                return;
            }

            window.AdminUI.setButtonBusy(submitButton, true, "Update email", "Updating...");

            try {
                const response = await window.api.changeEmail({
                    current_password: currentPassword,
                    email,
                });

                this.syncSession(response);
                document.getElementById("accountEmailForm")?.reset();

                const accountEmail = document.getElementById("accountEmail");
                const confirmAccountEmail = document.getElementById("confirmAccountEmail");
                if (accountEmail) {
                    accountEmail.value = response?.user?.email || email;
                }
                if (confirmAccountEmail) {
                    confirmAccountEmail.value = response?.user?.email || email;
                }

                window.showAlert(response?.message || "Recovery email updated successfully.", "success");
            } catch (error) {
                this.showError("accountEmailError", error.message || "Unable to update recovery email.");
            } finally {
                window.AdminUI.setButtonBusy(submitButton, false, "Update email", "Updating...");
            }
        },

        async handlePasswordSubmit() {
            const submitButton = document.getElementById("accountPasswordSubmit");
            const currentPassword = document.getElementById("currentPassword")?.value || "";
            const newPassword = document.getElementById("newPassword")?.value || "";
            const confirmNewPassword = document.getElementById("confirmNewPassword")?.value || "";

            this.showError("accountPasswordError", "");

            if (newPassword !== confirmNewPassword) {
                this.showError("accountPasswordError", "New password and confirmation do not match.");
                return;
            }

            window.AdminUI.setButtonBusy(submitButton, true, "Update password", "Updating...");

            try {
                const response = await window.api.changePassword({
                    current_password: currentPassword,
                    new_password: newPassword,
                });

                this.syncSession(response);
                document.getElementById("accountPasswordForm")?.reset();
                window.showAlert(response?.message || "Password changed successfully.", "success");
            } catch (error) {
                this.showError("accountPasswordError", error.message || "Unable to change password.");
            } finally {
                window.AdminUI.setButtonBusy(submitButton, false, "Update password", "Updating...");
            }
        },
    };

    window.AccountSettingsPage = AccountSettingsPage;
})();
