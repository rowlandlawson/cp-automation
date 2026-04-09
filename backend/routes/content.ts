import { Router } from "express";

import { asyncHandler } from "../middleware/async-handler";
import { auth } from "../middleware/auth";
import { HttpError } from "../utils/http-error";
import { requirePrisma } from "../utils/prisma-request";
import { serializeContentSection } from "../utils/prisma-serializers";
import { nullableString, parseIdParam, readRouteParam, requireString } from "../utils/request";

const contentRouter = Router();

contentRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const prisma = requirePrisma();
    const sections = await prisma.contentSection.findMany({
      orderBy: [{ sectionName: "asc" }],
    });
    res.json(sections.map(serializeContentSection));
  }),
);

contentRouter.get(
  "/section/:sectionName",
  asyncHandler(async (req, res) => {
    const prisma = requirePrisma();
    const section = await prisma.contentSection.findUnique({
      where: {
        sectionName: readRouteParam(req.params.sectionName, "section name"),
      },
    });

    if (!section) {
      throw new HttpError(404, "Content section not found.");
    }

    res.json(serializeContentSection(section));
  }),
);

contentRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const prisma = requirePrisma();
    const sectionId = parseIdParam(req.params.id, "content section id");
    const section = await prisma.contentSection.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      throw new HttpError(404, "Content section not found.");
    }

    res.json(serializeContentSection(section));
  }),
);

contentRouter.post(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const prisma = requirePrisma();
    const section = await prisma.contentSection.create({
      data: {
        sectionName: requireString(req.body.section_name, "section_name"),
        content: nullableString(req.body.content, "content") ?? null,
        updatedBy: req.userId ?? null,
      },
    });

    res.status(201).json(serializeContentSection(section));
  }),
);

contentRouter.put(
  "/:id",
  auth,
  asyncHandler(async (req, res) => {
    const prisma = requirePrisma();
    const sectionId = parseIdParam(req.params.id, "content section id");
    const existingSection = await prisma.contentSection.findUnique({
      where: { id: sectionId },
    });

    if (!existingSection) {
      throw new HttpError(404, "Content section not found.");
    }

    const updatedSection = await prisma.contentSection.update({
      where: { id: sectionId },
      data: {
        sectionName:
          req.body.section_name !== undefined
            ? requireString(req.body.section_name, "section_name")
            : undefined,
        content: nullableString(req.body.content, "content"),
        updatedBy: req.userId ?? null,
      },
    });

    res.json(serializeContentSection(updatedSection));
  }),
);

contentRouter.delete(
  "/:id",
  auth,
  asyncHandler(async (req, res) => {
    const prisma = requirePrisma();
    const sectionId = parseIdParam(req.params.id, "content section id");
    const section = await prisma.contentSection.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      throw new HttpError(404, "Content section not found.");
    }

    await prisma.contentSection.delete({
      where: { id: sectionId },
    });

    res.json({
      message: "Content section deleted.",
    });
  }),
);

export { contentRouter };
