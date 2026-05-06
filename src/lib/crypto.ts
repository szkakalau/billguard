import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const ALGO = "aes-256-gcm";
const IV_LENGTH = 12;

function getEncryptionKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error("ENCRYPTION_KEY is required");

  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be 32 bytes (base64-encoded)");
  }
  return key;
}

export type EncryptedPayload = {
  ciphertext: Uint8Array<ArrayBuffer>;
  iv: Uint8Array<ArrayBuffer>;
  tag: Uint8Array<ArrayBuffer>;
};

export function encryptString(plaintext: string): EncryptedPayload {
  const ivBuf = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGO, getEncryptionKey(), ivBuf);

  const ciphertextBuf = Buffer.concat([
    cipher.update(Buffer.from(plaintext, "utf8")),
    cipher.final(),
  ]);
  const tagBuf = cipher.getAuthTag();

  const ciphertext = Uint8Array.from(ciphertextBuf);
  const iv = Uint8Array.from(ivBuf);
  const tag = Uint8Array.from(tagBuf);

  return { ciphertext, iv, tag };
}

export function decryptString(payload: EncryptedPayload): string {
  const decipher = createDecipheriv(
    ALGO,
    getEncryptionKey(),
    Buffer.from(payload.iv),
  );
  decipher.setAuthTag(Buffer.from(payload.tag));

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext)),
    decipher.final(),
  ]);

  return plaintext.toString("utf8");
}

export function hashSecret(secret: string): string {
  return createHash("sha256").update(secret, "utf8").digest("hex");
}

export function maskSecret(secret: string): string {
  const last = secret.slice(-4);
  return `sk-…${last}`;
}

