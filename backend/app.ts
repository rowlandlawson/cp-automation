import cors from "cors";
import express from "express";

import { env } from "./config/env";
import { apiCacheControl, uploadsStaticOptions } from "./middleware/cache-control";
import { errorHandler } from "./middleware/error-handler";
import { notFoundHandler } from "./middleware/not-found";
import { requestContext } from "./middleware/request-context";
import { requestLogger } from "./middleware/request-logger";
import { apiRouter } from "./routes";

const localOriginPattern = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          callback(null, true);
          return;
        }

        if (env.CORS_ORIGINS.includes(origin)) {
          callback(null, true);
          return;
        }

        if (
          env.NODE_ENV === "development" &&
          (localOriginPattern.test(origin) || origin === "null")
        ) {
          callback(null, true);
          return;
        }

        callback(new Error(`Origin ${origin} is not allowed by CORS.`));
      },
      credentials: true,
    }),
  );
  app.use(requestContext);
  app.use(requestLogger);
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use("/uploads", express.static("uploads", uploadsStaticOptions));

  app.get("/", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json({
      message: "CP Automation API is running.",
      environment: env.NODE_ENV,
    });
  });

  app.use("/api", apiCacheControl);
  app.use("/api", apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
