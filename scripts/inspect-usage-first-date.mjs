import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const apiKeyId = process.env.API_KEY_ID;
if (!apiKeyId) throw new Error("API_KEY_ID is required");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const r = await prisma.usageRecord.findFirst({
  where: { apiKeyId },
  orderBy: { date: "asc" },
  select: { date: true },
});

console.log(JSON.stringify({ apiKeyId, firstDateIso: r?.date.toISOString() ?? null }));

await prisma.$disconnect();
await pool.end();

