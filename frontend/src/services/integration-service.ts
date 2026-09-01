import { randomBytes } from "node:crypto";
import { encrypt } from "@/lib/crypto/encryption";
import {
  type AppleCredentials,
  listAppleCalendars,
} from "@/lib/providers/apple/provider";
import { createGoogleAuthorizationUrl } from "@/lib/providers/google/oauth";
import {
  exchangeGoogleAuthorizationCode,
  getGoogleAccountProfile,
  listGoogleCalendars,
} from "@/lib/providers/google/provider";
import {
  createGoogleOAuthState,
  consumeGoogleOAuthState,
  deleteExpiredOAuthStates,
} from "@/repositories/oauth-state-repository";
import {
  getIntegrations,
  upsertAppleCalendar,
  upsertAppleIntegration,
  upsertGoogleCalendar,
  upsertGoogleIntegration,
} from "@/repositories/integration-repository";
import {
  getOrCreateDefaultUser,
} from "@/repositories/user-repository";

const OAUTH_STATE_LIFETIME_MINUTES = 10;

export async function createGoogleConnectionUrl(
  redirectPath = "/calendar/connect",
) {
  const user = await getOrCreateDefaultUser();

  await deleteExpiredOAuthStates();

  const state = randomBytes(32).toString("base64url");

  const expiresAt = new Date(
    Date.now() + OAUTH_STATE_LIFETIME_MINUTES * 60 * 1000,
  );

  await createGoogleOAuthState({
    state,
    userId: user.id,
    redirectPath,
    expiresAt,
  });

  return createGoogleAuthorizationUrl(state);
}

export async function completeGoogleConnection(
  code: string,
  state: string,
) {
  const oauthState = await consumeGoogleOAuthState(state);

  if (!oauthState) {
    throw new Error(
      "The Google connection request is invalid or has expired.",
    );
  }

  const credentials =
    await exchangeGoogleAuthorizationCode(code);

  const profile = await getGoogleAccountProfile(credentials);

  const encryptedPayload = encrypt(
    JSON.stringify(credentials),
  );

  const integration = await upsertGoogleIntegration({
    userId: oauthState.userId,
    providerAccountId: profile.providerAccountId,
    email: profile.email,
    displayName: profile.displayName,
    encryptedCredentialPayload: encryptedPayload,
  });

  const calendars = await listGoogleCalendars(credentials);

  for (const calendar of calendars) {
    await upsertGoogleCalendar({
      integrationId: integration.id,
      userId: oauthState.userId,
      externalId: calendar.externalId,
      name: calendar.name,
      description: calendar.description,
      timeZone: calendar.timeZone,
      providerColor: calendar.providerColor,
      accessRole: calendar.accessRole,
      isPrimary: calendar.isPrimary,
      isReadOnly: calendar.isReadOnly,
    });
  }

  return {
    integration,
    importedCalendarCount: calendars.length,
    redirectPath:
      oauthState.redirectPath ?? "/calendar/connect",
  };
}

export async function completeAppleConnection(
  appleUsername: string,
  appSpecificPassword: string,
) {
  const username = appleUsername.trim().toLowerCase();
  const password = appSpecificPassword.trim();

  if (!username || !password) {
    throw new Error(
      "Apple Account email and app-specific password are required.",
    );
  }

  const credentials: AppleCredentials = {
    username,
    appSpecificPassword: password,
  };

  /*
   * This request also verifies the credentials. iCloud will reject
   * invalid credentials before returning the calendar list.
   */
  const calendars = await listAppleCalendars(credentials);

  const user = await getOrCreateDefaultUser();

  const encryptedPayload = encrypt(
    JSON.stringify(credentials),
  );

  const integration = await upsertAppleIntegration({
    userId: user.id,
    providerAccountId: username,
    email: username,
    displayName: "iCloud",
    encryptedCredentialPayload: encryptedPayload,
  });

  for (const calendar of calendars) {
    await upsertAppleCalendar({
      integrationId: integration.id,
      userId: user.id,
      externalId: calendar.externalId,
      name: calendar.name,
      description: calendar.description,
      timeZone: calendar.timeZone,
      providerColor: calendar.providerColor,
      isReadOnly: calendar.isReadOnly,
    });
  }

  return {
    integration,
    importedCalendarCount: calendars.length,
  };
}

export async function listConnectedIntegrations() {
  const user = await getOrCreateDefaultUser();

  return getIntegrations(user.id);
}