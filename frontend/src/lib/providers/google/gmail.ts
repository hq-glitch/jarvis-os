import { google, gmail_v1 } from "googleapis";

import {
  attachGoogleTokenPersistence,
  createGoogleOAuthClient,
} from "@/lib/providers/google/oauth";
import type { GoogleCredentialPayload } from "@/lib/providers/google/provider";

export interface NormalizedGmailMessage {
  externalId: string;
  threadId: string | null;
  subject: string;
  from: string | null;
  to: string | null;
  date: Date | null;
  snippet: string | null;
  isUnread: boolean;
  labels: string[];
}

function getHeader(
  headers: gmail_v1.Schema$MessagePartHeader[] | undefined,
  name: string,
): string | null {
  const header = headers?.find(
    (item) => item.name?.toLowerCase() === name.toLowerCase(),
  );

  return header?.value ?? null;
}

export async function listGmailMessages(
  credentials: GoogleCredentialPayload,
  integrationId: string,
  options?: {
    maxResults?: number;
    query?: string;
  },
): Promise<NormalizedGmailMessage[]> {
  const client = createGoogleOAuthClient();

  attachGoogleTokenPersistence(
    client,
    integrationId,
    credentials,
  );

  client.setCredentials({
    access_token: credentials.accessToken,
    refresh_token: credentials.refreshToken,
    expiry_date: credentials.expiresAt,
    scope: credentials.scope ?? undefined,
    token_type: credentials.tokenType ?? undefined,
  });

  const gmail = google.gmail({
    version: "v1",
    auth: client,
  });

  const response = await gmail.users.messages.list({
    userId: "me",
    maxResults: options?.maxResults ?? 50,
    q: options?.query,
  });

  const items = (response.data.messages ?? []).filter(
    (item): item is typeof item & { id: string } => Boolean(item.id),
  );

  const messages = await Promise.all(
    items.map(async (item): Promise<NormalizedGmailMessage> => {
      const message = await gmail.users.messages.get({
        userId: "me",
        id: item.id,
        format: "metadata",
        metadataHeaders: ["Subject", "From", "To", "Date"],
      });

      const headers = message.data.payload?.headers;

      const rawDate = getHeader(headers, "Date");
      const parsedDate = rawDate ? new Date(rawDate) : null;

      return {
        externalId: message.data.id ?? item.id,
        threadId: message.data.threadId ?? null,
        subject: getHeader(headers, "Subject") ?? "(No subject)",
        from: getHeader(headers, "From"),
        to: getHeader(headers, "To"),
        date:
          parsedDate && !Number.isNaN(parsedDate.getTime())
            ? parsedDate
            : null,
        snippet: message.data.snippet ?? null,
        isUnread: message.data.labelIds?.includes("UNREAD") ?? false,
        labels: message.data.labelIds ?? [],
      };
    }),
  );

  return messages;
}

export interface NormalizedGmailMessageDetail
  extends NormalizedGmailMessage {
  cc: string | null;
  bodyText: string | null;
  bodyHtml: string | null;
}

function decodeGmailBody(data: string | null | undefined): string | null {
  if (!data) {
    return null;
  }

  try {
    return Buffer.from(data, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

function findMessageBody(
  part: gmail_v1.Schema$MessagePart | undefined,
  mimeType: "text/plain" | "text/html",
): string | null {
  if (!part) {
    return null;
  }

  if (part.mimeType === mimeType && part.body?.data) {
    return decodeGmailBody(part.body.data);
  }

  for (const child of part.parts ?? []) {
    const result = findMessageBody(child, mimeType);

    if (result) {
      return result;
    }
  }

  return null;
}

export async function getGmailMessage(
  credentials: GoogleCredentialPayload,
  integrationId: string,
  messageId: string,
): Promise<NormalizedGmailMessageDetail> {
  const client = createGoogleOAuthClient();

  attachGoogleTokenPersistence(
    client,
    integrationId,
    credentials,
  );

  client.setCredentials({
    access_token: credentials.accessToken,
    refresh_token: credentials.refreshToken,
    expiry_date: credentials.expiresAt,
    scope: credentials.scope ?? undefined,
    token_type: credentials.tokenType ?? undefined,
  });

  const gmail = google.gmail({
    version: "v1",
    auth: client,
  });

  const response = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });

  const message = response.data;
  const headers = message.payload?.headers;

  const rawDate = getHeader(headers, "Date");
  const parsedDate = rawDate ? new Date(rawDate) : null;

  let bodyText = findMessageBody(message.payload, "text/plain");
  let bodyHtml = findMessageBody(message.payload, "text/html");

  if (!bodyText && !bodyHtml && message.payload?.body?.data) {
    const body = decodeGmailBody(message.payload.body.data);

    if (message.payload.mimeType === "text/html") {
      bodyHtml = body;
    } else {
      bodyText = body;
    }
  }

  return {
    externalId: message.id ?? messageId,
    threadId: message.threadId ?? null,
    subject: getHeader(headers, "Subject") ?? "(No subject)",
    from: getHeader(headers, "From"),
    to: getHeader(headers, "To"),
    cc: getHeader(headers, "Cc"),
    date:
      parsedDate && !Number.isNaN(parsedDate.getTime())
        ? parsedDate
        : null,
    snippet: message.snippet ?? null,
    isUnread: message.labelIds?.includes("UNREAD") ?? false,
    labels: message.labelIds ?? [],
    bodyText,
    bodyHtml,
  };
}

export async function setGmailMessageReadState(
  credentials: GoogleCredentialPayload,
  integrationId: string,
  messageId: string,
  isRead: boolean,
) {
  const client = createGoogleOAuthClient();

  attachGoogleTokenPersistence(
    client,
    integrationId,
    credentials,
  );

  client.setCredentials({
    access_token: credentials.accessToken,
    refresh_token: credentials.refreshToken,
    expiry_date: credentials.expiresAt,
    scope: credentials.scope ?? undefined,
    token_type: credentials.tokenType ?? undefined,
  });

  const gmail = google.gmail({
    version: "v1",
    auth: client,
  });

  await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: isRead
      ? {
          removeLabelIds: ["UNREAD"],
        }
      : {
          addLabelIds: ["UNREAD"],
        },
  });
}

export async function archiveGmailMessage(
  credentials: GoogleCredentialPayload,
  integrationId: string,
  messageId: string,
) {
  const client = createGoogleOAuthClient();

  attachGoogleTokenPersistence(
    client,
    integrationId,
    credentials,
  );

  client.setCredentials({
    access_token: credentials.accessToken,
    refresh_token: credentials.refreshToken,
    expiry_date: credentials.expiresAt,
    scope: credentials.scope ?? undefined,
    token_type: credentials.tokenType ?? undefined,
  });

  const gmail = google.gmail({
    version: "v1",
    auth: client,
  });

  await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: {
      removeLabelIds: ["INBOX"],
    },
  });
}

export interface CreateGmailReplyDraftInput {
  to: string;
  subject: string;
  body: string;
  threadId?: string | null;
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export async function createGmailReplyDraft(
  credentials: GoogleCredentialPayload,
  integrationId: string,
  input: CreateGmailReplyDraftInput,
) {
  const client = createGoogleOAuthClient();

  attachGoogleTokenPersistence(
    client,
    integrationId,
    credentials,
  );

  client.setCredentials({
    access_token: credentials.accessToken,
    refresh_token: credentials.refreshToken,
    expiry_date: credentials.expiresAt,
    scope: credentials.scope ?? undefined,
    token_type: credentials.tokenType ?? undefined,
  });

  const gmail = google.gmail({
    version: "v1",
    auth: client,
  });

  const subject = input.subject
    .replace(/[\r\n]+/g, " ")
    .trim();

  const to = input.to
    .replace(/[\r\n]+/g, " ")
    .trim();

  const rawMessage = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    input.body,
  ].join("\r\n");

  const response = await gmail.users.drafts.create({
    userId: "me",
    requestBody: {
      message: {
        raw: encodeBase64Url(rawMessage),
        threadId: input.threadId ?? undefined,
      },
    },
  });

  if (!response.data.id) {
    throw new Error("Gmail did not return a draft ID.");
  }

  return {
    draftId: response.data.id,
    messageId: response.data.message?.id ?? null,
  };
}
