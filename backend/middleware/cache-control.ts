import path from "node:path";

import type { Request, Response, NextFunction } from "express";
import type { ServeStaticOptions } from "serve-static";

const PUBLIC_API_CACHE_HEADER = "public, max-age=120, stale-while-revalidate=600";
const PRIVATE_API_CACHE_HEADER = "private, no-store";
const STATIC_IMAGE_CACHE_HEADER = "public, max-age=604800, stale-while-revalidate=2592000";
const STATIC_ASSET_CACHE_HEADER = "public, max-age=3600, stale-while-revalidate=86400";

function isPublicApiPath(pathname: string): boolean {
  return (
    /^\/api\/(about-page|home-page|products|projects|services|site-settings|testimonials)(\/|$)/.test(
      pathname,
    ) || /^\/api\/page-sections\/page\//.test(pathname)
  );
}

export function apiCacheControl(req: Request, res: Response, next: NextFunction): void {
  const fullPath = `${req.baseUrl || ""}${req.path}`;

  if (!["GET", "HEAD"].includes(req.method)) {
    res.setHeader("Cache-Control", PRIVATE_API_CACHE_HEADER);
    next();
    return;
  }

  if (
    req.headers.authorization ||
    /^\/api\/auth(\/|$)/.test(fullPath) ||
    /\/admin\//.test(fullPath) ||
    fullPath === "/api/health"
  ) {
    res.setHeader("Cache-Control", PRIVATE_API_CACHE_HEADER);
    next();
    return;
  }

  if (isPublicApiPath(fullPath)) {
    res.setHeader("Cache-Control", PUBLIC_API_CACHE_HEADER);
  } else {
    res.setHeader("Cache-Control", PRIVATE_API_CACHE_HEADER);
  }

  next();
}

export const uploadsStaticOptions: ServeStaticOptions = {
  etag: true,
  fallthrough: true,
  setHeaders(res, filePath) {
    const extension = path.extname(filePath).toLowerCase();
    const cacheHeader = [".avif", ".gif", ".jpeg", ".jpg", ".png", ".svg", ".webp"].includes(
      extension,
    )
      ? STATIC_IMAGE_CACHE_HEADER
      : STATIC_ASSET_CACHE_HEADER;

    res.setHeader("Cache-Control", cacheHeader);
    res.setHeader("X-Content-Type-Options", "nosniff");
  },
};
