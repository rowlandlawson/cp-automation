import "dotenv/config";

import { prisma } from "../config/prisma";
import { parseSeedScopes, runSeedScopes } from "./seeds";

async function main(): Promise<void> {
  const client = prisma;

  if (!client) {
    throw new Error("Prisma client is not configured. Add DATABASE_URL before running the seed.");
  }

  const requestedScopes = parseSeedScopes(process.argv.slice(2));
  const { executedScopes, summary } = await runSeedScopes(client, requestedScopes);

  console.log(
    JSON.stringify(
      {
        executed_scopes: executedScopes,
        seeded: summary,
        status: "ok",
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error("Prisma seed failed.");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma?.$disconnect();
  });
