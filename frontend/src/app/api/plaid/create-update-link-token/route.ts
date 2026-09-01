import { NextRequest, NextResponse } from "next/server";

import { decrypt } from "@/lib/crypto/encryption";
import {
  plaidClient,
  plaidCountryCodes,
} from "@/lib/providers/plaid/client";

import { Products } from "plaid";
import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultUser } from "@/repositories/user-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      itemId?: string;
    };

    if (!body.itemId) {
      return NextResponse.json(
        {
          error: "Plaid Item ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const user = await getOrCreateDefaultUser();

    const item = await prisma.plaidItem.findFirst({
      where: {
        id: body.itemId,
        userId: user.id,
        status: "ACTIVE",
      },
    });

    if (!item) {
      return NextResponse.json(
        {
          error: "Plaid connection not found.",
        },
        {
          status: 404,
        },
      );
    }

    const accessToken = decrypt(
      item.encryptedAccessToken,
    );

    const response = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: user.id,
      },
      client_name: "Jarvis OS",
      country_codes: plaidCountryCodes,
      language: "en",
      access_token: accessToken,
      additional_consented_products: [
        Products.Liabilities,
      ],
    });

    return NextResponse.json({
      linkToken: response.data.link_token,
    });
  } catch (error: any) {
    console.error(
      "Failed to create Plaid update Link token:",
      error?.response?.data ?? error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to create Plaid consent update.",
        plaidError: error?.response?.data ?? null,
      },
      {
        status: 500,
      },
    );
  }
}
