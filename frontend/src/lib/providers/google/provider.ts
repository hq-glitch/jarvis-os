import { google, calendar_v3 } from "googleapis";
import {
  CalendarAccessRole,
} from "@/generated/prisma/client";
import {
  attachGoogleTokenPersistence,
  createGoogleOAuthClient,
} from "@/lib/providers/google/oauth";

export interface GoogleCredentialPayload {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  scope: string | null;
  tokenType: string | null;
}

export interface GoogleAccountProfile {
  providerAccountId: string;
  email: string;
  displayName: string | null;
}

export interface NormalizedGoogleCalendar {
  externalId: string;
  name: string;
  description: string | null;
  timeZone: string | null;
  providerColor: string | null;
  accessRole: CalendarAccessRole;
  isPrimary: boolean;
  isReadOnly: boolean;
}

function normalizeAccessRole(
  accessRole: calendar_v3.Schema$CalendarListEntry["accessRole"]
): CalendarAccessRole {
  switch (accessRole) {
    case "owner":
      return CalendarAccessRole.OWNER;

    case "writer":
      return CalendarAccessRole.WRITER;

    case "reader":
      return CalendarAccessRole.READER;

    case "freeBusyReader":
      return CalendarAccessRole.FREE_BUSY;

    default:
      return CalendarAccessRole.NONE;
  }
}

export async function exchangeGoogleAuthorizationCode(
  code: string
): Promise<GoogleCredentialPayload> {
  const client = createGoogleOAuthClient();

  const { tokens } = await client.getToken(code);

  if (!tokens.access_token) {
    throw new Error("Google did not return an access token.");
  }

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? null,
    expiresAt: tokens.expiry_date ?? null,
    scope: tokens.scope ?? null,
    tokenType: tokens.token_type ?? null,
  };
}

export async function getGoogleAccountProfile(
  credentials: GoogleCredentialPayload
): Promise<GoogleAccountProfile> {
  const client = createGoogleOAuthClient();

  client.setCredentials({
    access_token: credentials.accessToken,
    refresh_token: credentials.refreshToken,
    expiry_date: credentials.expiresAt,
    scope: credentials.scope ?? undefined,
    token_type: credentials.tokenType ?? undefined,
  });

  const oauth2 = google.oauth2({
    version: "v2",
    auth: client,
  });

  const response = await oauth2.userinfo.get();

  if (!response.data.id || !response.data.email) {
    throw new Error(
      "Google did not return the required account identity."
    );
  }

  return {
    providerAccountId: response.data.id,
    email: response.data.email,
    displayName: response.data.name ?? null,
  };
}

export async function listGoogleCalendars(
  credentials: GoogleCredentialPayload,
  integrationId?: string,
): Promise<NormalizedGoogleCalendar[]> {
  const client = createGoogleOAuthClient();

  if (integrationId) {
    attachGoogleTokenPersistence(
      client,
      integrationId,
      credentials,
    );
  }

  client.setCredentials({
    access_token: credentials.accessToken,
    refresh_token: credentials.refreshToken,
    expiry_date: credentials.expiresAt,
    scope: credentials.scope ?? undefined,
    token_type: credentials.tokenType ?? undefined,
  });

  const calendar = google.calendar({
    version: "v3",
    auth: client,
  });

  const calendars: NormalizedGoogleCalendar[] = [];
  let pageToken: string | undefined;

  do {
    const response = await calendar.calendarList.list({
      maxResults: 250,
      pageToken,
      showDeleted: false,
      showHidden: true,
    });

    for (const item of response.data.items ?? []) {
      if (!item.id) {
        continue;
      }

      const role = normalizeAccessRole(item.accessRole);

      calendars.push({
        externalId: item.id,
        name: item.summaryOverride ?? item.summary ?? "Untitled calendar",
        description: item.description ?? null,
        timeZone: item.timeZone ?? null,
        providerColor:
          item.backgroundColor ?? item.foregroundColor ?? null,
        accessRole: role,
        isPrimary: item.primary ?? false,
        isReadOnly:
          role !== CalendarAccessRole.OWNER &&
          role !== CalendarAccessRole.WRITER,
      });
    }

    pageToken = response.data.nextPageToken ?? undefined;
  } while (pageToken);

  return calendars;
}export interface NormalizedGoogleEvent {
  externalId: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: Date;
  endAt: Date;
  isAllDay: boolean;
  status: "CONFIRMED" | "TENTATIVE" | "CANCELLED";
  htmlLink: string | null;
  etag: string | null;
  recurringEventId: string | null;
  originalStartAt: Date | null;
  sourceUpdatedAt: Date | null;
}

function normalizeGoogleEventStatus(
  status: calendar_v3.Schema$Event["status"],
): "CONFIRMED" | "TENTATIVE" | "CANCELLED" {
  switch (status) {
    case "tentative":
      return "TENTATIVE";

    case "cancelled":
      return "CANCELLED";

    default:
      return "CONFIRMED";
  }
}

function parseGoogleEventDate(
  value: calendar_v3.Schema$EventDateTime | undefined,
): {
  date: Date;
  isAllDay: boolean;
} | null {
  if (!value) {
    return null;
  }

  if (value.dateTime) {
    return {
      date: new Date(value.dateTime),
      isAllDay: false,
    };
  }

  if (value.date) {
    return {
      date: new Date(`${value.date}T00:00:00`),
      isAllDay: true,
    };
  }

  return null;
}

export async function listGoogleEvents(
  credentials: GoogleCredentialPayload,
  integrationId: string,
  calendarId: string,
  timeMin: Date,
  timeMax: Date,
): Promise<NormalizedGoogleEvent[]> {
  const client = createGoogleOAuthClient();

  attachGoogleTokenPersistence(
    client,
    integrationId,
    credentials,
  );

  client.setCredentials({
    access_token: credentials.accessToken,
    refresh_token: credentials.refreshToken,
    expiry_date: credentials.expiresAt,
    scope: credentials.scope ?? undefined,
    token_type: credentials.tokenType ?? undefined,
  });

  const calendar = google.calendar({
    version: "v3",
    auth: client,
  });

  const events: NormalizedGoogleEvent[] = [];
  let pageToken: string | undefined;

  do {
    const response = await calendar.events.list({
      calendarId,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      showDeleted: true,
      maxResults: 2500,
      pageToken,
    });

    for (const item of response.data.items ?? []) {
      if (!item.id) {
        continue;
      }

      const start = parseGoogleEventDate(item.start);
      const end = parseGoogleEventDate(item.end);

      if (!start || !end) {
        continue;
      }

      const originalStart = parseGoogleEventDate(
        item.originalStartTime,
      );

      events.push({
        externalId: item.id,
        title: item.summary ?? "Untitled event",
        description: item.description ?? null,
        location: item.location ?? null,
        startAt: start.date,
        endAt: end.date,
        isAllDay: start.isAllDay,
        status: normalizeGoogleEventStatus(item.status),
        htmlLink: item.htmlLink ?? null,
        etag: item.etag ?? null,
        recurringEventId: item.recurringEventId ?? null,
        originalStartAt: originalStart?.date ?? null,
        sourceUpdatedAt: item.updated
          ? new Date(item.updated)
          : null,
      });
    }

    pageToken = response.data.nextPageToken ?? undefined;
  } while (pageToken);

  return events;
}

export interface CreateGoogleEventInput {
  title: string;
  description?: string | null;
  location?: string | null;
  startAt: Date;
  endAt: Date;
  isAllDay?: boolean;
}

export async function createGoogleEvent(
  credentials: GoogleCredentialPayload,
  integrationId: string,
  calendarId: string,
  input: CreateGoogleEventInput,
) {
  const client = createGoogleOAuthClient();

  attachGoogleTokenPersistence(
    client,
    integrationId,
    credentials,
  );

  client.setCredentials({
    access_token: credentials.accessToken,
    refresh_token: credentials.refreshToken,
    expiry_date: credentials.expiresAt,
    scope: credentials.scope ?? undefined,
    token_type: credentials.tokenType ?? undefined,
  });

  const calendar = google.calendar({
    version: "v3",
    auth: client,
  });

  const requestBody: calendar_v3.Schema$Event = {
    summary: input.title,
    description: input.description ?? undefined,
    location: input.location ?? undefined,
  };

  if (input.isAllDay) {
    requestBody.start = {
      date: input.startAt.toISOString().slice(0, 10),
    };

    requestBody.end = {
      date: input.endAt.toISOString().slice(0, 10),
    };
  } else {
    requestBody.start = {
      dateTime: input.startAt.toISOString(),
    };

    requestBody.end = {
      dateTime: input.endAt.toISOString(),
    };
  }

  const response = await calendar.events.insert({
    calendarId,
    requestBody,
  });

  if (!response.data.id) {
    throw new Error("Google did not return an event ID.");
  }

  return {
    externalId: response.data.id,
    htmlLink: response.data.htmlLink ?? null,
  };
}

export async function updateGoogleEvent(
  credentials: GoogleCredentialPayload,
  integrationId: string,
  calendarId: string,
  eventId: string,
  input: CreateGoogleEventInput,
) {
  const client = createGoogleOAuthClient();

  attachGoogleTokenPersistence(
    client,
    integrationId,
    credentials,
  );

  client.setCredentials({
    access_token: credentials.accessToken,
    refresh_token: credentials.refreshToken,
    expiry_date: credentials.expiresAt,
    scope: credentials.scope ?? undefined,
    token_type: credentials.tokenType ?? undefined,
  });

  const calendar = google.calendar({
    version: "v3",
    auth: client,
  });

  const requestBody: calendar_v3.Schema$Event = {
    summary: input.title,
    description: input.description ?? undefined,
    location: input.location ?? undefined,
  };

  if (input.isAllDay) {
    requestBody.start = {
      date: input.startAt.toISOString().slice(0, 10),
    };

    requestBody.end = {
      date: input.endAt.toISOString().slice(0, 10),
    };
  } else {
    requestBody.start = {
      dateTime: input.startAt.toISOString(),
    };

    requestBody.end = {
      dateTime: input.endAt.toISOString(),
    };
  }

  const response = await calendar.events.update({
    calendarId,
    eventId,
    requestBody,
  });

  return {
    externalId: response.data.id ?? eventId,
    htmlLink: response.data.htmlLink ?? null,
  };
}

export async function deleteGoogleEvent(
  credentials: GoogleCredentialPayload,
  integrationId: string,
  calendarId: string,
  eventId: string,
) {
  const client = createGoogleOAuthClient();

  attachGoogleTokenPersistence(
    client,
    integrationId,
    credentials,
  );

  client.setCredentials({
    access_token: credentials.accessToken,
    refresh_token: credentials.refreshToken,
    expiry_date: credentials.expiresAt,
    scope: credentials.scope ?? undefined,
    token_type: credentials.tokenType ?? undefined,
  });

  const calendar = google.calendar({
    version: "v3",
    auth: client,
  });

  await calendar.events.delete({
    calendarId,
    eventId,
  });
}
