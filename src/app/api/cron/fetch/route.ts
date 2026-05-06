import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { EncryptedPayload } from "@/lib/crypto";
import { decryptString } from "@/lib/crypto";
import { fetchDailyOrgCosts } from "@/lib/openai/usage";
import { evaluateCapAndNotify } from "@/lib/cap";

type CronActiveKey = { id: string } & EncryptedPayload;

type CronPerKeyResult =
  | { apiKeyId: string; ok: true; days: number }
  | { apiKeyId: string; ok: false; error: string };

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

function assertCronAuth(req: Request) {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && token && token === secret);
}

function startOfDayUtc(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let idx = 0;

  async function worker() {
    while (true) {
      const current = idx++;
      if (current >= items.length) return;
      results[current] = await fn(items[current]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export async function POST(req: Request) {
  if (!assertCronAuth(req)) return unauthorized();

  const now = new Date();
  const endTime = now;
  const startTime = new Date(endTime.getTime() - 30 * 24 * 60 * 60 * 1000);

  const keys = await prisma.apiKey.findMany({
    where: { status: "active" },
    select: {
      id: true,
      ciphertext: true,
      iv: true,
      tag: true,
    },
  });

  const startedAt = Date.now();

  const perKeyResults = await mapLimit<CronActiveKey, CronPerKeyResult>(
    keys as CronActiveKey[],
    5,
    async (k) => {
      try {
        const apiKey = decryptString({
          ciphertext: k.ciphertext,
          iv: k.iv,
          tag: k.tag,
        });

        const daily = await fetchDailyOrgCosts({
          apiKey,
          startTime,
          endTime,
          timeoutMs: 8000,
        });

        for (const d of daily) {
          const date = startOfDayUtc(d.date);
          await prisma.usageRecord.upsert({
            where: { apiKeyId_date: { apiKeyId: k.id, date } },
            create: {
              apiKeyId: k.id,
              date,
              costUsd: d.costUsd,
              raw: d.raw as never,
            },
            update: {
              costUsd: d.costUsd,
              raw: d.raw as never,
            },
          });
        }

        await evaluateCapAndNotify(k.id, now);

        return { apiKeyId: k.id, ok: true, days: daily.length };
      } catch (e) {
        return { apiKeyId: k.id, ok: false, error: (e as Error).message };
      }
    },
  );

  return NextResponse.json({
    ok: true,
    scannedKeys: keys.length,
    results: perKeyResults,
    elapsedMs: Date.now() - startedAt,
  });
}

