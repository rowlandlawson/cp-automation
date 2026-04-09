import bcryptjs from "bcryptjs";

import { requirePrisma } from "../utils/prisma-request";
import { assertPasswordPolicy } from "../utils/password-policy";

function printUsageAndExit(): never {
  console.error("Usage: bun run admin:create -- <username> <email> <password> [role]");
  process.exit(1);
}

async function main(): Promise<void> {
  const [, , username, email, password, roleArg] = process.argv;
  const prisma = requirePrisma();

  if (!username || !email || !password) {
    printUsageAndExit();
  }

  const existingUsername = await prisma.user.findUnique({
    where: { username },
  });
  if (existingUsername) {
    throw new Error(`User with username "${username}" already exists.`);
  }

  const existingEmail = await prisma.user.findUnique({
    where: { email },
  });
  if (existingEmail) {
    throw new Error(`User with email "${email}" already exists.`);
  }

  assertPasswordPolicy(password);

  const passwordHash = await bcryptjs.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      passwordChangedAt: new Date(),
      role: roleArg || "admin",
      isActive: true,
      username,
    },
  });

  console.log("Admin user created successfully.");
  console.log(
    JSON.stringify(
      {
        email: user.email,
        id: user.id,
        role: user.role,
        username: user.username,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("Failed to create admin user.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
