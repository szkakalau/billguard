import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const apiKeyId = process.env.API_KEY_ID;
const daily = process.env.DAILY_BUDGET_USD ? Number(process.env.DAILY_BUDGET_USD) : null;
const monthly = process.env.MONTHLY_BUDGET_USD ? Number(process.env.MONTHLY_BUDGET_USD) : null;

if (!apiKeyId) {
  throw new Error("API_KEY_ID is required");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

await prisma.alertRule.update({
  where: { apiKeyId },
  data: {
    dailyBudgetUsd: daily,
    monthlyBudgetUsd: monthly,
  },
});

console.log(JSON.stringify({ apiKeyId, daily, monthly }));

await prisma.$disconnect();
await pool.end();

