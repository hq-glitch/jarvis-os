import { prisma } from "@/lib/db";

export async function getSettings(userId: string) {
  return prisma.userSetting.findMany({
    where: {
      userId,
    },
    orderBy: {
      key: "asc",
    },
  });
}

export async function getSetting(userId: string, key: string) {
  return prisma.userSetting.findUnique({
    where: {
      userId_key: {
        userId,
        key,
      },
    },
  });
}

export async function setSetting(
  userId: string,
  key: string,
  value: string
) {
  return prisma.userSetting.upsert({
    where: {
      userId_key: {
        userId,
        key,
      },
    },
    update: {
      value,
    },
    create: {
      userId,
      key,
      value,
    },
  });
}