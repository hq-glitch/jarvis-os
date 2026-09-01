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
    let updatedBills = 0;

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
          await plaidClient.liabilitiesGet({
            access_token: accessToken,
          });

        const creditLiabilities =
          response.data.liabilities.credit ?? [];

        for (const liability of creditLiabilities) {
          const account =
            await prisma.financialAccount.findFirst({
              where: {
                userId: user.id,
                plaidAccountId: liability.account_id,
              },
            });

          if (!account) {
            continue;
          }

          const purchaseApr =
            liability.aprs.find(
              (apr) =>
                apr.apr_type === "purchase_apr",
            ) ?? liability.aprs[0];

          const interestRate =
            purchaseApr?.apr_percentage ?? null;

          const minimumPayment =
            liability.minimum_payment_amount ?? null;

          await prisma.financialAccount.update({
            where: {
              id: account.id,
            },
            data: {
              interestRate,
              minimumPayment,
            },
          });

          updatedAccounts += 1;

          if (liability.next_payment_due_date) {
            const nextDueAt = new Date(
              `${liability.next_payment_due_date}T12:00:00`,
            );

            const dueDay = nextDueAt.getDate();

            const existingBill =
              await prisma.bill.findFirst({
                where: {
                  userId: user.id,
                  accountId: account.id,
                },
              });

            if (existingBill) {
              await prisma.bill.update({
                where: {
                  id: existingBill.id,
                },
                data: {
                  name: `${account.name} payment`,
                  amount: minimumPayment ?? 0,
                  frequency: "MONTHLY",
                  dueDay,
                  nextDueAt,
                  isActive: true,
                  notes:
                    "Synced automatically from Plaid Liabilities.",
                },
              });
            } else {
              await prisma.bill.create({
                data: {
                  userId: user.id,
                  accountId: account.id,
                  name: `${account.name} payment`,
                  amount: minimumPayment ?? 0,
                  frequency: "MONTHLY",
                  dueDay,
                  nextDueAt,
                  isAutopay: false,
                  isActive: true,
                  notes:
                    "Synced automatically from Plaid Liabilities.",
                },
              });
            }

            updatedBills += 1;
          }
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
      } catch (error: any) {
        const plaidError =
          error?.response?.data ?? null;

        const message =
          plaidError?.error_message ??
          (error instanceof Error
            ? error.message
            : "Unknown liabilities sync error.");

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
      updatedAccounts,
      updatedBills,
      errors,
    });
  } catch (error) {
    console.error(
      "Failed to sync Plaid liabilities:",
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to sync liabilities.",
      },
      {
        status: 500,
      },
    );
  }
}
