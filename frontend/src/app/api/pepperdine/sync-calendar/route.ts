import { NextRequest, NextResponse } from "next/server";

import { IntegrationProvider } from "@/generated/prisma/client";
import { decrypt } from "@/lib/crypto/encryption";
import { fall2026Weeks } from "@/lib/pepperdine/fall-2026";
import { prisma } from "@/lib/prisma";
import {
  createGoogleEvent,
  type GoogleCredentialPayload,
} from "@/lib/providers/google/provider";
import { getIntegration } from "@/repositories/integration-repository";
import { getOrCreateDefaultUser } from "@/repositories/user-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SOURCE_TYPE = "PEPPERDINE";
const SOURCE_ACCOUNT = "pepperdine-fall-2026";

// Dedicated Pepperdine calendar under hq@roukeranch.com
const PEPPERDINE_CALENDAR_ID = "cms89wd3900043xrj8ne8ctwz";

type ParsedTime = {
  hour: number;
  minute: number;
};

function parseClock(
  value: string,
  fallbackMeridiem?: "AM" | "PM",
): ParsedTime {
  const match = value
    .trim()
    .match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);

  if (!match) {
    throw new Error(`Unable to parse time: ${value}`);
  }

  let hour = Number(match[1]);
  const minute = Number(match[2] ?? "0");

  const meridiem = (
    match[3]?.toUpperCase() ??
    fallbackMeridiem
  ) as "AM" | "PM" | undefined;

  if (!meridiem) {
    throw new Error(`Missing AM/PM for time: ${value}`);
  }

  if (hour === 12) {
    hour = 0;
  }

  if (meridiem === "PM") {
    hour += 12;
  }

  return { hour, minute };
}

function parseMeetingTimes(title: string) {
  const match = title.match(
    /—\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)\s*[–-]\s*(\d{1,2}(?::\d{2})?\s*(AM|PM))\s*PT/i,
  );

  if (!match) {
    throw new Error(`Unable to parse meeting times: ${title}`);
  }

  const endMeridiem = match[3].toUpperCase() as "AM" | "PM";

  return {
    start: parseClock(match[1], endMeridiem),
    end: parseClock(match[2]),
  };
}

/*
 * Fall 2026 Pepperdine meetings are expressed in Pacific Time.
 *
 * DST ends November 1, 2026:
 *   before Nov 1: PDT = UTC-7
 *   Nov 1 onward: PST = UTC-8
 *
 * These semester dates do not cross any ambiguous transition-hour
 * meetings, so explicit offsets are safe for this Fall 2026 dataset.
 */
function pacificOffset(date: string) {
  return date < "2026-11-01" ? "-07:00" : "-08:00";
}

function toPacificInstant(
  date: string,
  time: ParsedTime,
) {
  const hh = String(time.hour).padStart(2, "0");
  const mm = String(time.minute).padStart(2, "0");

  return new Date(
    `${date}T${hh}:${mm}:00${pacificOffset(date)}`,
  );
}

function sourceId(
  week: number,
  course: string,
  date: string,
  title: string,
) {
  return [
    `week-${week}`,
    course,
    date,
    title,
  ].join("|");
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      dryRun?: boolean;
    };

    // Safety default: preview unless explicitly set to false.
    const dryRun = body.dryRun !== false;

    const user = await getOrCreateDefaultUser();

    const calendar = await prisma.externalCalendar.findFirst({
      where: {
        id: PEPPERDINE_CALENDAR_ID,
        userId: user.id,
      },
      include: {
        integration: true,
      },
    });

    if (!calendar) {
      return NextResponse.json(
        { error: "Dedicated Pepperdine calendar was not found." },
        { status: 404 },
      );
    }

    if (calendar.isReadOnly) {
      return NextResponse.json(
        { error: "Dedicated Pepperdine calendar is read-only." },
        { status: 400 },
      );
    }

    const meetings = fall2026Weeks.flatMap((week) =>
      week.items
        .filter(
          (item) =>
            item.type === "meeting" &&
            Boolean(item.dueDate),
        )
        .map((item) => {
          const date = item.dueDate!;
          const times = parseMeetingTimes(item.title);

          const startAt = toPacificInstant(
            date,
            times.start,
          );

          const endAt = toPacificInstant(
            date,
            times.end,
          );

          return {
            week: week.week,
            course: item.course,
            sourceId: sourceId(
              week.week,
              item.course,
              date,
              item.title,
            ),
            title: `${item.course}: ${item.title.split(" — ")[0]}`,
            syllabusTitle: item.title,
            date,
            startAt,
            endAt,
            priority: item.priority ?? "normal",
          };
        }),
    );

    const existingSyncs =
      await prisma.calendarSourceSync.findMany({
        where: {
          userId: user.id,
          sourceType: SOURCE_TYPE,
          sourceAccount: SOURCE_ACCOUNT,
        },
        select: {
          sourceId: true,
        },
      });

    const existingIds = new Set(
      existingSyncs.map((sync) => sync.sourceId),
    );

    const preview = meetings.map((meeting) => ({
      week: meeting.week,
      course: meeting.course,
      title: meeting.title,
      syllabusTitle: meeting.syllabusTitle,
      date: meeting.date,
      startAt: meeting.startAt.toISOString(),
      endAt: meeting.endAt.toISOString(),
      alreadySynced: existingIds.has(meeting.sourceId),
      action: existingIds.has(meeting.sourceId)
        ? "SKIP"
        : dryRun
          ? "WOULD_CREATE"
          : "READY_TO_CREATE",
    }));

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        calendar: {
          id: calendar.id,
          name: calendar.name,
          accountEmail: calendar.integration?.email ?? null,
        },
        meetingCount: meetings.length,
        wouldCreate: preview.filter(
          (item) => item.action === "WOULD_CREATE",
        ).length,
        wouldSkip: preview.filter(
          (item) => item.action === "SKIP",
        ).length,
        preview,
      });
    }

    if (
      !calendar.integration ||
      calendar.integration.provider !== IntegrationProvider.GOOGLE
    ) {
      return NextResponse.json(
        {
          error:
            "The dedicated Pepperdine calendar is not attached to a Google integration.",
        },
        { status: 400 },
      );
    }

    const connectedIntegration = await getIntegration(
      calendar.integration.id,
    );

    const encryptedPayload =
      connectedIntegration?.credential?.encryptedPayload;

    if (!connectedIntegration || !encryptedPayload) {
      return NextResponse.json(
        { error: "Missing saved Google calendar credentials." },
        { status: 400 },
      );
    }

    const credentials = JSON.parse(
      decrypt(encryptedPayload),
    ) as GoogleCredentialPayload;

    let created = 0;
    let skipped = 0;

    const results = [];

    for (const meeting of meetings) {
      if (existingIds.has(meeting.sourceId)) {
        skipped += 1;

        results.push({
          course: meeting.course,
          date: meeting.date,
          title: meeting.title,
          action: "SKIPPED",
        });

        continue;
      }

      const result = await createGoogleEvent(
        credentials,
        connectedIntegration.id,
        calendar.externalId,
        {
          title: meeting.title,
          description: [
            "Pepperdine Fall 2026",
            `Week ${meeting.week}`,
            meeting.syllabusTitle,
          ].join(" • "),
          location: meeting.syllabusTitle.startsWith("Live Zoom")
            ? "Zoom"
            : null,
          startAt: meeting.startAt,
          endAt: meeting.endAt,
          isAllDay: false,
        },
      );

      await prisma.calendarSourceSync.create({
        data: {
          userId: user.id,
          sourceType: SOURCE_TYPE,
          sourceAccount: SOURCE_ACCOUNT,
          sourceId: meeting.sourceId,
          calendarId: calendar.id,
          externalEventId: result.externalId,
          htmlLink: result.htmlLink,
          title: meeting.title,
          startAt: meeting.startAt,
          endAt: meeting.endAt,
        },
      });

      existingIds.add(meeting.sourceId);
      created += 1;

      results.push({
        course: meeting.course,
        date: meeting.date,
        title: meeting.title,
        action: "CREATED",
        externalEventId: result.externalId,
        htmlLink: result.htmlLink,
      });
    }

    return NextResponse.json({
      synced: true,
      dryRun: false,
      calendar: {
        id: calendar.id,
        name: calendar.name,
        accountEmail: calendar.integration.email,
      },
      meetingCount: meetings.length,
      created,
      skipped,
      results,
    });
  } catch (error) {
    console.error(
      "Unable to preview Pepperdine calendar sync:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to preview Pepperdine calendar sync.",
      },
      { status: 500 },
    );
  }
}
