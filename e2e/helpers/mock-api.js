const API_ROOT = "http://localhost:5000/api";

function jsonResponse(body, options = {}) {
  return {
    status: options.status || 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(options.headers || {}),
    },
    body: JSON.stringify(body),
  };
}

function parseJsonBody(request) {
  const payload = request.postData();
  if (!payload) {
    return null;
  }

  try {
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

async function mockApi(page, handlers) {
  await page.route(`${API_ROOT}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/api/, "") || "/";
    const method = request.method().toUpperCase();
    const handler =
      handlers[`${method} ${path}`] || handlers[`ALL ${path}`] || handlers[path] || null;

    if (!handler) {
      await route.fulfill(
        jsonResponse(
          {
            error: `Unhandled API route: ${method} ${path}`,
          },
          { status: 501 },
        ),
      );
      return;
    }

    const result =
      typeof handler === "function"
        ? await handler({
            body: parseJsonBody(request),
            method,
            path,
            request,
            route,
            url,
          })
        : handler;

    if (!result) {
      await route.fulfill(jsonResponse({}, { status: 204 }));
      return;
    }

    if (result.body !== undefined && result.headers) {
      await route.fulfill(result);
      return;
    }

    await route.fulfill(jsonResponse(result));
  });
}

function pageSectionList(sectionBucket) {
  return Object.values(sectionBucket || {});
}

function createPublicApiHandlers(content) {
  return {
    "GET /about-page": () => jsonResponse(content.aboutPage),
    "GET /home-page": jsonResponse(content.homePage),
    "GET /page-sections/page/ABOUT": jsonResponse(pageSectionList(content.pageSections.about)),
    "GET /page-sections/page/GLOBAL": jsonResponse(pageSectionList(content.pageSections.global)),
    "GET /page-sections/page/HOME": jsonResponse(pageSectionList(content.pageSections.home)),
    "GET /products": jsonResponse(content.products),
    "GET /projects": jsonResponse(content.projects),
    "GET /services": jsonResponse(content.services),
    "GET /site-settings": jsonResponse(content.siteSettings),
    "GET /testimonials": jsonResponse(content.testimonials),
  };
}

function createAdminOverviewHandlers(data) {
  return {
    "GET /about-page": jsonResponse(data.aboutPage),
    "GET /content": jsonResponse(data.contentSections),
    "GET /home-page": jsonResponse(data.homePage),
    "GET /products/admin/all": jsonResponse(data.products),
    "GET /projects/admin/all": jsonResponse(data.projects),
    "GET /services/admin/all": jsonResponse(data.services),
    "GET /site-settings": jsonResponse(data.siteSettings),
    "GET /testimonials/admin/all": jsonResponse(data.testimonials),
  };
}

module.exports = {
  API_ROOT,
  createAdminOverviewHandlers,
  createPublicApiHandlers,
  jsonResponse,
  mockApi,
};
