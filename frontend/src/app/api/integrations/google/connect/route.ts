import { NextRequest, NextResponse } from "next/server";
import { createGoogleConnectionUrl } from "@/services/integration-service";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const requestedRedirectPath =
      request.nextUrl.searchParams.get("redirect");

    const redirectPath =
      requestedRedirectPath?.startsWith("/")
        ? requestedRedirectPath
        : "/calendar/connect";

    const authorizationUrl =
      await createGoogleConnectionUrl(redirectPath);

    return NextResponse.redirect(authorizationUrl);
  } catch (error) {
    console.error("Unable to begin Google OAuth flow.", error);

    return NextResponse.json(
      {
        error: "Unable to begin the Google connection.",
      },
      {
        status: 500,
      }
    );
  }
}