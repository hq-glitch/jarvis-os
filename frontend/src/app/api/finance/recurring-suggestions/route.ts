import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultUser } from "@/repositories/user-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      id?: string;
      action?: "approve" | "ignore";
    };

    if (!body.id || !body.action) {
      return NextResponse.json(
        {
          error: "Suggestion ID and action are required.",
        },
        {
          status: 400,
        },
      );
    }

    const user = await getOrCreateDefaultUser();

    const suggestion =
      await prisma.recurringBillSuggestion.findFirst({
        where: {
          id: body.id,
          userId: user.id,
        },
      });

    if (!suggestion) {
      return NextResponse.json(
        {
          error: "Recurring suggestion not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (body.action === "ignore") {
      const updated =
        await prisma.recurringBillSuggestion.update({
          where: {
            id: suggestion.id,
          },
          data: {
            reviewStatus: "IGNORED",
          },
        });

      return NextResponse.json({
        suggestion: updated,
      });
    }

    const nextDueAt =
      suggestion.predictedNextDate ?? null;

    const dueDay = nextDueAt
      ? nextDueAt.getDate()
      : null;

    const bill = await prisma.bill.create({
      data: {
        userId: user.id,
        name:
          suggestion.merchantName ??
          suggestion.description,
        amount:
          suggestion.lastAmount ??
          suggestion.averageAmount,
        frequency: suggestion.frequency,
        dueDay,
        nextDueAt,
        isAutopay: false,
        isActive: true,
        notes:
          "Created from a Plaid recurring transaction suggestion.",
      },
    });

    await prisma.recurringBillSuggestion.update({
      where: {
        id: suggestion.id,
      },
      data: {
        reviewStatus: "APPROVED",
      },
    });

    return NextResponse.json({
      bill,
    });
  } catch (error) {
    console.error(
      "Failed to review recurring suggestion:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to review recurring suggestion.",
      },
      {
        status: 500,
      },
    );
  }
}
