import { prisma } from "@/lib/db";

export async function getDefaultUser() {
  return prisma.user.findFirst({
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function createDefaultUser() {
  return prisma.user.create({
    data: {
      displayName: "Jarvis User",
    },
  });
}

export async function getOrCreateDefaultUser() {
  const existingUser = await getDefaultUser();

  if (existingUser) {
    return existingUser;
  }

  return createDefaultUser();
}