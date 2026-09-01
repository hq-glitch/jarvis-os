
import { NextRequest, NextResponse } from "next/server";
import { setCalendarEnabled } from "@/repositories/integration-repository";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ calendarId: string }>;
  },
) {
  try {
    const { calendarId } = await params;

    const body = await request.json();

    if (typeof body.isEnabled !== "boolean") {
      return NextResponse.json(
        {
          error: "isEnabled must be a boolean.",
        },
        {
          status: 400,
        },
      );
    }

    const calendar = await setCalendarEnabled(
      calendarId,
      body.isEnabled,
    );

    return NextResponse.json({
      calendar,
    });
  } catch (error) {
    console.error("Unable to update calendar.", error);

    return NextResponse.json(
      {
        error: "Unable to update calendar.",
      },
      {
        status: 500,
      },
    );
  }
}

