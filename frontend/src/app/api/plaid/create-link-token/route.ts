import { NextResponse } from "next/server";

import {
  plaidClient,
  plaidCountryCodes,
  plaidProducts,
} from "@/lib/providers/plaid/client";
import { getOrCreateDefaultUser } from "@/repositories/user-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const user = await getOrCreateDefaultUser();

    const response = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: user.id,
      },
      client_name: "Jarvis OS",
      products: plaidProducts,
      country_codes: plaidCountryCodes,
      language: "en",
    });

    return NextResponse.json({
      linkToken: response.data.link_token,
      expiration: response.data.expiration,
    });
  } catch (error: any) {
    console.error(
      "Failed to create Plaid Link token:",
      error?.response?.data ?? error,
    );

    return NextResponse.json(
      {
        error: "Failed to create Plaid Link token.",
        plaidError: error?.response?.data ?? null,
      },
      {
        status: 500,
      },
    );
  }
}
