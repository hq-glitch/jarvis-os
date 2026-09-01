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
          await plaidClient.liabilitiesGet({
            access_token: accessToken,
          });

        results.push({
          itemId: item.id,
          institution: item.institutionName,
          success: true,
          creditCount:
            response.data.liabilities.credit?.length ?? 0,
          mortgageCount:
            response.data.liabilities.mortgage?.length ?? 0,
          studentCount:
            response.data.liabilities.student?.length ?? 0,
          credit: response.data.liabilities.credit ?? [],
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
      "Failed to test Plaid liabilities:",
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to test Plaid liabilities.",
      },
      {
        status: 500,
      },
    );
  }
}
