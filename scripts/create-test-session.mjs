import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import crypto from "node:crypto";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const email = process.env.TEST_USER_EMAIL ?? "test@example.com";
const name = process.env.TEST_USER_NAME ?? "Test User";

const sessionToken = crypto.randomBytes(32).toString("hex");
const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

const user = await prisma.user.upsert({
  where: { email },
  create: { email, name },
  update: { name },
  select: { id: true, email: true },
});

await prisma.session.create({
  data: { sessionToken, userId: user.id, expires },
  select: { id: true },
});

console.log(JSON.stringify({ email: user.email, sessionToken, expires: expires.toISOString() }));

await prisma.$disconnect();
await pool.end();

