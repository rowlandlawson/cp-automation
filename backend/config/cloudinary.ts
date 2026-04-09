import { v2 as cloudinary } from "cloudinary";

import { env } from "./env";
import { HttpError } from "../utils/http-error";

export type UploadedImageResult = {
  bytes?: number;
  format?: string;
  height?: number;
  publicId: string;
  secureUrl: string;
  width?: number;
};

if (env.CLOUDINARY_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(env.CLOUDINARY_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
}

export async function uploadImageBuffer(options: {
  buffer: Buffer;
  folder: string;
  publicId?: string;
}): Promise<UploadedImageResult> {
  if (!isCloudinaryConfigured()) {
    throw new HttpError(500, "Cloudinary is not configured.");
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        public_id: options.publicId,
        overwrite: Boolean(options.publicId),
        quality: "auto",
        fetch_format: "auto",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result) {
          reject(new HttpError(500, "Cloudinary upload did not return a result."));
          return;
        }

        resolve({
          publicId: result.public_id,
          secureUrl: result.secure_url,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      },
    );

    stream.end(options.buffer);
  });
}

export async function deleteImageFromCloudinary(publicId: string): Promise<void> {
  if (!publicId || !isCloudinaryConfigured()) {
    return;
  }

  await cloudinary.uploader.destroy(publicId, {
    invalidate: true,
    resource_type: "image",
  });
}

export { cloudinary };
