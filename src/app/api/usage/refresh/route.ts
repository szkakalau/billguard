import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { EncryptedPayload } from "@/lib/crypto";
import { decryptString } from "@/lib/crypto";
import { fetchDailyOrgCosts } from "@/lib/openai/usage";
import { evaluateCapAndNotify } from "@/lib/cap";

function startOfDayUtc(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

type OwnedKeyWithSecret = { id: string; status: string } & EncryptedPayload;

export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { apiKeyId?: string } | null;
  if (!body?.apiKeyId) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const key = (await prisma.apiKey.findFirst({
    where: { id: body.apiKeyId, userId },
    select: { id: true, status: true, ciphertext: true, iv: true, tag: true },
  })) as OwnedKeyWithSecret | null;
  if (!key) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (key.status !== "active") {
    return NextResponse.json({ error: "key_not_active", status: key.status }, { status: 403 });
  }

  const apiKey = decryptString({ ciphertext: key.ciphertext, iv: key.iv, tag: key.tag });

  const now = new Date();
  const endTime = now;
  const startTime = new Date(endTime.getTime() - 30 * 24 * 60 * 60 * 1000);

  let daily;
  try {
    daily = await fetchDailyOrgCosts({
      apiKey,
      startTime,
      endTime,
      timeoutMs: 8000,
    });
  } catch (e) {
    const err = e as { name?: string; message?: string };
    const isAbort = err?.name === "AbortError";
    const message = (err?.message || "failed to fetch usage").slice(0, 500);

    await prisma.apiKey.update({
      where: { id: key.id },
      data: { lastTestedAt: new Date(), lastError: message },
    });

    return NextResponse.json(
      { ok: false, error: isAbort ? "timeout" : "upstream_error", message },
      { status: isAbort ? 504 : 502 },
    );
  }

  for (const d of daily) {
    const date = startOfDayUtc(d.date);
    await prisma.usageRecord.upsert({
      where: { apiKeyId_date: { apiKeyId: key.id, date } },
      create: { apiKeyId: key.id, date, costUsd: d.costUsd, raw: d.raw as never },
      update: { costUsd: d.costUsd, raw: d.raw as never },
    });
  }

  const cap = await evaluateCapAndNotify(key.id, now);

  return NextResponse.json({ ok: true, days: daily.length, cap });
}

