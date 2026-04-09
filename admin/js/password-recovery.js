(function () {
    const RECOVERY_SESSION_KEY = "adminPasswordRecovery";

    function getPageType() {
        return document.body?.dataset.adminPage || "";
    }

    function buildPageUrl(fileName, message = "") {
        const target = new URL(fileName, document.baseURI || window.location.href);
        target.search = "";
        target.hash = "";

        if (message) {
            target.searchParams.set("message", message);
        }

        return target.toString();
    }

    function buildPageUrlWithParams(fileName, params = {}) {
        const target = new URL(fileName, document.baseURI || window.location.href);
        target.search = "";
        target.hash = "";

        Object.entries(params).forEach(([key, value]) => {
            if (value) {
                target.searchParams.set(key, String(value));
            }
        });

        return target.toString();
    }

    function setMessage(element, message, type = "success") {
        if (!element) {
            return;
        }

        element.textContent = message || "";
        element.classList.toggle("d-none", !message);

        if (element.classList.contains("auth-recovery-note")) {
            element.classList.toggle("is-danger", type === "danger");
            element.classList.toggle("is-info", type !== "danger");
        }
    }

    function normalizeVerificationCode(value) {
        return String(value || "").replace(/\s+/g, "").slice(0, 6);
    }

    function storeRecoverySession(payload) {
        window.sessionStorage.setItem(RECOVERY_SESSION_KEY, JSON.stringify(payload));
    }

    function clearRecoverySession() {
        window.sessionStorage.removeItem(RECOVERY_SESSION_KEY);
    }

    function getRecoverySession() {
        try {
            const rawValue = window.sessionStorage.getItem(RECOVERY_SESSION_KEY);
            if (!rawValue) {
                return null;
            }

            const payload = JSON.parse(rawValue);
            if (!payload || typeof payload !== "object") {
                return null;
            }

            const identifier = typeof payload.identifier === "string" ? payload.identifier : "";
            const code = typeof payload.code === "string" ? payload.code : "";

            if (!identifier || !code) {
                return null;
            }

            return {
                code,
                identifier,
            };
        } catch (_error) {
            return null;
        }
    }

    async function initForgotPasswordPage() {
        const form = document.getElementById("forgotPasswordForm");
        const identifierInput = document.getElementById("identifier");
        const submitButton = document.getElementById("forgotPasswordSubmit");
        const successBox = document.getElementById("forgotPasswordSuccess");
        const errorBox = document.getElementById("forgotPasswordError");
        const debugBox = document.getElementById("forgotPasswordDebug");
        const apiBase = document.getElementById("forgotPasswordApiBase");

        if (apiBase) {
            apiBase.textContent = window.AdminUI.getApiBaseUrl();
        }

        identifierInput?.focus();

        form?.addEventListener("submit", async (event) => {
            event.preventDefault();

            const identifier = identifierInput?.value?.trim() || "";

            setMessage(successBox, "");
            setMessage(errorBox, "");
            setMessage(debugBox, "");

            window.AdminUI.setButtonBusy(
                submitButton,
                true,
                "Send recovery instructions",
                "Sending...",
            );

            try {
                const response = await window.api.forgotPassword({
                    identifier,
                });

                setMessage(
                    successBox,
                    response?.message ||
                        "If the account exists, a reset link and verification code have been prepared.",
                );

                const infoParts = [];
                const verifyUrl = buildPageUrlWithParams("verify-reset-code.html", {
                    identifier,
                });

                infoParts.push(
                    `<strong>Prefer the code flow?</strong><br /><a href="${window.AdminUI.escapeHTML(verifyUrl)}">Open the verification-code page</a>`,
                );

                if (response?.debug_reset_url) {
                    infoParts.push(
                        `<strong>Local debug reset link:</strong><br /><a href="${window.AdminUI.escapeHTML(response.debug_reset_url)}">${window.AdminUI.escapeHTML(response.debug_reset_url)}</a>`,
                    );
                }

                if (response?.debug_verification_code) {
                    infoParts.push(
                        `<strong>Local debug verification code:</strong><br /><span>${window.AdminUI.escapeHTML(response.debug_verification_code)}</span>`,
                    );
                }

                if (debugBox && infoParts.length > 0) {
                    debugBox.innerHTML = infoParts.join("<br /><br />");
                    debugBox.classList.remove("d-none");
                    debugBox.classList.remove("is-danger");
                    debugBox.classList.add("is-info");
                }

                form.reset();
            } catch (error) {
                setMessage(
                    errorBox,
                    error.message || "Unable to request recovery instructions right now.",
                    "danger",
                );
            } finally {
                window.AdminUI.setButtonBusy(
                    submitButton,
                    false,
                    "Send recovery instructions",
                    "Sending...",
                );
            }
        });
    }

    async function initVerifyResetCodePage() {
        const params = new URLSearchParams(window.location.search);
        const form = document.getElementById("verifyResetCodeForm");
        const identifierInput = document.getElementById("verifyIdentifier");
        const codeInput = document.getElementById("verificationCode");
        const submitButton = document.getElementById("verifyResetCodeSubmit");
        const successBox = document.getElementById("verifyResetCodeSuccess");
        const errorBox = document.getElementById("verifyResetCodeError");

        if (identifierInput && params.get("identifier")) {
            identifierInput.value = params.get("identifier") || "";
        }

        identifierInput?.focus();

        codeInput?.addEventListener("input", () => {
            codeInput.value = normalizeVerificationCode(codeInput.value);
        });

        form?.addEventListener("submit", async (event) => {
            event.preventDefault();

            const identifier = identifierInput?.value?.trim() || "";
            const code = normalizeVerificationCode(codeInput?.value);

            setMessage(successBox, "");
            setMessage(errorBox, "");

            window.AdminUI.setButtonBusy(submitButton, true, "Verify code", "Verifying...");

            try {
                const response = await window.api.verifyResetCode({
                    code,
                    identifier,
                });

                storeRecoverySession({
                    code,
                    identifier,
                });

                setMessage(
                    successBox,
                    response?.message || "Verification code accepted. Redirecting to the reset form...",
                );

                window.setTimeout(() => {
                    window.location.replace(
                        buildPageUrlWithParams("reset-password.html", {
                            mode: "code",
                        }),
                    );
                }, 700);
            } catch (error) {
                setMessage(
                    errorBox,
                    error.message || "Unable to verify this recovery code.",
                    "danger",
                );
            } finally {
                window.AdminUI.setButtonBusy(submitButton, false, "Verify code", "Verifying...");
            }
        });
    }

    async function initResetPasswordPage() {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token") || "";
        const form = document.getElementById("resetPasswordForm");
        const submitButton = document.getElementById("resetPasswordSubmit");
        const successBox = document.getElementById("resetPasswordSuccess");
        const errorBox = document.getElementById("resetPasswordError");
        const tokenState = document.getElementById("resetTokenState");
        const policyLabel = document.getElementById("resetPasswordPolicy");
        const storedRecovery = getRecoverySession();

        if (policyLabel) {
            policyLabel.textContent = window.AdminUI.getPasswordPolicyMessage();
        }

        if (!token && !storedRecovery) {
            setMessage(
                tokenState,
                "This reset page needs either a link token or a verified recovery code. Request a fresh email or verify a code before continuing.",
                "danger",
            );
            submitButton?.setAttribute("disabled", "disabled");
            return;
        }

        if (token) {
            clearRecoverySession();
            setMessage(tokenState, "Reset link detected. Submit a new password to complete recovery.");
        } else {
            setMessage(
                tokenState,
                "Verification code confirmed. Submit your new password to complete recovery.",
            );
        }

        document.getElementById("newPassword")?.focus();

        form?.addEventListener("submit", async (event) => {
            event.preventDefault();

            const newPassword = document.getElementById("newPassword")?.value || "";
            const confirmPassword = document.getElementById("confirmPassword")?.value || "";

            setMessage(successBox, "");
            setMessage(errorBox, "");

            if (newPassword !== confirmPassword) {
                setMessage(errorBox, "New password and confirmation do not match.", "danger");
                return;
            }

            window.AdminUI.setButtonBusy(submitButton, true, "Update password", "Updating...");

            try {
                const payload = token
                    ? {
                          password: newPassword,
                          token,
                      }
                    : {
                          code: storedRecovery.code,
                          identifier: storedRecovery.identifier,
                          password: newPassword,
                      };

                const response = await window.api.resetPassword(payload);

                clearRecoverySession();

                setMessage(
                    successBox,
                    response?.message || "Password reset successful. Redirecting to sign in...",
                );

                window.setTimeout(() => {
                    window.location.replace(
                        buildPageUrl(
                            "login.html",
                            "Password reset successful. Sign in with your new password.",
                        ),
                    );
                }, 900);
            } catch (error) {
                setMessage(
                    errorBox,
                    error.message || "Unable to reset password with these recovery details.",
                    "danger",
                );
            } finally {
                window.AdminUI.setButtonBusy(submitButton, false, "Update password", "Updating...");
            }
        });
    }

    document.addEventListener("DOMContentLoaded", async () => {
        if (getPageType() === "forgot-password") {
            await initForgotPasswordPage();
            return;
        }

        if (getPageType() === "verify-reset-code") {
            await initVerifyResetCodePage();
            return;
        }

        if (getPageType() === "reset-password") {
            await initResetPasswordPage();
        }
    });
})();
