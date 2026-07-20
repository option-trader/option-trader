// AES-256-GCM encryption for tokens at rest (server-side only).
// ENCRYPTION_SECRET must be a 64-char hex string (32 bytes):
//   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
import crypto from "crypto";

function getKey() {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret || secret.length !== 64) {
    throw new Error("ENCRYPTION_SECRET must be a 64-char hex string (32 bytes)");
  }
  return Buffer.from(secret, "hex");
}

export function isEncryptionConfigured() {
  const s = process.env.ENCRYPTION_SECRET;
  return !!s && s.length === 64;
}

export function encrypt(plaintext) {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decrypt(payload) {
  const key = getKey();
  const [ivHex, tagHex, dataHex] = payload.split(":");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([decipher.update(Buffer.from(dataHex, "hex")), decipher.final()]).toString("utf8");
}
