import { prisma } from "@/lib/db";

export async function getCalendars(userId: string) {
  return prisma.externalCalendar.findMany({
    where: {
      userId,
      isEnabled: true,
    },
    include: {
      integration: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}