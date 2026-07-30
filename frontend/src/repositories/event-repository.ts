import { prisma } from "@/lib/db";

export async function getEvents(calendarId: string) {
  return prisma.calendarEvent.findMany({
    where: {
      calendarId,
      deletedAt: null,
    },
    orderBy: {
      startAt: "asc",
    },
  });
}