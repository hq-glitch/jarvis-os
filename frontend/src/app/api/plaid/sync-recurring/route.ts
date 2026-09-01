import { NextResponse } from "next/server";

import { decrypt } from "@/lib/crypto/encryption";
import { plaidClient } from "@/lib/providers/plaid/client";
import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultUser } from "@/repositories/user-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function plaidDate(value: string | null | undefined) {
  return value
    ? new Date(`${value}T12:00:00`)
    : null;
}

export async function POST() {
  try {
    const user = await getOrCreateDefaultUser();

    const items = await prisma.plaidItem.findMany({
      where: {
        userId: user.id,
        status: "ACTIVE",
      },
    });

    let syncedSuggestions = 0;

    const errors: Array<{
      itemId: string;
      institution: string | null;
      error: string;
    }> = [];

    for (const item of items) {
      try {
        const accessToken = decrypt(
          item.encryptedAccessToken,
        );

        const response =
          await plaidClient.transactionsRecurringGet({
            access_token: accessToken,
          });

        for (const stream of response.data.outflow_streams ?? []) {
          await prisma.recurringBillSuggestion.upsert({
            where: {
              plaidStreamId: stream.stream_id,
            },
            update: {
              merchantName: stream.merchant_name ?? null,
              description: stream.description,
              frequency: stream.frequency,
              averageAmount:
                stream.average_amount.amount ??
                stream.last_amount?.amount ??
                0,
              lastAmount:
                stream.last_amount?.amount ?? null,
              firstDate: plaidDate(stream.first_date),
              lastDate: plaidDate(stream.last_date),
              predictedNextDate: plaidDate(
                stream.predicted_next_date,
              ),
              status: stream.status,
            },
            create: {
              userId: user.id,
              plaidStreamId: stream.stream_id,
              merchantName: stream.merchant_name ?? null,
              description: stream.description,
              frequency: stream.frequency,
              averageAmount:
                stream.average_amount.amount ??
                stream.last_amount?.amount ??
                0,
              lastAmount:
                stream.last_amount?.amount ?? null,
              firstDate: plaidDate(stream.first_date),
              lastDate: plaidDate(stream.last_date),
              predictedNextDate: plaidDate(
                stream.predicted_next_date,
              ),
              status: stream.status,
            },
          });

          syncedSuggestions += 1;
        }
      } catch (error: any) {
        const plaidError =
          error?.response?.data ?? null;

        const message =
          plaidError?.error_message ??
          (error instanceof Error
            ? error.message
            : "Unknown recurring transaction sync error.");

        errors.push({
          itemId: item.id,
          institution: item.institutionName,
          error: message,
        });
      }
    }

    return NextResponse.json({
      synced: true,
      syncedSuggestions,
      errors,
    });
  } catch (error) {
    console.error(
      "Failed to sync recurring transactions:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to sync recurring transactions.",
      },
      {
        status: 500,
      },
    );
  }
}
