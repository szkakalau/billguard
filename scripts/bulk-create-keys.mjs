import "dotenv/config";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const count = Number(process.env.BULK_COUNT ?? 50);
const email = process.env.BULK_USER_EMAIL ?? "bulk@example.com";
const namePrefix = process.env.BULK_NAME_PREFIX ?? "bulk";

function getEncryptionKey() {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error("ENCRYPTION_KEY is required");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("ENCRYPTION_KEY must be 32 bytes base64");
  return key;
}

function encryptString(plaintext) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(Buffer.from(plaintext, "utf8")), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { ciphertext: new Uint8Array(ciphertext), iv: new Uint8Array(iv), tag: new Uint8Array(tag) };
}

function hashSecret(secret) {
  return crypto.createHash("sha256").update(secret, "utf8").digest("hex");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const user = await prisma.user.upsert({
  where: { email },
  create: { email, name: email.split("@")[0] },
  update: {},
  select: { id: true, email: true },
});

const apiKeysData = [];
const alertRulesData = [];

for (let i = 0; i < count; i++) {
  const plaintextKey = `ok-bulk-${Date.now()}-${i}-${crypto.randomBytes(4).toString("hex")}`;
  const enc = encryptString(plaintextKey);
  const keyHash = hashSecret(plaintextKey);
  const id = crypto.randomUUID();
  const name = `${namePrefix}-${i + 1}`;

  apiKeysData.push({
    id,
    userId: user.id,
    name,
    provider: "openai",
    ciphertext: enc.ciphertext,
    iv: enc.iv,
    tag: enc.tag,
    keyHash,
    status: "active",
  });

  alertRulesData.push({
    apiKeyId: id,
    userId: user.id,
    dailyBudgetUsd: "999",
    monthlyBudgetUsd: "999",
    notifyEmailEnabled: false,
  });
}

await prisma.apiKey.createMany({ data: apiKeysData, skipDuplicates: true });
await prisma.alertRule.createMany({ data: alertRulesData, skipDuplicates: true });

console.log(JSON.stringify({ created: count, email: user.email }));

await prisma.$disconnect();
await pool.end();

