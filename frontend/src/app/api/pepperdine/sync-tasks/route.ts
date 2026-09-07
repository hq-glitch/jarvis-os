import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { fall2026Weeks } from "@/lib/pepperdine/fall-2026";
import { getOrCreateDefaultUser } from "@/repositories/user-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SOURCE_ACCOUNT = "pepperdine-fall-2026";

function sourceId(
  week: number,
  course: string,
  title: string,
  dueDate: string,
) {
  return [
    `week-${week}`,
    course,
    title,
    dueDate,
  ].join("|");
}

export async function POST() {
  try {
    const user = await getOrCreateDefaultUser();

    const pepperdineArea = await prisma.area.findFirst({
      where: {
        userId: user.id,
        slug: "pepperdine",
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!pepperdineArea) {
      return NextResponse.json(
        {
          error: "Pepperdine Area was not found.",
        },
        {
          status: 404,
        },
      );
    }

    const assignments = fall2026Weeks.flatMap((week) =>
      week.items
        .filter(
          (item) =>
            item.type === "assignment" &&
            Boolean(item.dueDate),
        )
        .map((item) => ({
          week: week.week,
          item,
        })),
    );

    let created = 0;
    let existing = 0;

    for (const { week, item } of assignments) {
      const dueDate = item.dueDate!;

      const stableSourceId = sourceId(
        week,
        item.course,
        item.title,
        dueDate,
      );

      const existingTask = await prisma.task.findFirst({
        where: {
          userId: user.id,
          sourceAccount: SOURCE_ACCOUNT,
          sourceMessageId: stableSourceId,
        },
        select: {
          id: true,
        },
      });

      if (existingTask) {
        existing += 1;
        continue;
      }

      await prisma.task.create({
        data: {
          userId: user.id,
          title: `${item.course}: ${item.title}`,
          description: `Pepperdine Fall 2026 • Week ${week}`,
          status: "TODO",
          priority:
            item.priority === "high"
              ? "HIGH"
              : "NORMAL",
          dueAt: new Date(`${dueDate}T12:00:00.000Z`),
          sourceType: "PEPPERDINE",
          sourceAccount: SOURCE_ACCOUNT,
          sourceMessageId: stableSourceId,
          areaId: pepperdineArea.id,
        },
      });

      created += 1;
    }

    return NextResponse.json({
      synced: true,
      assignmentCount: assignments.length,
      created,
      existing,
    });
  } catch (error) {
    console.error(
      "Unable to sync Pepperdine assignments:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return NextResponse.json(
      {
        error: "Unable to sync Pepperdine assignments.",
      },
      {
        status: 500,
      },
    );
  }
}
