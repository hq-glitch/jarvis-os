import { NextRequest, NextResponse } from "next/server";

import { encrypt } from "@/lib/crypto/encryption";
import { plaidClient } from "@/lib/providers/plaid/client";
import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultUser } from "@/repositories/user-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function mapPlaidAccountType(
  type: string,
  subtype: string | null,
) {
  if (type === "depository") {
    if (subtype === "checking") {
      return "CHECKING";
    }

    if (subtype === "savings") {
      return "SAVINGS";
    }

    return "DEPOSITORY";
  }

  if (type === "credit") {
    return "CREDIT_CARD";
  }

  if (type === "loan") {
    if (subtype === "mortgage") {
      return "MORTGAGE";
    }

    return "LOAN";
  }

  if (type === "investment") {
    return "INVESTMENT";
  }

  return type.toUpperCase();
}

function isDebtAccount(type: string) {
  return type === "credit" || type === "loan";
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      publicToken?: string;
      institutionId?: string | null;
      institutionName?: string | null;
    };

    if (!body.publicToken) {
      return NextResponse.json(
        {
          error: "Plaid public token is required.",
        },
        {
          status: 400,
        },
      );
    }

    const user = await getOrCreateDefaultUser();

    const exchangeResponse =
      await plaidClient.itemPublicTokenExchange({
        public_token: body.publicToken,
      });

    const accessToken =
      exchangeResponse.data.access_token;

    const plaidItemId =
      exchangeResponse.data.item_id;

    const accountsResponse =
      await plaidClient.accountsGet({
        access_token: accessToken,
      });

    const plaidItem = await prisma.plaidItem.upsert({
      where: {
        plaidItemId,
      },
      update: {
        institutionId: body.institutionId ?? null,
        institutionName: body.institutionName ?? null,
        encryptedAccessToken: encrypt(accessToken),
        status: "ACTIVE",
        lastSyncedAt: new Date(),
        lastError: null,
      },
      create: {
        userId: user.id,
        plaidItemId,
        institutionId: body.institutionId ?? null,
        institutionName: body.institutionName ?? null,
        encryptedAccessToken: encrypt(accessToken),
        status: "ACTIVE",
        lastSyncedAt: new Date(),
      },
    });

    for (const account of accountsResponse.data.accounts) {
      const currentBalance =
        account.balances.current ?? 0;

      const debt = isDebtAccount(account.type);

      const accountType = mapPlaidAccountType(
        account.type,
        account.subtype ?? null,
      );

      await prisma.financialAccount.upsert({
        where: {
          plaidAccountId: account.account_id,
        },
        update: {
          name: account.name,
          institution:
            body.institutionName ??
            plaidItem.institutionName,
          accountType,
          isDebt: debt,
          currentBalance,
          plaidItemId: plaidItem.id,
          plaidMask: account.mask ?? null,
        },
        create: {
          userId: user.id,
          name: account.name,
          institution:
            body.institutionName ??
            plaidItem.institutionName,
          accountType,
          isDebt: debt,
          startingBalance: debt
            ? currentBalance
            : 0,
          currentBalance,
          plaidItemId: plaidItem.id,
          plaidAccountId: account.account_id,
          plaidMask: account.mask ?? null,
        },
      });
    }

    return NextResponse.json({
      connected: true,
      itemId: plaidItem.id,
      accountCount:
        accountsResponse.data.accounts.length,
    });
  } catch (error) {
    console.error(
      "Failed to exchange Plaid public token:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to connect the financial institution.",
      },
      {
        status: 500,
      },
    );
  }
}
