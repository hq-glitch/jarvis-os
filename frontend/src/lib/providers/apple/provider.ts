import { createDAVClient, type DAVCalendar } from "tsdav";
import ICAL from "ical.js";

const ICLOUD_CALDAV_URL = "https://caldav.icloud.com";

export interface AppleCredentials {
  username: string;
  appSpecificPassword: string;
}

export interface NormalizedAppleCalendar {
  externalId: string;
  name: string;
  description: string | null;
  timeZone: string | null;
  providerColor: string | null;
  isReadOnly: boolean;
  raw: DAVCalendar;
}

async function createAppleCalDAVClient(
  credentials: AppleCredentials,
) {
  return createDAVClient({
    serverUrl: ICLOUD_CALDAV_URL,
    credentials: {
      username: credentials.username,
      password: credentials.appSpecificPassword,
    },
    authMethod: "Basic",
    defaultAccountType: "caldav",
  });
}

export async function verifyAppleCredentials(
  credentials: AppleCredentials,
): Promise<void> {
  const client = await createAppleCalDAVClient(credentials);

  await client.fetchCalendars();
}

export async function listAppleCalendars(
  credentials: AppleCredentials,
): Promise<NormalizedAppleCalendar[]> {
  const client = await createAppleCalDAVClient(credentials);
  const calendars = await client.fetchCalendars();

  return calendars.map((calendar) => ({
    externalId: calendar.url,
    name:
  typeof calendar.displayName === "string"
    ? calendar.displayName
    : "Untitled iCloud calendar",
    description: calendar.description ?? null,
    timeZone: calendar.timezone ?? null,
    providerColor: calendar.calendarColor ?? null,
    isReadOnly: false,
    raw: calendar,
  }));
}export interface NormalizedAppleEvent {
  externalId: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: Date;
  endAt: Date;
  isAllDay: boolean;
  status: "CONFIRMED" | "TENTATIVE" | "CANCELLED";
  recurringEventId: string | null;
}

function getEventText(
  component: ICAL.Component,
  propertyName: string,
): string | null {
  const value = component.getFirstPropertyValue(propertyName);

  return typeof value === "string" ? value : null;
}

export async function listAppleEvents(
  credentials: AppleCredentials,
  calendarId: string,
  timeMin: Date,
  timeMax: Date,
): Promise<NormalizedAppleEvent[]> {
  const client = await createAppleCalDAVClient(credentials);
  const calendars = await client.fetchCalendars();

  const calendar = calendars.find(
    (item) => item.url === calendarId,
  );

  if (!calendar) {
    throw new Error("The requested iCloud calendar was not found.");
  }

  const calendarObjects = await client.fetchCalendarObjects({
    calendar,
    timeRange: {
      start: timeMin.toISOString(),
      end: timeMax.toISOString(),
    },
    expand: true,
  });

  const events: NormalizedAppleEvent[] = [];

  for (const calendarObject of calendarObjects) {
    if (!calendarObject.data) {
      continue;
    }

    try {
      const root = new ICAL.Component(
        ICAL.parse(calendarObject.data),
      );

      const eventComponents =
        root.getAllSubcomponents("vevent");

      for (const component of eventComponents) {
        const event = new ICAL.Event(component);
        const start = event.startDate;
        const end = event.endDate;

        if (!start || !end) {
          continue;
        }

        const startAt = start.toJSDate();
        const endAt = end.toJSDate();
        const statusValue =
          getEventText(component, "status")?.toUpperCase();

        const status =
          statusValue === "CANCELLED"
            ? "CANCELLED"
            : statusValue === "TENTATIVE"
              ? "TENTATIVE"
              : "CONFIRMED";

        const uid =
          event.uid ||
          calendarObject.url ||
          crypto.randomUUID();

        events.push({
          externalId: `${uid}:${startAt.toISOString()}`,
          title: event.summary || "Untitled event",
          description: getEventText(component, "description"),
          location: getEventText(component, "location"),
          startAt,
          endAt,
          isAllDay: start.isDate,
          status,
          recurringEventId:
            getEventText(component, "recurrence-id"),
        });
      }
    } catch (error) {
      console.warn(
        "Unable to parse an iCloud calendar object:",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  return events;
}
export interface CreateAppleEventInput {
  title: string;
  description?: string | null;
  location?: string | null;
  startAt: Date;
  endAt: Date;
  isAllDay: boolean;
}

function escapeICalText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function formatICalDateTime(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function formatICalDate(date: Date): string {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("");
}

export async function createAppleEvent(
  credentials: AppleCredentials,
  calendarId: string,
  input: CreateAppleEventInput,
): Promise<{
  externalId: string;
  url: string;
}> {
  const client = await createAppleCalDAVClient(credentials);

  const calendars = await client.fetchCalendars();

  const calendar = calendars.find(
    (item) => item.url === calendarId,
  );

  if (!calendar) {
    throw new Error(
      "The requested iCloud calendar was not found.",
    );
  }

  const uid = crypto.randomUUID();

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Jarvis OS//Calendar//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatICalDateTime(new Date())}`,
  ];

  if (input.isAllDay) {
    lines.push(
      `DTSTART;VALUE=DATE:${formatICalDate(input.startAt)}`,
    );

    lines.push(
      `DTEND;VALUE=DATE:${formatICalDate(input.endAt)}`,
    );
  } else {
    lines.push(
      `DTSTART:${formatICalDateTime(input.startAt)}`,
    );

    lines.push(
      `DTEND:${formatICalDateTime(input.endAt)}`,
    );
  }

  lines.push(`SUMMARY:${escapeICalText(input.title)}`);

  if (input.description) {
    lines.push(
      `DESCRIPTION:${escapeICalText(input.description)}`,
    );
  }

  if (input.location) {
    lines.push(
      `LOCATION:${escapeICalText(input.location)}`,
    );
  }

  lines.push(
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  );

  const calendarData = lines.join("\r\n");

  const calendarUrl = calendar.url.endsWith("/")
    ? calendar.url
    : `${calendar.url}/`;

  const eventUrl = `${calendarUrl}${uid}.ics`;

  await client.createCalendarObject({
    calendar,
    filename: `${uid}.ics`,
    iCalString: calendarData,
  });

  return {
    externalId: uid,
    url: eventUrl,
  };
}

async function findAppleCalendarObject(
  credentials: AppleCredentials,
  calendarId: string,
  eventUid: string,
) {
  const client = await createAppleCalDAVClient(credentials);

  const calendars = await client.fetchCalendars();

  const calendar = calendars.find(
    (item) => item.url === calendarId,
  );

  if (!calendar) {
    throw new Error(
      "The requested iCloud calendar was not found.",
    );
  }

  const objects = await client.fetchCalendarObjects({
    calendar,
  });

  const object = objects.find((item) => {
    if (!item.data) {
      return false;
    }

    try {
      const root = new ICAL.Component(
        ICAL.parse(item.data),
      );

      const eventComponent =
        root.getFirstSubcomponent("vevent");

      if (!eventComponent) {
        return false;
      }

      const event = new ICAL.Event(eventComponent);

      return event.uid === eventUid;
    } catch {
      return false;
    }
  });

  if (!object) {
    throw new Error(
      "The requested iCloud event was not found.",
    );
  }

  return {
    client,
    calendar,
    object,
  };
}

export async function updateAppleEvent(
  credentials: AppleCredentials,
  calendarId: string,
  eventUid: string,
  input: CreateAppleEventInput,
) {
  const { client, object } =
    await findAppleCalendarObject(
      credentials,
      calendarId,
      eventUid,
    );

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Jarvis OS//Calendar//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${eventUid}`,
    `DTSTAMP:${formatICalDateTime(new Date())}`,
  ];

  if (input.isAllDay) {
    lines.push(
      `DTSTART;VALUE=DATE:${formatICalDate(input.startAt)}`,
    );

    lines.push(
      `DTEND;VALUE=DATE:${formatICalDate(input.endAt)}`,
    );
  } else {
    lines.push(
      `DTSTART:${formatICalDateTime(input.startAt)}`,
    );

    lines.push(
      `DTEND:${formatICalDateTime(input.endAt)}`,
    );
  }

  lines.push(
    `SUMMARY:${escapeICalText(input.title)}`,
  );

  if (input.description) {
    lines.push(
      `DESCRIPTION:${escapeICalText(input.description)}`,
    );
  }

  if (input.location) {
    lines.push(
      `LOCATION:${escapeICalText(input.location)}`,
    );
  }

  lines.push(
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  );

  await client.updateCalendarObject({
    calendarObject: {
      ...object,
      data: lines.join("\r\n"),
    },
  });
}

export async function deleteAppleEvent(
  credentials: AppleCredentials,
  calendarId: string,
  eventUid: string,
) {
  const { client, object } =
    await findAppleCalendarObject(
      credentials,
      calendarId,
      eventUid,
    );

  await client.deleteCalendarObject({
    calendarObject: object,
  });
}
