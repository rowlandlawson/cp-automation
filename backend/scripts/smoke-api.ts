import "dotenv/config";

import { adminSeed } from "../prisma/seed-data";

type ApiResponse<T = unknown> = {
  payload: T | string | null;
  status: number;
};

type ApiBody = ArrayBuffer | Blob | FormData | string | Uint8Array;
type ApiHeaders = Array<[string, string]> | Headers | Record<string, string>;
type JsonRecord = Record<string, unknown>;

const apiBaseUrl = (
  process.env.SMOKE_API_BASE_URL || `http://127.0.0.1:${process.env.PORT || 5000}/api`
).replace(/\/$/, "");

const adminUsername = process.env.SMOKE_ADMIN_USERNAME || adminSeed.username;
const adminPassword = process.env.SMOKE_ADMIN_PASSWORD || adminSeed.password;

const smokeKey = `smoke-${Date.now()}`;

const cleanupTasks: Array<() => Promise<void>> = [];
let cleanupCompleted = false;

function pushCleanup(task: () => Promise<void>): void {
  cleanupTasks.unshift(task);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function logStep(message: string): void {
  console.log(`[smoke] ${message}`);
}

async function apiRequest<T = unknown>(
  path: string,
  options: {
    body?: ApiBody | JsonRecord;
    headers?: ApiHeaders;
    method?: string;
    token?: string;
  } = {},
): Promise<ApiResponse<T>> {
  const headers = new Headers(options.headers || {});
  const isFormData = options.body instanceof FormData;
  const isBlob = options.body instanceof Blob;
  const isJsonBody =
    options.body !== undefined &&
    !isFormData &&
    !isBlob &&
    typeof options.body === "object" &&
    !(options.body instanceof ArrayBuffer);

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  let body: ApiBody | undefined;
  if (isJsonBody) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.body);
  } else if (options.body !== undefined) {
    body = options.body as ApiBody;
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    body,
    headers,
    method: options.method || "GET",
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? ((await response.json().catch(() => null)) as T | null)
    : await response.text().catch(() => "");

  return {
    payload,
    status: response.status,
  };
}

function expectStatus(response: ApiResponse, expectedStatus: number, label: string): void {
  if (response.status !== expectedStatus) {
    throw new Error(
      `${label} failed. Expected HTTP ${expectedStatus}, received ${response.status}.`,
    );
  }
}

function getJsonObject(response: ApiResponse, label: string): JsonRecord {
  assert(
    response.payload && typeof response.payload === "object" && !Array.isArray(response.payload),
    `${label} did not return a JSON object.`,
  );

  return response.payload as JsonRecord;
}

function getJsonArray(response: ApiResponse, label: string): JsonRecord[] {
  assert(Array.isArray(response.payload), `${label} did not return a JSON array.`);
  return response.payload as JsonRecord[];
}

function createPngBlob(variant: "a" | "b"): Blob {
  const base64 =
    variant === "a"
      ? "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2P8/5+hHgAHggJ/Pm6q3QAAAABJRU5ErkJggg=="
      : "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADElEQVR42mP8z/C/HwAGgwJ/l7sRKQAAAABJRU5ErkJggg==";

  return new Blob([Buffer.from(base64, "base64")], { type: "image/png" });
}

async function uploadMediaAsset(
  token: string,
  variant: "a" | "b",
  title: string,
): Promise<JsonRecord> {
  const formData = new FormData();
  formData.append("image", createPngBlob(variant), `${title}.png`);
  formData.append("title", title);
  formData.append("alt_text", `${title} alt text`);

  const response = await apiRequest("/media/upload", {
    body: formData,
    method: "POST",
    token,
  });

  expectStatus(response, 201, `upload media asset ${title}`);
  return getJsonObject(response, `upload media asset ${title}`);
}

async function runCleanup(): Promise<void> {
  if (cleanupCompleted) {
    return;
  }

  cleanupCompleted = true;

  for (const cleanupTask of cleanupTasks) {
    try {
      await cleanupTask();
    } catch (error) {
      console.warn(
        `[smoke] Cleanup failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

async function main(): Promise<void> {
  logStep(`Running smoke suite against ${apiBaseUrl}`);

  const health = await apiRequest("/health");
  expectStatus(health, 200, "health check");

  const unauthMedia = await apiRequest("/media");
  expectStatus(unauthMedia, 401, "auth guard on /media");

  const unauthProducts = await apiRequest("/products/admin/all");
  expectStatus(unauthProducts, 401, "auth guard on /products/admin/all");

  const unauthChangePassword = await apiRequest("/auth/change-password", {
    body: {
      current_password: "invalid",
      new_password: "AnotherSecure123!",
    },
    method: "POST",
  });
  expectStatus(unauthChangePassword, 401, "auth guard on /auth/change-password");

  const login = await apiRequest("/auth/login", {
    body: {
      password: adminPassword,
      username: adminUsername,
    },
    method: "POST",
  });

  expectStatus(login, 200, "admin login");
  const loginPayload = getJsonObject(login, "admin login");
  const token = String(loginPayload.token || "");
  assert(token, "admin login did not return a token.");
  logStep("Authenticated successfully.");

  const me = await apiRequest("/auth/me", { token });
  expectStatus(me, 200, "auth me");

  const passwordPolicy = await apiRequest("/auth/password-policy");
  expectStatus(passwordPolicy, 200, "password policy");

  const forgotPassword = await apiRequest("/auth/forgot-password", {
    body: {
      identifier: adminUsername,
    },
    method: "POST",
  });
  expectStatus(forgotPassword, 200, "forgot password");

  const invalidResetPassword = await apiRequest("/auth/reset-password", {
    body: {
      password: "AnotherSecure123!",
      token: `${smokeKey}-invalid-token`,
    },
    method: "POST",
  });
  expectStatus(invalidResetPassword, 400, "reject invalid reset token");

  const invalidChangePassword = await apiRequest("/auth/change-password", {
    body: {
      current_password: `${smokeKey}-wrong-password`,
      new_password: "AnotherSecure123!",
    },
    method: "POST",
    token,
  });
  expectStatus(invalidChangePassword, 400, "reject invalid current password");

  const siteSettings = await apiRequest("/site-settings");
  expectStatus(siteSettings, 200, "public site settings");

  const homePage = await apiRequest("/home-page");
  expectStatus(homePage, 200, "public home page");

  const aboutPage = await apiRequest("/about-page");
  expectStatus(aboutPage, 200, "public about page");

  const mediaAssetA = await uploadMediaAsset(token, "a", `${smokeKey}-media-a`);
  const mediaAssetAId = Number(mediaAssetA.id);
  assert(Number.isInteger(mediaAssetAId), "media asset A did not return an id.");
  pushCleanup(async () => {
    await apiRequest(`/media/${mediaAssetAId}`, { method: "DELETE", token });
  });

  const mediaAssetB = await uploadMediaAsset(token, "b", `${smokeKey}-media-b`);
  const mediaAssetBId = Number(mediaAssetB.id);
  assert(Number.isInteger(mediaAssetBId), "media asset B did not return an id.");
  pushCleanup(async () => {
    await apiRequest(`/media/${mediaAssetBId}`, { method: "DELETE", token });
  });

  const standaloneMedia = await uploadMediaAsset(token, "a", `${smokeKey}-standalone-media`);
  const standaloneMediaId = Number(standaloneMedia.id);
  assert(Number.isInteger(standaloneMediaId), "standalone media asset did not return an id.");
  pushCleanup(async () => {
    await apiRequest(`/media/${standaloneMediaId}`, { method: "DELETE", token });
  });

  const updateStandaloneMedia = await apiRequest(`/media/${standaloneMediaId}`, {
    body: {
      alt_text: `${smokeKey} updated alt`,
      title: `${smokeKey} updated title`,
    },
    method: "PUT",
    token,
  });
  expectStatus(updateStandaloneMedia, 200, "update media metadata");

  const deleteStandaloneMedia = await apiRequest(`/media/${standaloneMediaId}`, {
    method: "DELETE",
    token,
  });
  expectStatus(deleteStandaloneMedia, 200, "delete standalone media");

  const standaloneMediaLookup = await apiRequest(`/media/${standaloneMediaId}`, {
    token,
  });
  expectStatus(standaloneMediaLookup, 404, "deleted standalone media lookup");

  const createdProduct = await apiRequest("/products", {
    body: {
      cta_label: "Request quote",
      cta_url: "https://example.com/quote",
      description: "Smoke test product.",
      feature_list: ["Alpha", "Beta"],
      featured_asset_id: mediaAssetAId,
      is_published: false,
      name: `${smokeKey} product`,
      slug: `${smokeKey}-product`,
    },
    method: "POST",
    token,
  });
  expectStatus(createdProduct, 201, "create product");
  const productPayload = getJsonObject(createdProduct, "create product");
  const productId = Number(productPayload.id);
  assert(Number.isInteger(productId), "product did not return an id.");
  pushCleanup(async () => {
    await apiRequest(`/products/${productId}`, { method: "DELETE", token });
  });

  const publicProductsHidden = await apiRequest("/products");
  expectStatus(publicProductsHidden, 200, "list public products while hidden");
  assert(
    !getJsonArray(publicProductsHidden, "list public products while hidden").some(
      (item) => Number(item.id) === productId,
    ),
    "unpublished product should not appear in the public products feed.",
  );

  const updatedProduct = await apiRequest(`/products/${productId}`, {
    body: {
      featured_asset_id: mediaAssetBId,
      is_published: true,
      name: `${smokeKey} product updated`,
    },
    method: "PUT",
    token,
  });
  expectStatus(updatedProduct, 200, "update product");

  const mediaAssetALookup = await apiRequest(`/media/${mediaAssetAId}`, { token });
  expectStatus(mediaAssetALookup, 404, "old product media cleanup");

  const publicProductsVisible = await apiRequest("/products");
  expectStatus(publicProductsVisible, 200, "list public products while published");
  assert(
    getJsonArray(publicProductsVisible, "list public products while published").some(
      (item) => Number(item.id) === productId,
    ),
    "published product should appear in the public products feed.",
  );

  const deleteProduct = await apiRequest(`/products/${productId}`, {
    method: "DELETE",
    token,
  });
  expectStatus(deleteProduct, 200, "delete product");

  const mediaAssetBLookup = await apiRequest(`/media/${mediaAssetBId}`, { token });
  expectStatus(mediaAssetBLookup, 404, "product delete media cleanup");

  const createdService = await apiRequest("/services", {
    body: {
      cta_label: "Talk to us",
      description: "Smoke test service.",
      highlight_list: ["Audit", "Setup"],
      icon_name: "headset",
      is_published: false,
      name: `${smokeKey} service`,
      slug: `${smokeKey}-service`,
    },
    method: "POST",
    token,
  });
  expectStatus(createdService, 201, "create service");
  const servicePayload = getJsonObject(createdService, "create service");
  const serviceId = Number(servicePayload.id);
  assert(Number.isInteger(serviceId), "service did not return an id.");
  pushCleanup(async () => {
    await apiRequest(`/services/${serviceId}`, { method: "DELETE", token });
  });

  const updatedService = await apiRequest(`/services/${serviceId}`, {
    body: {
      description: "Smoke test service updated.",
      is_published: true,
      name: `${smokeKey} service updated`,
    },
    method: "PUT",
    token,
  });
  expectStatus(updatedService, 200, "update service");

  const deleteService = await apiRequest(`/services/${serviceId}`, {
    method: "DELETE",
    token,
  });
  expectStatus(deleteService, 200, "delete service");

  const createdTestimonial = await apiRequest("/testimonials", {
    body: {
      author: "Smoke Client",
      author_role: "Operator",
      is_featured: true,
      is_published: false,
      location: "Port Harcourt",
      quote: "Smoke test testimonial.",
      rating: 5,
    },
    method: "POST",
    token,
  });
  expectStatus(createdTestimonial, 201, "create testimonial");
  const testimonialPayload = getJsonObject(createdTestimonial, "create testimonial");
  const testimonialId = Number(testimonialPayload.id);
  assert(Number.isInteger(testimonialId), "testimonial did not return an id.");
  pushCleanup(async () => {
    await apiRequest(`/testimonials/${testimonialId}`, {
      method: "DELETE",
      token,
    });
  });

  const hiddenTestimonials = await apiRequest("/testimonials");
  expectStatus(hiddenTestimonials, 200, "list testimonials while hidden");
  assert(
    !getJsonArray(hiddenTestimonials, "list testimonials while hidden").some(
      (item) => Number(item.id) === testimonialId,
    ),
    "unpublished testimonial should not appear in the public testimonial feed.",
  );

  const updatedTestimonial = await apiRequest(`/testimonials/${testimonialId}`, {
    body: {
      is_published: true,
      quote: "Smoke test testimonial updated.",
    },
    method: "PUT",
    token,
  });
  expectStatus(updatedTestimonial, 200, "update testimonial");

  const visibleTestimonials = await apiRequest("/testimonials");
  expectStatus(visibleTestimonials, 200, "list testimonials while published");
  assert(
    getJsonArray(visibleTestimonials, "list testimonials while published").some(
      (item) => Number(item.id) === testimonialId,
    ),
    "published testimonial should appear in the public testimonial feed.",
  );

  const deleteTestimonial = await apiRequest(`/testimonials/${testimonialId}`, {
    method: "DELETE",
    token,
  });
  expectStatus(deleteTestimonial, 200, "delete testimonial");

  const createdContentSection = await apiRequest("/content", {
    body: {
      content: "Smoke content body.",
      section_name: `${smokeKey}_content`,
    },
    method: "POST",
    token,
  });
  expectStatus(createdContentSection, 201, "create content section");
  const contentPayload = getJsonObject(createdContentSection, "create content section");
  const contentSectionId = Number(contentPayload.id);
  assert(Number.isInteger(contentSectionId), "content section did not return an id.");
  pushCleanup(async () => {
    await apiRequest(`/content/${contentSectionId}`, { method: "DELETE", token });
  });

  const updatedContentSection = await apiRequest(`/content/${contentSectionId}`, {
    body: {
      content: "Smoke content body updated.",
      section_name: `${smokeKey}_content_updated`,
    },
    method: "PUT",
    token,
  });
  expectStatus(updatedContentSection, 200, "update content section");

  const deleteContentSection = await apiRequest(`/content/${contentSectionId}`, {
    method: "DELETE",
    token,
  });
  expectStatus(deleteContentSection, 200, "delete content section");

  const createdPageSection = await apiRequest("/page-sections", {
    body: {
      body: "Smoke page section body.",
      content: [{ title: "Proof", value: "Yes" }],
      is_published: false,
      page_type: "HOME",
      section_key: `${smokeKey}-section`,
      title: `${smokeKey} section`,
    },
    method: "POST",
    token,
  });
  expectStatus(createdPageSection, 201, "create page section");
  const pageSectionPayload = getJsonObject(createdPageSection, "create page section");
  const pageSectionId = Number(pageSectionPayload.id);
  assert(Number.isInteger(pageSectionId), "page section did not return an id.");
  pushCleanup(async () => {
    await apiRequest(`/page-sections/${pageSectionId}`, {
      method: "DELETE",
      token,
    });
  });

  const publicHomeSectionsHidden = await apiRequest("/page-sections/page/HOME");
  expectStatus(publicHomeSectionsHidden, 200, "list public home page sections");
  assert(
    !getJsonArray(publicHomeSectionsHidden, "list public home page sections").some(
      (item) => Number(item.id) === pageSectionId,
    ),
    "unpublished page section should not appear in the public page-section feed.",
  );

  const updatedPageSection = await apiRequest(`/page-sections/${pageSectionId}`, {
    body: {
      is_published: true,
      title: `${smokeKey} section updated`,
    },
    method: "PUT",
    token,
  });
  expectStatus(updatedPageSection, 200, "update page section");

  const publicHomeSectionsVisible = await apiRequest("/page-sections/page/HOME");
  expectStatus(publicHomeSectionsVisible, 200, "list visible home page sections");
  assert(
    getJsonArray(publicHomeSectionsVisible, "list visible home page sections").some(
      (item) => Number(item.id) === pageSectionId,
    ),
    "published page section should appear in the public page-section feed.",
  );

  const deletePageSection = await apiRequest(`/page-sections/${pageSectionId}`, {
    method: "DELETE",
    token,
  });
  expectStatus(deletePageSection, 200, "delete page section");

  const createdProjectForm = new FormData();
  createdProjectForm.append("title", `${smokeKey} project`);
  createdProjectForm.append("description", "Smoke upload project.");
  createdProjectForm.append("is_published", "false");
  createdProjectForm.append("image", createPngBlob("a"), `${smokeKey}-project-a.png`);
  createdProjectForm.append("image_alt_text", `${smokeKey} project image a`);

  const createdProject = await apiRequest("/projects", {
    body: createdProjectForm,
    method: "POST",
    token,
  });
  expectStatus(createdProject, 201, "create project with upload");
  const projectPayload = getJsonObject(createdProject, "create project with upload");
  const projectId = Number(projectPayload.id);
  const initialProjectAssetId = Number(projectPayload.image_asset_id);
  assert(Number.isInteger(projectId), "project did not return an id.");
  assert(Number.isInteger(initialProjectAssetId), "project upload did not create an image asset.");
  pushCleanup(async () => {
    await apiRequest(`/projects/${projectId}`, { method: "DELETE", token });
  });

  const updateProjectForm = new FormData();
  updateProjectForm.append("title", `${smokeKey} project updated`);
  updateProjectForm.append("is_published", "true");
  updateProjectForm.append("image", createPngBlob("b"), `${smokeKey}-project-b.png`);
  updateProjectForm.append("image_alt_text", `${smokeKey} project image b`);

  const updatedProject = await apiRequest(`/projects/${projectId}`, {
    body: updateProjectForm,
    method: "PUT",
    token,
  });
  expectStatus(updatedProject, 200, "update project with replacement upload");
  const updatedProjectPayload = getJsonObject(
    updatedProject,
    "update project with replacement upload",
  );
  const replacementProjectAssetId = Number(updatedProjectPayload.image_asset_id);
  assert(
    Number.isInteger(replacementProjectAssetId) &&
      replacementProjectAssetId !== initialProjectAssetId,
    "project replacement upload did not change the image asset id.",
  );

  const initialProjectAssetLookup = await apiRequest(`/media/${initialProjectAssetId}`, { token });
  expectStatus(initialProjectAssetLookup, 404, "old project asset cleanup");

  const publicProjects = await apiRequest("/projects");
  expectStatus(publicProjects, 200, "list public projects after publish");
  assert(
    getJsonArray(publicProjects, "list public projects after publish").some(
      (item) => Number(item.id) === projectId,
    ),
    "published project should appear in the public projects feed.",
  );

  const deleteProject = await apiRequest(`/projects/${projectId}`, {
    method: "DELETE",
    token,
  });
  expectStatus(deleteProject, 200, "delete project");

  const replacementProjectAssetLookup = await apiRequest(`/media/${replacementProjectAssetId}`, {
    token,
  });
  expectStatus(replacementProjectAssetLookup, 404, "project delete asset cleanup");

  logStep("Smoke suite completed successfully.");
}

main()
  .catch(async (error) => {
    console.error(`[smoke] Failed: ${error instanceof Error ? error.message : String(error)}`);
    await runCleanup();
    process.exitCode = 1;
  })
  .finally(async () => {
    await runCleanup();
  });
