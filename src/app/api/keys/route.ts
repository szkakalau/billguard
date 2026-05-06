import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { encryptString, hashSecret, maskSecret } from "@/lib/crypto";

function asNonNegativeNumber(x: unknown): number | null {
  if (x === null || x === undefined) return null;
  if (typeof x !== "number") return null;
  if (!Number.isFinite(x)) return null;
  if (x < 0) return null;
  return x;
}

function isValidWebhookUrl(x: string): boolean {
  try {
    const u = new URL(x);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const keys = await prisma.apiKey.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      status: true,
      lastTestedAt: true,
      lastValidAt: true,
      lastError: true,
      createdAt: true,
      alertRule: {
        select: {
          dailyBudgetUsd: true,
          monthlyBudgetUsd: true,
          notifyEmailEnabled: true,
        },
      },
    },
  });

  return NextResponse.json({ keys });
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as
    | {
        name?: string;
        plaintextKey?: string;
        dailyBudgetUsd?: number | null;
        monthlyBudgetUsd?: number | null;
        notifyEmailEnabled?: boolean;
        slackWebhookUrl?: string | null;
      }
    | null;

  if (!body?.name || body.name.trim().length === 0 || !body.plaintextKey) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const dailyBudget = body.dailyBudgetUsd === null ? null : asNonNegativeNumber(body.dailyBudgetUsd);
  const monthlyBudget =
    body.monthlyBudgetUsd === null ? null : asNonNegativeNumber(body.monthlyBudgetUsd);

  if (body.dailyBudgetUsd !== undefined && body.dailyBudgetUsd !== null && dailyBudget === null) {
    return NextResponse.json({ error: "invalid_daily_budget" }, { status: 400 });
  }
  if (
    body.monthlyBudgetUsd !== undefined &&
    body.monthlyBudgetUsd !== null &&
    monthlyBudget === null
  ) {
    return NextResponse.json({ error: "invalid_monthly_budget" }, { status: 400 });
  }

  const slackUrl =
    body.slackWebhookUrl === null || body.slackWebhookUrl === undefined
      ? null
      : body.slackWebhookUrl.trim();
  if (slackUrl && !isValidWebhookUrl(slackUrl)) {
    return NextResponse.json({ error: "invalid_slack_webhook_url" }, { status: 400 });
  }

  const enc = encryptString(body.plaintextKey);
  const keyHash = hashSecret(body.plaintextKey);

  const slackEnc =
    slackUrl && slackUrl.length > 0
      ? encryptString(slackUrl)
      : null;

  let created: { id: string; name: string; status: string; createdAt: Date };
  try {
    created = await prisma.apiKey.create({
      data: {
        userId,
        name: body.name.trim(),
        ciphertext: enc.ciphertext,
        iv: enc.iv,
        tag: enc.tag,
        keyHash,
        alertRule: {
          create: {
            userId,
            dailyBudgetUsd: dailyBudget,
            monthlyBudgetUsd: monthlyBudget,
            notifyEmailEnabled: body.notifyEmailEnabled ?? true,
            slackWebhookCiphertext: slackEnc?.ciphertext,
            slackWebhookIv: slackEnc?.iv,
            slackWebhookTag: slackEnc?.tag,
          },
        },
      },
      select: { id: true, name: true, status: true, createdAt: true },
    });
  } catch (e) {
    const err = e as { code?: string };
    if (err.code === "P2002") {
      return NextResponse.json({ error: "duplicate_key" }, { status: 409 });
    }
    throw e;
  }

  // Lightweight validity check: just ensure OpenAI costs endpoint accepts the key
  try {
    const url = new URL("https://api.openai.com/v1/organization/costs");
    url.searchParams.set("start_time", String(Math.floor(Date.now() / 1000) - 86400));
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${body.plaintextKey}` },
      cache: "no-store",
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      await prisma.apiKey.update({
        where: { id: created.id },
        data: { lastTestedAt: new Date(), lastError: `${res.status} ${t}`.slice(0, 500) },
      });
    } else {
      await prisma.apiKey.update({
        where: { id: created.id },
        data: { lastTestedAt: new Date(), lastValidAt: new Date(), lastError: null },
      });
    }
  } catch (e) {
    await prisma.apiKey.update({
      where: { id: created.id },
      data: { lastTestedAt: new Date(), lastError: (e as Error).message.slice(0, 500) },
    });
  }

  return NextResponse.json({
    key: created,
    maskedKey: maskSecret(body.plaintextKey),
  });
}

