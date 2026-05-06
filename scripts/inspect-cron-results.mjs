import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const onlyId = process.env.ONLY_API_KEY_ID ?? null;

const keys = await prisma.apiKey.findMany({
  where: onlyId ? { id: onlyId } : undefined,
  orderBy: { createdAt: "desc" },
  select: { id: true, name: true, status: true, createdAt: true },
});

const usageCounts = await prisma.usageRecord.groupBy({
  by: ["apiKeyId"],
  _count: { _all: true },
});

const byId = new Map(usageCounts.map((r) => [r.apiKeyId, r._count._all]));
const out = keys.map((k) => ({ ...k, usageRecords: byId.get(k.id) ?? 0 }));

console.log(JSON.stringify(out, null, 2));

await prisma.$disconnect();
await pool.end();

