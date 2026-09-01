import { NextResponse } from "next/server";
import {
  listConnectedIntegrations,
} from "@/services/integration-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const integrations =
      await listConnectedIntegrations();

    return NextResponse.json({
      integrations: integrations.map((integration) => ({
        id: integration.id,
        provider: integration.provider,
        email: integration.email,
        displayName: integration.displayName,
        status: integration.status,
        lastSyncedAt: integration.lastSyncedAt,
        lastError: integration.lastError,
        calendars: integration.calendars.map(
          (calendar) => ({
            id: calendar.id,
            name: calendar.name,
            isPrimary: calendar.isPrimary,
            isEnabled: calendar.isEnabled,
            isReadOnly: calendar.isReadOnly,
            providerColor: calendar.providerColor,
          })
        ),
      })),
    });
  } catch (error) {
    console.error(
      "Unable to load integrations.",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to load integrations.",
      },
      {
        status: 500,
      }
    );
  }
}