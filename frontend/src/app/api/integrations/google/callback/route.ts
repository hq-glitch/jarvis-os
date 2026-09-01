import { NextRequest, NextResponse } from "next/server";
import { completeGoogleConnection } from "@/services/integration-service";

export const runtime = "nodejs";

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";
}

export async function GET(request: NextRequest) {
  const error = request.nextUrl.searchParams.get("error");
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  if (error) {
    const deniedUrl = new URL("/calendar/connect", getAppUrl());

    deniedUrl.searchParams.set("error", "google_denied");

    return NextResponse.redirect(deniedUrl);
  }

  if (!code || !state) {
    const invalidUrl = new URL("/calendar/connect", getAppUrl());

    invalidUrl.searchParams.set("error", "invalid_callback");

    return NextResponse.redirect(invalidUrl);
  }

  try {
    const result = await completeGoogleConnection(code, state);

    const successUrl = new URL(result.redirectPath, getAppUrl());

    successUrl.searchParams.set("connected", "google");
    successUrl.searchParams.set(
      "calendars",
      String(result.importedCalendarCount),
    );

    return NextResponse.redirect(successUrl);
  } catch (callbackError) {
    console.error(
      "Unable to complete Google OAuth flow.",
      callbackError,
    );

    const message =
      callbackError instanceof Error
        ? callbackError.message
        : "Unknown callback error";

    console.error("Google callback error message:", message);

    const failedUrl = new URL("/calendar/connect", getAppUrl());

    failedUrl.searchParams.set(
      "error",
      "google_connection_failed",
    );

    return NextResponse.redirect(failedUrl);
  }
}