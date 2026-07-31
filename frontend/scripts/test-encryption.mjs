import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

const encodedKey = process.env.JARVIS_ENCRYPTION_KEY;

if (!encodedKey) {
  throw new Error("JARVIS_ENCRYPTION_KEY is missing.");
}

const key = Buffer.from(encodedKey, "base64");

if (key.length !== 32) {
  throw new Error(
    "JARVIS_ENCRYPTION_KEY must decode to exactly 32 bytes."
  );
}

const original = JSON.stringify({
  accessToken: "test-access-token",
  refreshToken: "test-refresh-token",
  expiresAt: new Date().toISOString(),
});

const iv = randomBytes(12);

const cipher = createCipheriv("aes-256-gcm", key, iv, {
  authTagLength: 16,
});

const ciphertext = Buffer.concat([
  cipher.update(original, "utf8"),
  cipher.final(),
]);

const authTag = cipher.getAuthTag();

const decipher = createDecipheriv(
  "aes-256-gcm",
  key,
  iv,
  {
    authTagLength: 16,
  }
);

decipher.setAuthTag(authTag);

const decrypted = Buffer.concat([
  decipher.update(ciphertext),
  decipher.final(),
]).toString("utf8");

if (decrypted !== original) {
  throw new Error("Encryption round-trip failed.");
}

console.log("Encryption round-trip passed.");