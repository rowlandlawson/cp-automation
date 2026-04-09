import { Router } from "express";

import { asyncHandler } from "../middleware/async-handler";
import { auth } from "../middleware/auth";
import { HttpError } from "../utils/http-error";
import { requirePrisma } from "../utils/prisma-request";
import { serializeTestimonial } from "../utils/prisma-serializers";
import {
  nullableString,
  optionalBoolean,
  optionalInteger,
  parseIdParam,
  requireString,
} from "../utils/request";

function parseRating(value: unknown): number | undefined {
  const rating = optionalInteger(value, "rating");

  if (rating !== undefined && (rating < 1 || rating > 5)) {
    throw new HttpError(400, "rating must be between 1 and 5.");
  }

  return rating;
}

const testimonialsRouter = Router();

testimonialsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const prisma = requirePrisma();
    const testimonials = await prisma.testimonial.findMany({
      where: { isPublished: true },
      orderBy: [{ orderIndex: "asc" }, { createdAt: "desc" }],
    });
    res.json(testimonials.map(serializeTestimonial));
  }),
);

testimonialsRouter.get(
  "/admin/all",
  auth,
  asyncHandler(async (_req, res) => {
    const prisma = requirePrisma();
    const testimonials = await prisma.testimonial.findMany({
      orderBy: [{ orderIndex: "asc" }, { createdAt: "desc" }],
    });
    res.json(testimonials.map(serializeTestimonial));
  }),
);

testimonialsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const prisma = requirePrisma();
    const testimonialId = parseIdParam(req.params.id, "testimonial id");
    const testimonial = await prisma.testimonial.findUnique({
      where: { id: testimonialId },
    });

    if (!testimonial) {
      throw new HttpError(404, "Testimonial not found.");
    }

    res.json(serializeTestimonial(testimonial));
  }),
);

testimonialsRouter.post(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const prisma = requirePrisma();
    const testimonial = await prisma.testimonial.create({
      data: {
        quote: requireString(req.body.quote, "quote"),
        author: nullableString(req.body.author, "author") ?? null,
        authorRole: nullableString(req.body.author_role, "author_role") ?? null,
        companyName: nullableString(req.body.company_name, "company_name") ?? null,
        location: nullableString(req.body.location, "location") ?? null,
        rating: parseRating(req.body.rating) ?? 5,
        sourceUrl: nullableString(req.body.source_url, "source_url") ?? null,
        isFeatured: optionalBoolean(req.body.is_featured, "is_featured") ?? true,
        orderIndex: optionalInteger(req.body.order_index, "order_index") ?? 0,
        isPublished: optionalBoolean(req.body.is_published, "is_published") ?? true,
      },
    });

    res.status(201).json(serializeTestimonial(testimonial));
  }),
);

testimonialsRouter.put(
  "/:id",
  auth,
  asyncHandler(async (req, res) => {
    const prisma = requirePrisma();
    const testimonialId = parseIdParam(req.params.id, "testimonial id");
    const existingTestimonial = await prisma.testimonial.findUnique({
      where: { id: testimonialId },
    });

    if (!existingTestimonial) {
      throw new HttpError(404, "Testimonial not found.");
    }

    const updatedTestimonial = await prisma.testimonial.update({
      where: { id: testimonialId },
      data: {
        quote: req.body.quote !== undefined ? requireString(req.body.quote, "quote") : undefined,
        author: nullableString(req.body.author, "author"),
        authorRole: nullableString(req.body.author_role, "author_role"),
        companyName: nullableString(req.body.company_name, "company_name"),
        location: nullableString(req.body.location, "location"),
        rating: parseRating(req.body.rating),
        sourceUrl: nullableString(req.body.source_url, "source_url"),
        isFeatured: optionalBoolean(req.body.is_featured, "is_featured"),
        orderIndex: optionalInteger(req.body.order_index, "order_index"),
        isPublished: optionalBoolean(req.body.is_published, "is_published"),
      },
    });

    res.json(serializeTestimonial(updatedTestimonial));
  }),
);

testimonialsRouter.delete(
  "/:id",
  auth,
  asyncHandler(async (req, res) => {
    const prisma = requirePrisma();
    const testimonialId = parseIdParam(req.params.id, "testimonial id");
    const testimonial = await prisma.testimonial.findUnique({
      where: { id: testimonialId },
    });

    if (!testimonial) {
      throw new HttpError(404, "Testimonial not found.");
    }

    await prisma.testimonial.delete({
      where: { id: testimonialId },
    });

    res.json({
      message: "Testimonial deleted.",
    });
  }),
);

export { testimonialsRouter };
