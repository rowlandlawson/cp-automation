import { Router } from "express";

import { getHealth } from "../controllers/health.controller";
import { aboutPageRouter } from "./about-page";
import { authRouter } from "./auth";
import { contentRouter } from "./content";
import { homePageRouter } from "./home-page";
import { mediaRouter } from "./media";
import { pageSectionsRouter } from "./page-sections";
import { productsRouter } from "./products";
import { projectsRouter } from "./projects";
import { servicesRouter } from "./services";
import { siteSettingsRouter } from "./site-settings";
import { testimonialsRouter } from "./testimonials";

const apiRouter = Router();

apiRouter.get("/health", getHealth);
apiRouter.use("/auth", authRouter);
apiRouter.use("/projects", projectsRouter);
apiRouter.use("/products", productsRouter);
apiRouter.use("/services", servicesRouter);
apiRouter.use("/testimonials", testimonialsRouter);
apiRouter.use("/content", contentRouter);
apiRouter.use("/page-sections", pageSectionsRouter);
apiRouter.use("/site-settings", siteSettingsRouter);
apiRouter.use("/home-page", homePageRouter);
apiRouter.use("/about-page", aboutPageRouter);
apiRouter.use("/media", mediaRouter);

export { apiRouter };
