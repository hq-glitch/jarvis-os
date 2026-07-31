import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const PAYLOAD_VERSION = "v1";

function getEncryptionKey(): Buffer {
  const encodedKey = process.env.JARVIS_ENCRYPTION_KEY;

  if (!encodedKey) {
    throw new Error(
      "JARVIS_ENCRYPTION_KEY is not configured."
    );
  }

  const key = Buffer.from(encodedKey, "base64");

  if (key.length !== 32) {
    throw new Error(
      "JARVIS_ENCRYPTION_KEY must decode to exactly 32 bytes."
    );
  }

  return key;
}

export function encrypt(value: string): string {
  if (!value) {
    throw new Error("Cannot encrypt an empty value.");
  }

  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const ciphertext = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    PAYLOAD_VERSION,
    iv.toString("base64"),
    authTag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(".");
}

export function decrypt(payload: string): string {
  const [version, encodedIv, encodedAuthTag, encodedCiphertext] =
    payload.split(".");

  if (
    version !== PAYLOAD_VERSION ||
    !encodedIv ||
    !encodedAuthTag ||
    !encodedCiphertext
  ) {
    throw new Error("Encrypted payload has an invalid format.");
  }

  const key = getEncryptionKey();
  const iv = Buffer.from(encodedIv, "base64");
  const authTag = Buffer.from(encodedAuthTag, "base64");
  const ciphertext = Buffer.from(encodedCiphertext, "base64");

  if (iv.length !== IV_LENGTH) {
    throw new Error("Encrypted payload contains an invalid IV.");
  }

  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error(
      "Encrypted payload contains an invalid authentication tag."
    );
  }

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  decipher.setAuthTag(authTag);

  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return plaintext.toString("utf8");
}