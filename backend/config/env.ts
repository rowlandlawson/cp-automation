import dotenv from "dotenv";

dotenv.config({ quiet: true });

type RuntimeEnv = {
  ADMIN_APP_URL: string;
  BREVO_API_KEY: string;
  BREVO_REPLY_TO_EMAIL: string;
  BREVO_REPLY_TO_NAME: string;
  BREVO_SENDER_EMAIL: string;
  BREVO_SENDER_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  CLOUDINARY_NAME: string;
  CORS_ORIGIN: string;
  CORS_ORIGINS: string[];
  DATABASE_URL: string;
  JWT_SECRET: string;
  NODE_ENV: string;
  PASSWORD_RESET_TOKEN_TTL_MINUTES: number;
  PASSWORD_RESET_WEBHOOK_URL: string;
  PORT: number;
};

const missingEnvironmentVariables = [
  "DATABASE_URL",
  "JWT_SECRET",
  "CLOUDINARY_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
].filter((key) => !process.env[key]);

if (missingEnvironmentVariables.length > 0) {
  console.warn(`[env] Missing environment variables: ${missingEnvironmentVariables.join(", ")}`);
}

const corsOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const env: RuntimeEnv = {
  ADMIN_APP_URL: process.env.ADMIN_APP_URL ?? "http://localhost:3000/admin",
  BREVO_API_KEY: process.env.BREVO_API_KEY?.trim() ?? "",
  BREVO_REPLY_TO_EMAIL: process.env.BREVO_REPLY_TO_EMAIL?.trim() ?? "",
  BREVO_REPLY_TO_NAME: process.env.BREVO_REPLY_TO_NAME?.trim() ?? "",
  BREVO_SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL?.trim() ?? "",
  BREVO_SENDER_NAME: process.env.BREVO_SENDER_NAME?.trim() ?? "CP Automation",
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  PORT: Number(process.env.PORT ?? 5000),
  CORS_ORIGIN: corsOrigins[0] ?? "http://localhost:3000",
  CORS_ORIGINS: corsOrigins,
  JWT_SECRET: process.env.JWT_SECRET ?? "",
  CLOUDINARY_NAME: process.env.CLOUDINARY_NAME ?? "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ?? "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ?? "",
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PASSWORD_RESET_TOKEN_TTL_MINUTES: Number(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES ?? 30),
  PASSWORD_RESET_WEBHOOK_URL: process.env.PASSWORD_RESET_WEBHOOK_URL ?? "",
};
