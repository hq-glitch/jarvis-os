import { NextRequest, NextResponse } from "next/server";

import { IntegrationProvider } from "@/generated/prisma/client";
import { decrypt } from "@/lib/crypto/encryption";

import {
  type AppleCredentials,
  createAppleEvent,
  deleteAppleEvent,
  listAppleEvents,
  updateAppleEvent,
} from "@/lib/providers/apple/provider";

import {
  type GoogleCredentialPayload,
  createGoogleEvent,
  deleteGoogleEvent,
  listGoogleEvents,
  updateGoogleEvent,
} from "@/lib/providers/google/provider";

import {
  getIntegration,
  getIntegrations,
} from "@/repositories/integration-repository";

import { getOrCreateDefaultUser } from "@/repositories/user-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const events = [];
  const connectionErrors = [];

  try {
    const user = await getOrCreateDefaultUser();
    const integrations = await getIntegrations(user.id);

    const timeMin = new Date();
    timeMin.setDate(timeMin.getDate() - 90);

    const timeMax = new Date();
    timeMax.setFullYear(timeMax.getFullYear() + 1);

    for (const integration of integrations) {
      if (integration.provider === IntegrationProvider.APPLE) {
        try {
          const connectedIntegration =
            await getIntegration(integration.id);

          const encryptedPayload =
            connectedIntegration?.credential?.encryptedPayload;

          if (!connectedIntegration || !encryptedPayload) {
            connectionErrors.push({
              accountEmail: integration.email,
              error: "Missing saved iCloud credentials.",
            });

            continue;
          }

          const credentials = JSON.parse(
            decrypt(encryptedPayload),
          ) as AppleCredentials;

          const enabledCalendars =
            connectedIntegration.calendars.filter(
              (calendar) => calendar.isEnabled,
            );

          await Promise.all(
            enabledCalendars.map(async (calendar) => {
              try {
                const appleEvents = await listAppleEvents(
                  credentials,
                  calendar.externalId,
                  timeMin,
                  timeMax,
                );

                for (const event of appleEvents) {
                  if (event.status === "CANCELLED") {
                    continue;
                  }

                  events.push({
                    id: `apple:${calendar.id}:${event.externalId}`,
                    title: event.title,
                    startAt: event.startAt.toISOString(),
                    endAt: event.endAt.toISOString(),
                    isAllDay: event.isAllDay,
                    notes: event.description ?? "",
                    location: event.location,
                    htmlLink: null,
                    calendarName: calendar.name,
                    calendarColor: calendar.providerColor,
                    accountEmail: connectedIntegration.email,
                  });
                }
              } catch (error) {
                connectionErrors.push({
                  accountEmail: connectedIntegration.email,
                  calendarName: calendar.name,
                  error:
                    error instanceof Error
                      ? error.message
                      : "Unable to load this iCloud calendar.",
                });
              }
            }),
          );
        } catch (error) {
          connectionErrors.push({
            accountEmail: integration.email,
            error:
              error instanceof Error
                ? error.message
                : "Unable to load iCloud events.",
          });
        }

        continue;
      }

      if (integration.provider !== IntegrationProvider.GOOGLE) {
        continue;
      }

      try {
        const connectedIntegration =
          await getIntegration(integration.id);

        const encryptedPayload =
          connectedIntegration?.credential?.encryptedPayload;

        if (!connectedIntegration || !encryptedPayload) {
          connectionErrors.push({
            accountEmail: integration.email,
            error: "Missing saved credentials.",
          });

          continue;
        }

        const credentials = JSON.parse(
          decrypt(encryptedPayload),
        ) as GoogleCredentialPayload;

        for (const calendar of connectedIntegration.calendars) {
          if (!calendar.isEnabled) {
            continue;
          }

          try {
            const googleEvents = await listGoogleEvents(
              credentials,
              connectedIntegration.id,
              calendar.externalId,
              timeMin,
              timeMax,
            );

            for (const event of googleEvents) {
              if (event.status === "CANCELLED") {
                continue;
              }

              events.push({
                id: `google:${calendar.id}:${event.externalId}`,
                title: event.title,
                startAt: event.startAt.toISOString(),
                endAt: event.endAt.toISOString(),
                isAllDay: event.isAllDay,
                notes: event.description ?? "",
                location: event.location,
                htmlLink: event.htmlLink,
                calendarName: calendar.name,
                calendarColor:
                  calendar.customColor ??
                  calendar.providerColor,
                accountEmail: connectedIntegration.email,
              });
            }
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "Unknown error";

            connectionErrors.push({
              accountEmail: connectedIntegration.email,
              calendarName: calendar.name,
              error:
                message === "invalid_grant"
                  ? "Google authorization expired. Reconnect this account."
                  : message,
            });

            break;
          }
        }
      } catch (error) {
        connectionErrors.push({
          accountEmail: integration.email,
          error:
            error instanceof Error
              ? error.message
              : "Unknown error",
        });
      }
    }

    events.sort((first, second) =>
      first.startAt.localeCompare(second.startAt),
    );

    return NextResponse.json({
      events,
      connectionErrors,
    });
  } catch (error) {
    console.error(
      "Unable to load calendar events:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return NextResponse.json(
      {
        error: "Unable to load calendar events.",
        events,
        connectionErrors,
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      calendarId?: string;
      title?: string;
      description?: string | null;
      location?: string | null;
      startAt?: string;
      endAt?: string;
      isAllDay?: boolean;
    };

    if (
      !body.calendarId ||
      !body.title?.trim() ||
      !body.startAt ||
      !body.endAt
    ) {
      return NextResponse.json(
        {
          error:
            "Calendar, title, start time, and end time are required.",
        },
        {
          status: 400,
        },
      );
    }

    const user = await getOrCreateDefaultUser();
    const integrations = await getIntegrations(user.id);

    let selectedIntegration = null;
    let selectedCalendar = null;

    for (const integration of integrations) {
      const calendar = integration.calendars.find(
        (item) => item.id === body.calendarId,
      );

      if (calendar) {
        selectedIntegration = integration;
        selectedCalendar = calendar;
        break;
      }
    }

    if (!selectedIntegration || !selectedCalendar) {
      return NextResponse.json(
        {
          error: "Selected calendar was not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (selectedCalendar.isReadOnly) {
      return NextResponse.json(
        {
          error: "Selected calendar is read-only.",
        },
        {
          status: 400,
        },
      );
    }

    const connectedIntegration =
      await getIntegration(selectedIntegration.id);

    const encryptedPayload =
      connectedIntegration?.credential?.encryptedPayload;

    if (!connectedIntegration || !encryptedPayload) {
      return NextResponse.json(
        {
          error: "Missing saved calendar credentials.",
        },
        {
          status: 400,
        },
      );
    }

    const startAt = new Date(body.startAt);
    const endAt = new Date(body.endAt);

    if (
      Number.isNaN(startAt.getTime()) ||
      Number.isNaN(endAt.getTime())
    ) {
      return NextResponse.json(
        {
          error: "Invalid event date or time.",
        },
        {
          status: 400,
        },
      );
    }

    let externalId: string;
    let htmlLink: string | null = null;

    if (
      selectedIntegration.provider ===
      IntegrationProvider.GOOGLE
    ) {
      const credentials = JSON.parse(
        decrypt(encryptedPayload),
      ) as GoogleCredentialPayload;

      const result = await createGoogleEvent(
        credentials,
        selectedIntegration.id,
        selectedCalendar.externalId,
        {
          title: body.title.trim(),
          description: body.description?.trim() || null,
          location: body.location?.trim() || null,
          startAt,
          endAt,
          isAllDay: body.isAllDay ?? false,
        },
      );

      externalId = result.externalId;
      htmlLink = result.htmlLink;
    } else if (
      selectedIntegration.provider ===
      IntegrationProvider.APPLE
    ) {
      const credentials = JSON.parse(
        decrypt(encryptedPayload),
      ) as AppleCredentials;

      const result = await createAppleEvent(
        credentials,
        selectedCalendar.externalId,
        {
          title: body.title.trim(),
          description: body.description?.trim() || null,
          location: body.location?.trim() || null,
          startAt,
          endAt,
          isAllDay: body.isAllDay ?? false,
        },
      );

      externalId = result.externalId;
    } else {
      return NextResponse.json(
        {
          error: "Unsupported calendar provider.",
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json({
      created: true,
      calendarId: selectedCalendar.id,
      calendarName: selectedCalendar.name,
      externalId,
      htmlLink,
    });
  } catch (error) {
    console.error("Unable to create calendar event:", error);

    return NextResponse.json(
      {
        error: "Unable to create calendar event.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      id?: string;
      title?: string;
      description?: string | null;
      location?: string | null;
      startAt?: string;
      endAt?: string;
      isAllDay?: boolean;
    };

    if (
      !body.id ||
      !body.title?.trim() ||
      !body.startAt ||
      !body.endAt
    ) {
      return NextResponse.json(
        { error: "Event details are incomplete." },
        { status: 400 },
      );
    }

    const parts = body.id.split(":");
    const provider = parts[0];
    const calendarId = parts[1];
    const rawEventId = parts.slice(2).join(":");

    if (!provider || !calendarId || !rawEventId) {
      return NextResponse.json(
        { error: "Invalid event ID." },
        { status: 400 },
      );
    }

    const user = await getOrCreateDefaultUser();
    const integrations = await getIntegrations(user.id);

    let selectedIntegration = null;
    let selectedCalendar = null;

    for (const integration of integrations) {
      const calendar = integration.calendars.find(
        (item) => item.id === calendarId,
      );

      if (calendar) {
        selectedIntegration = integration;
        selectedCalendar = calendar;
        break;
      }
    }

    if (!selectedIntegration || !selectedCalendar) {
      return NextResponse.json(
        { error: "Calendar not found." },
        { status: 404 },
      );
    }

    if (selectedCalendar.isReadOnly) {
      return NextResponse.json(
        { error: "Calendar is read-only." },
        { status: 400 },
      );
    }

    const connectedIntegration =
      await getIntegration(selectedIntegration.id);

    const encryptedPayload =
      connectedIntegration?.credential?.encryptedPayload;

    if (!connectedIntegration || !encryptedPayload) {
      return NextResponse.json(
        { error: "Missing calendar credentials." },
        { status: 400 },
      );
    }

    const startAt = new Date(body.startAt);
    const endAt = new Date(body.endAt);

    if (
      Number.isNaN(startAt.getTime()) ||
      Number.isNaN(endAt.getTime())
    ) {
      return NextResponse.json(
        { error: "Invalid event date or time." },
        { status: 400 },
      );
    }

    if (provider === "google") {
      const credentials = JSON.parse(
        decrypt(encryptedPayload),
      ) as GoogleCredentialPayload;

      await updateGoogleEvent(
        credentials,
        selectedIntegration.id,
        selectedCalendar.externalId,
        rawEventId,
        {
          title: body.title.trim(),
          description: body.description?.trim() || null,
          location: body.location?.trim() || null,
          startAt,
          endAt,
          isAllDay: body.isAllDay ?? false,
        },
      );
    } else if (provider === "apple") {
      const credentials = JSON.parse(
        decrypt(encryptedPayload),
      ) as AppleCredentials;

      const appleUid = rawEventId.split(":")[0];

      await updateAppleEvent(
        credentials,
        selectedCalendar.externalId,
        appleUid,
        {
          title: body.title.trim(),
          description: body.description?.trim() || null,
          location: body.location?.trim() || null,
          startAt,
          endAt,
          isAllDay: body.isAllDay ?? false,
        },
      );
    } else {
      return NextResponse.json(
        { error: "Unsupported provider." },
        { status: 400 },
      );
    }

    return NextResponse.json({ updated: true });
  } catch (error) {
    console.error("Unable to update calendar event:", error);

    return NextResponse.json(
      { error: "Unable to update calendar event." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      id?: string;
    };

    if (!body.id) {
      return NextResponse.json(
        { error: "Event ID is required." },
        { status: 400 },
      );
    }

    const parts = body.id.split(":");
    const provider = parts[0];
    const calendarId = parts[1];
    const rawEventId = parts.slice(2).join(":");

    if (!provider || !calendarId || !rawEventId) {
      return NextResponse.json(
        { error: "Invalid event ID." },
        { status: 400 },
      );
    }

    const user = await getOrCreateDefaultUser();
    const integrations = await getIntegrations(user.id);

    let selectedIntegration = null;
    let selectedCalendar = null;

    for (const integration of integrations) {
      const calendar = integration.calendars.find(
        (item) => item.id === calendarId,
      );

      if (calendar) {
        selectedIntegration = integration;
        selectedCalendar = calendar;
        break;
      }
    }

    if (!selectedIntegration || !selectedCalendar) {
      return NextResponse.json(
        { error: "Calendar not found." },
        { status: 404 },
      );
    }

    if (selectedCalendar.isReadOnly) {
      return NextResponse.json(
        { error: "Calendar is read-only." },
        { status: 400 },
      );
    }

    const connectedIntegration =
      await getIntegration(selectedIntegration.id);

    const encryptedPayload =
      connectedIntegration?.credential?.encryptedPayload;

    if (!connectedIntegration || !encryptedPayload) {
      return NextResponse.json(
        { error: "Missing calendar credentials." },
        { status: 400 },
      );
    }

    if (provider === "google") {
      const credentials = JSON.parse(
        decrypt(encryptedPayload),
      ) as GoogleCredentialPayload;

      await deleteGoogleEvent(
        credentials,
        selectedIntegration.id,
        selectedCalendar.externalId,
        rawEventId,
      );
    } else if (provider === "apple") {
      const credentials = JSON.parse(
        decrypt(encryptedPayload),
      ) as AppleCredentials;

      const appleUid = rawEventId.split(":")[0];

      await deleteAppleEvent(
        credentials,
        selectedCalendar.externalId,
        appleUid,
      );
    } else {
      return NextResponse.json(
        { error: "Unsupported provider." },
        { status: 400 },
      );
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Unable to delete calendar event:", error);

    return NextResponse.json(
      { error: "Unable to delete calendar event." },
      { status: 500 },
    );
  }
}
