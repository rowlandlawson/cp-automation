import "dotenv/config";

import { testDatabaseConnections } from "../config/database";
import { prisma } from "../config/prisma";
import { SEED_SCOPE_ORDER, runSeedScopes, type SeedScope } from "../prisma/seeds";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function summarizeNonZeroCounts(summary: {
  aboutPage: number;
  adminUser: { email: string; id: number; username: string } | null;
  contentSections: number;
  homePage: number;
  mediaAssets: number;
  pageSections: number;
  products: number;
  projects: number;
  services: number;
  siteSettings: number;
  testimonials: number;
}) {
  return Object.fromEntries(
    Object.entries(summary).filter(([, value]) => {
      if (value === null) {
        return false;
      }

      if (typeof value === "number") {
        return value > 0;
      }

      return true;
    }),
  );
}

async function verifyScope(scope: SeedScope) {
  assert(prisma, "Prisma client is not configured.");

  const { executedScopes, summary } = await runSeedScopes(prisma, [scope]);

  assert(executedScopes.includes(scope), `Seed scope "${scope}" did not execute as requested.`);

  return {
    executed_scopes: executedScopes,
    requested_scope: scope,
    seeded: summarizeNonZeroCounts(summary),
  };
}

async function main(): Promise<void> {
  assert(prisma, "Prisma client is not configured.");

  const database = await testDatabaseConnections();
  if (database.pg.state !== "connected" || database.prisma.state !== "connected") {
    throw new Error(
      `Database is not ready. pg=${database.pg.state} prisma=${database.prisma.state}`,
    );
  }

  const results = [];
  for (const scope of SEED_SCOPE_ORDER) {
    results.push(await verifyScope(scope));
  }

  console.log(
    JSON.stringify(
      {
        database,
        status: "ok",
        verified_scopes: results,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(`[verify:seed:scopes] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma?.$disconnect();
  });
