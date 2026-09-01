import { NextResponse } from "next/server";

import { decrypt } from "@/lib/crypto/encryption";
import { plaidClient } from "@/lib/providers/plaid/client";
import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultUser } from "@/repositories/user-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const user = await getOrCreateDefaultUser();

    const items = await prisma.plaidItem.findMany({
      where: {
        userId: user.id,
        status: "ACTIVE",
      },
    });

    const results = [];

    for (const item of items) {
      try {
        const accessToken = decrypt(
          item.encryptedAccessToken,
        );

        const response =
          await plaidClient.transactionsRecurringGet({
            access_token: accessToken,
          });

        results.push({
          itemId: item.id,
          institution: item.institutionName,
          success: true,
          inflowCount:
            response.data.inflow_streams?.length ?? 0,
          outflowCount:
            response.data.outflow_streams?.length ?? 0,
          outflows:
            response.data.outflow_streams?.map((stream) => ({
              streamId: stream.stream_id,
              merchantName: stream.merchant_name,
              description: stream.description,
              frequency: stream.frequency,
              averageAmount: stream.average_amount,
              lastAmount: stream.last_amount,
              firstDate: stream.first_date,
              lastDate: stream.last_date,
              predictedNextDate:
                stream.predicted_next_date,
              status: stream.status,
            })) ?? [],
        });
      } catch (error: any) {
        results.push({
          itemId: item.id,
          institution: item.institutionName,
          success: false,
          plaidError:
            error?.response?.data ?? {
              message:
                error instanceof Error
                  ? error.message
                  : "Unknown error",
            },
        });
      }
    }

    return NextResponse.json({
      results,
    });
  } catch (error) {
    console.error(
      "Failed to test recurring transactions:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to test recurring transactions.",
      },
      {
        status: 500,
      },
    );
  }
}
