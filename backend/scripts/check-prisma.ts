import { testPrismaConnection } from "../config/database";
import { prisma } from "../config/prisma";

try {
  const result = await testPrismaConnection();

  console.log(JSON.stringify(result, null, 2));

  if (result.state === "unavailable") {
    process.exitCode = 1;
  }
} finally {
  await prisma?.$disconnect();
}
