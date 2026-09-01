import { google } from "googleapis";
import { encrypt } from "@/lib/crypto/encryption";
import { updateIntegrationCredential } from "@/repositories/integration-repository";
import type { GoogleCredentialPayload } from "@/lib/providers/google/provider";

const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/gmail.modify",
];

function requireEnvironmentVariable(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

export function createGoogleOAuthClient() {
  return new google.auth.OAuth2(
    requireEnvironmentVariable("GOOGLE_CLIENT_ID"),
    requireEnvironmentVariable("GOOGLE_CLIENT_SECRET"),
    requireEnvironmentVariable("GOOGLE_REDIRECT_URI")
  );
}

export function createGoogleAuthorizationUrl(state: string): string {
  const client = createGoogleOAuthClient();

  return client.generateAuthUrl({
    access_type: "offline",
    include_granted_scopes: true,
    prompt: "consent select_account",
    scope: GOOGLE_SCOPES,
    state,
  });
}

export function attachGoogleTokenPersistence(
  client: ReturnType<typeof createGoogleOAuthClient>,
  integrationId: string,
  currentCredentials: GoogleCredentialPayload,
) {
  client.on("tokens", async (tokens) => {
    try {
      const nextCredentials: GoogleCredentialPayload = {
        accessToken:
          tokens.access_token ??
          currentCredentials.accessToken,
        refreshToken:
          tokens.refresh_token ??
          currentCredentials.refreshToken,
        expiresAt:
          tokens.expiry_date ??
          currentCredentials.expiresAt,
        scope:
          tokens.scope ??
          currentCredentials.scope,
        tokenType:
          tokens.token_type ??
          currentCredentials.tokenType,
      };

      await updateIntegrationCredential(
        integrationId,
        encrypt(JSON.stringify(nextCredentials)),
      );

      Object.assign(currentCredentials, nextCredentials);
    } catch (error) {
      console.error(
        `Unable to persist refreshed Google credentials for ${integrationId}:`,
        error,
      );
    }
  });
}
