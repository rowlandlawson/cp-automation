import type { PrismaClient, User } from "../../generated/prisma/client";
import { getAdminSeedConfig, hashPassword } from "./helpers";

export async function seedAdminUser(prisma: PrismaClient): Promise<User> {
  const adminConfig = getAdminSeedConfig();
  const passwordHash = await hashPassword(adminConfig.password);
  const passwordChangedAt = new Date();

  const existingByEmail = await prisma.user.findUnique({
    where: { email: adminConfig.email },
  });

  if (existingByEmail) {
    return prisma.user.update({
      where: { email: adminConfig.email },
      data: {
        isActive: true,
        passwordChangedAt,
        passwordHash,
        role: adminConfig.role,
        username: adminConfig.username,
      },
    });
  }

  const existingByUsername = await prisma.user.findUnique({
    where: { username: adminConfig.username },
  });

  if (existingByUsername) {
    return prisma.user.update({
      where: { username: adminConfig.username },
      data: {
        email: adminConfig.email,
        isActive: true,
        passwordChangedAt,
        passwordHash,
        role: adminConfig.role,
      },
    });
  }

  return prisma.user.create({
    data: {
      email: adminConfig.email,
      isActive: true,
      passwordChangedAt,
      passwordHash,
      role: adminConfig.role,
      username: adminConfig.username,
    },
  });
}
