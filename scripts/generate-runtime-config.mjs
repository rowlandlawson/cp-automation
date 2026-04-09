import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

function normalizeUrl(value) {
  return String(value || "")
    .trim()
    .replace(/\/$/, "");
}

async function main() {
  const cpApiBaseUrl = normalizeUrl(process.env.CP_API_BASE_URL);
  const adminApiBaseUrl = normalizeUrl(process.env.ADMIN_API_BASE_URL || cpApiBaseUrl);
  const appEnv = String(process.env.CP_APP_ENV || process.env.VERCEL_ENV || "development").trim();

  const output = `window.__CP_API_BASE_URL = ${JSON.stringify(cpApiBaseUrl)};
window.__ADMIN_API_BASE_URL = ${JSON.stringify(adminApiBaseUrl)};
window.__CP_APP_ENV = ${JSON.stringify(appEnv)};
`;

  const outputPath = resolve(process.cwd(), "runtime-config.js");
  await writeFile(outputPath, output, "utf8");

  console.log(
    `[build] runtime-config.js written with CP API base "${cpApiBaseUrl || "(auto)"}" and admin API base "${adminApiBaseUrl || "(auto)"}".`,
  );
}

main().catch((error) => {
  console.error(
    `[build] Failed to write runtime-config.js: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
