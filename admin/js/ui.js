(function () {
    const SOCIAL_LABELS = {
        facebook: "Facebook",
        instagram: "Instagram",
        linkedin: "LinkedIn",
        twitter: "Twitter/X",
        website: "Website",
        whatsapp: "WhatsApp",
        youtube: "YouTube",
    };
    const PASSWORD_POLICY_MESSAGE =
        "Password must be at least 12 characters and include uppercase, lowercase, number, and symbol characters.";
    const DEFAULT_ADMIN_IMAGE_URL = "/assets/img/28753.jpg";
    const DEFAULT_ADMIN_LOGO_ASSET = Object.freeze({
        alt_text: "CP Automation company logo",
        secure_url: "/assets/img/logo.jpg",
        title: "CP Automation Logo",
        url: "/assets/img/logo.jpg",
    });
    const DEFAULT_ADMIN_BRANDING = Object.freeze({
        company_name: "CP Automation",
        logo_asset: DEFAULT_ADMIN_LOGO_ASSET,
    });
    let adminBrandingCache = { ...DEFAULT_ADMIN_BRANDING };
    let adminBrandingLoaded = false;
    let adminBrandingPromise = null;

    function getApiBaseUrl() {
        if (window.__ADMIN_API_BASE_URL) {
            return String(window.__ADMIN_API_BASE_URL).replace(/\/$/, "");
        }

        if (window.location.protocol === "file:") {
            return "http://localhost:5000/api";
        }

        if (["localhost", "127.0.0.1"].includes(window.location.hostname)) {
            return "http://localhost:5000/api";
        }

        return `${window.location.origin.replace(/\/$/, "")}/api`;
    }

    function escapeHTML(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");
    }

    function safeText(value, fallback = "—") {
        if (value === null || value === undefined || value === "") {
            return fallback;
        }

        return escapeHTML(value);
    }

    function getMediaAssetUrl(asset) {
        const secureUrl = String(asset?.secure_url || "").trim();
        if (secureUrl) {
            return secureUrl;
        }

        return String(asset?.url || "").trim();
    }

    function getDefaultImageUrl(kind = "general") {
        return kind === "logo" ? DEFAULT_ADMIN_LOGO_ASSET.secure_url : DEFAULT_ADMIN_IMAGE_URL;
    }

    function truncate(value, maxLength = 90) {
        const text = String(value ?? "");
        if (text.length <= maxLength) {
            return text;
        }

        return `${text.slice(0, maxLength).trim()}...`;
    }

    function formatDate(value) {
        if (!value) {
            return "—";
        }

        try {
            return new Intl.DateTimeFormat(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
            }).format(new Date(value));
        } catch (_error) {
            return String(value);
        }
    }

    function renderStatusPill(isActive, activeLabel = "Published", inactiveLabel = "Draft") {
        return `<span class="status-pill ${isActive ? "is-live" : "is-muted"}">${escapeHTML(
            isActive ? activeLabel : inactiveLabel,
        )}</span>`;
    }

    function renderImageThumb(url, alt = "Preview") {
        return `<img src="${escapeHTML(url || getDefaultImageUrl())}" alt="${escapeHTML(alt)}" class="table-thumbnail" loading="lazy" />`;
    }

    function setImagePreview(
        container,
        imageUrl,
        alt = "Selected image",
        meta = "",
        fallbackUrl = getDefaultImageUrl(),
    ) {
        if (!container) {
            return;
        }

        container.innerHTML = `
            <div class="image-preview-card">
                <img src="${escapeHTML(imageUrl || fallbackUrl)}" alt="${escapeHTML(alt)}" loading="lazy" />
                ${meta ? `<div class="asset-meta">${escapeHTML(meta)}</div>` : ""}
            </div>
        `;
    }

    function normalizeAdminBranding(branding) {
        const companyName =
            String(branding?.company_name || DEFAULT_ADMIN_BRANDING.company_name).trim() ||
            DEFAULT_ADMIN_BRANDING.company_name;

        return {
            ...DEFAULT_ADMIN_BRANDING,
            ...(branding || {}),
            company_name: companyName,
            logo_asset: branding?.logo_asset || DEFAULT_ADMIN_LOGO_ASSET,
        };
    }

    function applyAdminBranding(branding = adminBrandingCache) {
        const normalized = normalizeAdminBranding(branding);
        const companyName = normalized.company_name;
        const logoUrl = getMediaAssetUrl(normalized.logo_asset) || getDefaultImageUrl("logo");
        const logoAlt =
            String(normalized.logo_asset?.alt_text || `${companyName} logo`).trim() ||
            `${companyName} logo`;

        adminBrandingCache = normalized;

        document.querySelectorAll("[data-admin-brand-name]").forEach((element) => {
            element.textContent = companyName;
        });

        document.querySelectorAll("[data-admin-brand-logo]").forEach((element) => {
            if (!(element instanceof window.HTMLImageElement)) {
                return;
            }

            element.alt = logoAlt;

            element.src = logoUrl;
            element.classList.remove("d-none");
        });

        document.querySelectorAll("[data-admin-brand-fallback]").forEach((element) => {
            element.classList.toggle("d-none", true);
        });
    }

    async function loadAdminBranding(forceRefresh = false) {
        if (adminBrandingLoaded && !forceRefresh) {
            applyAdminBranding(adminBrandingCache);
            return adminBrandingCache;
        }

        if (adminBrandingPromise && !forceRefresh) {
            return adminBrandingPromise;
        }

        adminBrandingPromise = window
            .fetch(`${getApiBaseUrl()}/site-settings`, {
                headers: {
                    Accept: "application/json",
                },
            })
            .then(async (response) => {
                if (!response.ok) {
                    if (response.status === 404) {
                        return { ...DEFAULT_ADMIN_BRANDING };
                    }

                    throw new Error(`Unable to load branding (${response.status}).`);
                }

                const payload = await response.json().catch(() => ({}));
                return payload && typeof payload === "object"
                    ? payload
                    : { ...DEFAULT_ADMIN_BRANDING };
            })
            .catch(() => adminBrandingCache || { ...DEFAULT_ADMIN_BRANDING })
            .then((branding) => {
                adminBrandingLoaded = true;
                applyAdminBranding(branding);
                return adminBrandingCache;
            })
            .finally(() => {
                adminBrandingPromise = null;
            });

        return adminBrandingPromise;
    }

    function updateAdminBranding(branding) {
        adminBrandingLoaded = true;
        applyAdminBranding(branding);
        return adminBrandingCache;
    }

    function initPasswordToggles(root = document) {
        const scope =
            root && typeof root.querySelectorAll === "function" ? root : document;

        scope.querySelectorAll("input[data-password-toggle]").forEach((input) => {
            if (!(input instanceof window.HTMLInputElement) || input.dataset.passwordToggleReady === "true") {
                return;
            }

            const wrapper = document.createElement("div");
            wrapper.className = "password-toggle-field";

            input.parentNode?.insertBefore(wrapper, input);
            wrapper.appendChild(input);

            const button = document.createElement("button");
            button.type = "button";
            button.className = "password-toggle-button";
            button.setAttribute("aria-label", "Show password");
            button.setAttribute("aria-pressed", "false");
            button.innerHTML = '<i class="fa-regular fa-eye" aria-hidden="true"></i>';

            button.addEventListener("click", () => {
                const shouldReveal = input.type === "password";
                input.type = shouldReveal ? "text" : "password";
                button.setAttribute("aria-label", shouldReveal ? "Hide password" : "Show password");
                button.setAttribute("aria-pressed", shouldReveal ? "true" : "false");
                button.innerHTML = shouldReveal
                    ? '<i class="fa-regular fa-eye-slash" aria-hidden="true"></i>'
                    : '<i class="fa-regular fa-eye" aria-hidden="true"></i>';
            });

            wrapper.appendChild(button);
            input.dataset.passwordToggleReady = "true";
        });
    }

    function validateImageFile(file, maxBytes = 10 * 1024 * 1024) {
        if (!file) {
            return;
        }

        if (!String(file.type || "").startsWith("image/")) {
            throw new Error("Please choose an image file.");
        }

        if (file.size > maxBytes) {
            throw new Error("Image uploads must be 10MB or smaller.");
        }
    }

    function renderEmptyState(title, description, icon = "fa-circle-info") {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="fa-solid ${escapeHTML(icon)}"></i>
                </div>
                <h3 class="h5 mb-2">${escapeHTML(title)}</h3>
                <p class="text-muted mb-0">${escapeHTML(description)}</p>
            </div>
        `;
    }

    function renderLoadingTable(colspan, label = "Loading...") {
        return `
            <tr>
                <td colspan="${colspan}" class="text-center py-4 text-muted">
                    ${escapeHTML(label)}
                </td>
            </tr>
        `;
    }

    function showAlert(message, type = "success") {
        const alertContainer = document.getElementById("alertContainer");
        if (!alertContainer) {
            return;
        }

        const normalizedType = ["success", "danger", "warning", "info"].includes(type)
            ? type
            : "info";
        const alertElement = document.createElement("div");
        alertElement.className = `alert alert-${normalizedType} alert-dismissible fade show`;
        alertElement.role = "alert";
        alertElement.innerHTML = `
            <div class="d-flex align-items-start gap-2">
                <i class="fa-solid ${
                    normalizedType === "success"
                        ? "fa-circle-check"
                        : normalizedType === "danger"
                          ? "fa-circle-exclamation"
                          : normalizedType === "warning"
                            ? "fa-triangle-exclamation"
                            : "fa-circle-info"
                } mt-1"></i>
                <div class="flex-grow-1">${escapeHTML(message)}</div>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        alertContainer.appendChild(alertElement);

        window.setTimeout(() => {
            if (!alertElement.isConnected) {
                return;
            }

            if (window.bootstrap && window.bootstrap.Alert) {
                window.bootstrap.Alert.getOrCreateInstance(alertElement).close();
                return;
            }

            alertElement.remove();
        }, 5000);
    }

    function slugify(value) {
        return String(value ?? "")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
    }

    function splitLines(value) {
        return String(value ?? "")
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);
    }

    function linesToText(items) {
        if (!Array.isArray(items)) {
            return "";
        }

        return items
            .map((item) => {
                if (typeof item === "string") {
                    return item;
                }

                if (item && typeof item === "object" && "title" in item && "body" in item) {
                    return `${item.title || ""} | ${item.body || ""}`;
                }

                if (item && typeof item === "object" && "label" in item && "value" in item) {
                    return `${item.label || ""} | ${item.value || ""}`;
                }

                return String(item ?? "");
            })
            .join("\n");
    }

    function parseLinkLines(value, leftKey = "label", rightKey = "url") {
        return splitLines(value).map((line, index) => {
            const parts = line.split("|");
            if (parts.length < 2) {
                throw new Error(`Line ${index + 1} must use "Label | URL".`);
            }

            const left = parts.shift().trim();
            const right = parts.join("|").trim();

            if (!left || !right) {
                throw new Error(`Line ${index + 1} must include both label and URL.`);
            }

            return {
                [leftKey]: left,
                [rightKey]: right,
            };
        });
    }

    function formatLinkLines(items, leftKey = "label", rightKey = "url") {
        if (!Array.isArray(items)) {
            return "";
        }

        return items
            .map((item) => `${item?.[leftKey] || ""} | ${item?.[rightKey] || ""}`.trim())
            .filter(Boolean)
            .join("\n");
    }

    function parseStatLines(value) {
        return splitLines(value).map((line, index) => {
            const parts = line.split("|");
            if (parts.length < 2) {
                throw new Error(`Line ${index + 1} must use "Label | Value".`);
            }

            const label = parts.shift().trim();
            const statValue = parts.join("|").trim();

            if (!label || !statValue) {
                throw new Error(`Line ${index + 1} must include both label and value.`);
            }

            const normalizedValue = /^-?\d+(\.\d+)?$/.test(statValue)
                ? Number(statValue)
                : statValue;

            return {
                label,
                value: normalizedValue,
            };
        });
    }

    function formatStatLines(items) {
        return formatLinkLines(items, "label", "value");
    }

    function parseProcessStepLines(value) {
        return splitLines(value).map((line, index) => {
            const parts = line.split("|");
            if (parts.length < 2) {
                throw new Error(`Line ${index + 1} must use "Step title | Step body".`);
            }

            const title = parts.shift().trim();
            const body = parts.join("|").trim();

            if (!title || !body) {
                throw new Error(`Line ${index + 1} must include both step title and body.`);
            }

            return {
                body,
                step: index + 1,
                title,
            };
        });
    }

    function formatProcessStepLines(items) {
        if (!Array.isArray(items)) {
            return "";
        }

        return items
            .map((item) => `${item?.title || ""} | ${item?.body || ""}`.trim())
            .filter(Boolean)
            .join("\n");
    }

    function socialLinksToMap(links) {
        if (!links) {
            return {};
        }

        if (Array.isArray(links)) {
            return links.reduce((accumulator, item) => {
                if (!item?.platform || !item?.url) {
                    return accumulator;
                }

                accumulator[String(item.platform).trim().toLowerCase()] = String(item.url).trim();
                return accumulator;
            }, {});
        }

        if (typeof links === "object") {
            return Object.entries(links).reduce((accumulator, [key, value]) => {
                if (!value) {
                    return accumulator;
                }

                accumulator[String(key).trim().toLowerCase()] = String(value).trim();
                return accumulator;
            }, {});
        }

        return {};
    }

    function socialMapToLinks(record) {
        return Object.entries(record || {})
            .filter(([, value]) => String(value || "").trim())
            .map(([platform, url]) => ({
                isPlaceholder: String(url).trim() === "#",
                platform:
                    SOCIAL_LABELS[platform] ||
                    platform.replace(/(^\w|\s\w)/g, (match) => match.toUpperCase()),
                url: String(url).trim(),
            }));
    }

    function setButtonBusy(button, isBusy, idleLabel, busyLabel) {
        if (!button) {
            return;
        }

        button.disabled = Boolean(isBusy);
        button.textContent = isBusy ? busyLabel : idleLabel;
    }

    function renderMediaSummary(asset, emptyLabel = "No media connected", kind = "general") {
        const normalizedAsset = asset || {
            alt_text: kind === "logo" ? "Default logo" : emptyLabel,
            file_name: kind === "logo" ? "logo.jpg" : "default-image.jpg",
            id: "default",
            secure_url: getDefaultImageUrl(kind),
            title: kind === "logo" ? "Default logo" : "Default image",
            url: getDefaultImageUrl(kind),
        };

        return `
            <div class="asset-summary-card">
                ${
                    normalizedAsset.secure_url || normalizedAsset.url
                        ? `<img class="asset-summary-image" src="${escapeHTML(normalizedAsset.secure_url || normalizedAsset.url)}" alt="${escapeHTML(normalizedAsset.alt_text || normalizedAsset.title || "Uploaded media")}" loading="lazy" />`
                        : ""
                }
                <div class="asset-summary-body">
                    <strong>${escapeHTML(normalizedAsset.title || normalizedAsset.file_name || "Media asset")}</strong>
                    <div class="entity-meta">Asset ID: ${escapeHTML(normalizedAsset.id)}</div>
                    <div class="entity-meta">${escapeHTML(normalizedAsset.alt_text || "No alt text yet")}</div>
                </div>
            </div>
        `;
    }

    window.AdminUI = {
        applyAdminBranding,
        escapeHTML,
        formatDate,
        formatLinkLines,
        formatProcessStepLines,
        formatStatLines,
        getApiBaseUrl,
        getDefaultImageUrl,
        getMediaAssetUrl,
        getPasswordPolicyMessage: () => PASSWORD_POLICY_MESSAGE,
        initPasswordToggles,
        loadAdminBranding,
        linesToText,
        parseLinkLines,
        parseProcessStepLines,
        parseStatLines,
        renderEmptyState,
        renderImageThumb,
        renderLoadingTable,
        renderMediaSummary,
        renderStatusPill,
        safeText,
        setButtonBusy,
        setImagePreview,
        showAlert,
        slugify,
        socialLinksToMap,
        socialMapToLinks,
        splitLines,
        truncate,
        updateAdminBranding,
        validateImageFile,
    };

    window.showAlert = showAlert;
})();
