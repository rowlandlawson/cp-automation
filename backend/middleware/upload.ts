import multer from "multer";
import sharp from "sharp";
import type { RequestHandler } from "express";

import { uploadImageBuffer } from "../config/cloudinary";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

export function createImageUploadMiddleware(options: {
  fieldName: string;
  folder: string;
  width?: number;
}): RequestHandler[] {
  return [
    upload.single(options.fieldName),
    async (req, _res, next) => {
      try {
        if (!req.file) {
          next();
          return;
        }

        const optimizedBuffer = await sharp(req.file.buffer)
          .rotate()
          .resize({
            width: options.width ?? 1800,
            withoutEnlargement: true,
          })
          .webp({
            quality: 82,
          })
          .toBuffer();

        const uploadedImage = await uploadImageBuffer({
          buffer: optimizedBuffer,
          folder: options.folder,
        });

        req.uploadedImage = uploadedImage;
        next();
      } catch (error) {
        next(error);
      }
    },
  ];
}

export const uploadProjectImage = createImageUploadMiddleware({
  fieldName: "image",
  folder: "cp-automation/projects",
});

export const uploadAboutPortrait = createImageUploadMiddleware({
  fieldName: "portrait",
  folder: "cp-automation/about",
  width: 1400,
});

export const uploadMediaImage = createImageUploadMiddleware({
  fieldName: "image",
  folder: "cp-automation/media",
});
