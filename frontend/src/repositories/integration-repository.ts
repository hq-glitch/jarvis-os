import { prisma } from "@/lib/db";

export async function getIntegrations(userId: string) {
  return prisma.integration.findMany({
    where: {
      userId,
    },
    include: {
      calendars: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function getIntegration(id: string) {
  return prisma.integration.findUnique({
    where: {
      id,
    },
    include: {
      credential: true,
      calendars: true,
    },
  });
}