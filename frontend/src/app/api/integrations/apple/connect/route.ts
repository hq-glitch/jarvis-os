import { NextRequest, NextResponse } from "next/server";
import { completeAppleConnection } from "@/services/integration-service";

export const runtime = "nodejs";

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3001";
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const appleUsername = formData.get("appleUsername");
  const appSpecificPassword = formData.get(
    "appSpecificPassword",
  );

  if (
    typeof appleUsername !== "string" ||
    typeof appSpecificPassword !== "string" ||
    !appleUsername.trim() ||
    !appSpecificPassword.trim()
  ) {
    const missingUrl = new URL(
      "/calendar/connect",
      getAppUrl(),
    );

    missingUrl.searchParams.set(
      "error",
      "apple_missing_credentials",
    );

    return NextResponse.redirect(missingUrl, 303);
  }

  try {
    const result = await completeAppleConnection(
      appleUsername,
      appSpecificPassword,
    );

    const successUrl = new URL(
      "/calendar/connect",
      getAppUrl(),
    );

    successUrl.searchParams.set("connected", "apple");
    successUrl.searchParams.set(
      "calendars",
      String(result.importedCalendarCount),
    );

    return NextResponse.redirect(successUrl, 303);
  } catch (connectionError) {
    console.error(
      "Unable to complete Apple CalDAV connection.",
      connectionError,
    );

    const message =
      connectionError instanceof Error
        ? connectionError.message
        : "Unknown Apple connection error";

    console.error("Apple connection error message:", message);

    const failedUrl = new URL(
      "/calendar/connect",
      getAppUrl(),
    );

    failedUrl.searchParams.set(
      "error",
      "apple_connection_failed",
    );

    return NextResponse.redirect(failedUrl, 303);
  }
}