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

    let updatedAccounts = 0;
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

        const response = await plaidClient.accountsGet({
          access_token: accessToken,
        });

        for (const plaidAccount of response.data.accounts) {
          const currentBalance =
            plaidAccount.balances.current ?? 0;

          const result =
            await prisma.financialAccount.updateMany({
              where: {
                userId: user.id,
                plaidAccountId: plaidAccount.account_id,
              },
              data: {
                currentBalance,
                name: plaidAccount.name,
                plaidMask: plaidAccount.mask ?? null,
              },
            });

          updatedAccounts += result.count;
        }

        await prisma.plaidItem.update({
          where: {
            id: item.id,
          },
          data: {
            lastSyncedAt: new Date(),
            lastError: null,
          },
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unknown Plaid sync error.";

        errors.push({
          itemId: item.id,
          institution: item.institutionName,
          error: message,
        });

        await prisma.plaidItem.update({
          where: {
            id: item.id,
          },
          data: {
            lastError: message,
          },
        });
      }
    }

    return NextResponse.json({
      synced: true,
      itemCount: items.length,
      updatedAccounts,
      errors,
    });
  } catch (error) {
    console.error(
      "Failed to sync Plaid balances:",
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to sync account balances.",
      },
      {
        status: 500,
      },
    );
  }
}
