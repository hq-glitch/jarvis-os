import { NextResponse } from "next/server";

import { decrypt } from "@/lib/crypto/encryption";
import { listGmailMessages } from "@/lib/providers/google/gmail";
import type { GoogleCredentialPayload } from "@/lib/providers/google/provider";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const accounts = [];
  const connectionErrors = [];

  const integrations = await prisma.integration.findMany({
    where: {
      provider: "GOOGLE",
      status: "ACTIVE",
    },
    include: {
      credential: true,
      calendars: true,
    },
  });

  for (const integration of integrations) {
    try {
      if (!integration.credential) {
        throw new Error("Missing saved Google credentials.");
      }

      const credentials = JSON.parse(
        decrypt(integration.credential.encryptedPayload),
      ) as GoogleCredentialPayload;

      const messages = await listGmailMessages(
        credentials,
        integration.id,
        {
          maxResults: 25,
        },
      );

      const primaryCalendar =
        integration.calendars.find((calendar) => calendar.isPrimary) ??
        integration.calendars[0];

      accounts.push({
        integrationId: integration.id,
        email: integration.email,
        displayName: integration.displayName,
        accountColor:
          primaryCalendar?.customColor ??
          primaryCalendar?.providerColor ??
          null,
        messages,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown Gmail error.";

      console.error(
        `Failed to load Gmail for ${integration.email}:`,
        error,
      );

      connectionErrors.push({
        integrationId: integration.id,
        email: integration.email,
        error: message,
      });
    }
  }

  return NextResponse.json({
    accounts,
    connectionErrors,
  });
}
