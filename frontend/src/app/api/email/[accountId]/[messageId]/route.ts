import { NextRequest, NextResponse } from "next/server";

import { decrypt } from "@/lib/crypto/encryption";
import {
  archiveGmailMessage,
  createGmailReplyDraft,
  getGmailMessage,
  setGmailMessageReadState,
} from "@/lib/providers/google/gmail";
import type { GoogleCredentialPayload } from "@/lib/providers/google/provider";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getGoogleCredentials(accountId: string) {
  const integration = await prisma.integration.findUnique({
    where: {
      id: accountId,
    },
    include: {
      credential: true,
    },
  });

  if (
    !integration ||
    integration.provider !== "GOOGLE" ||
    !integration.credential
  ) {
    return null;
  }

  const credentials = JSON.parse(
    decrypt(integration.credential.encryptedPayload),
  ) as GoogleCredentialPayload;

  return {
    integration,
    credentials,
  };
}

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      accountId: string;
      messageId: string;
    }>;
  },
) {
  try {
    const { accountId, messageId } = await context.params;

    const result = await getGoogleCredentials(accountId);

    if (!result) {
      return NextResponse.json(
        {
          error: "Google account not found.",
        },
        {
          status: 404,
        },
      );
    }

    const message = await getGmailMessage(
      result.credentials,
      result.integration.id,
      messageId,
    );

    return NextResponse.json({
      account: {
        id: result.integration.id,
        email: result.integration.email,
        displayName: result.integration.displayName,
      },
      message,
    });
  } catch (error) {
    console.error("Failed to load Gmail message:", error);

    return NextResponse.json(
      {
        error: "Failed to load Gmail message.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{
      accountId: string;
      messageId: string;
    }>;
  },
) {
  try {
    const { accountId, messageId } = await context.params;

    const body = (await request.json()) as {
      action?:
        | "mark_read"
        | "mark_unread"
        | "create_draft";
      to?: string;
      subject?: string;
      body?: string;
      threadId?: string | null;
    };

    const result = await getGoogleCredentials(accountId);

    if (!result) {
      return NextResponse.json(
        {
          error: "Google account not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      body.action === "mark_read" ||
      body.action === "mark_unread"
    ) {
      await setGmailMessageReadState(
        result.credentials,
        result.integration.id,
        messageId,
        body.action === "mark_read",
      );

      return NextResponse.json({
        updated: true,
        isUnread: body.action === "mark_unread",
      });
    }

    if (body.action === "create_draft") {
      if (
        !body.to?.trim() ||
        !body.subject?.trim() ||
        !body.body?.trim()
      ) {
        return NextResponse.json(
          {
            error:
              "Reply recipient, subject, and message are required.",
          },
          {
            status: 400,
          },
        );
      }

      const draft = await createGmailReplyDraft(
        result.credentials,
        result.integration.id,
        {
          to: body.to.trim(),
          subject: body.subject.trim(),
          body: body.body,
          threadId: body.threadId ?? null,
        },
      );

      return NextResponse.json({
        created: true,
        draft,
      });
    }

    return NextResponse.json(
      {
        error: "Invalid Gmail action.",
      },
      {
        status: 400,
      },
    );
  } catch (error) {
    console.error("Failed to update Gmail message:", error);

    return NextResponse.json(
      {
        error: "Failed to update Gmail message.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: {
    params: Promise<{
      accountId: string;
      messageId: string;
    }>;
  },
) {
  try {
    const { accountId, messageId } = await context.params;

    const result = await getGoogleCredentials(accountId);

    if (!result) {
      return NextResponse.json(
        {
          error: "Google account not found.",
        },
        {
          status: 404,
        },
      );
    }

    await archiveGmailMessage(
      result.credentials,
      result.integration.id,
      messageId,
    );

    return NextResponse.json({
      archived: true,
    });
  } catch (error) {
    console.error("Failed to archive Gmail message:", error);

    return NextResponse.json(
      {
        error: "Failed to archive Gmail message.",
      },
      {
        status: 500,
      },
    );
  }
}
