import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { EncryptedPayload } from "@/lib/crypto";
import { decryptString } from "@/lib/crypto";
import { fetchDailyOrgCosts } from "@/lib/openai/usage";

type OwnedKeyWithSecret = { id: string; status: string } & EncryptedPayload;

export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as
    | {
        apiKeyId?: string;
        days?: number;
      }
    | null;

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
  const days = Math.min(Math.max(body.days ?? 2, 1), 90);
  const endTime = now;
  const startTime = new Date(endTime.getTime() - days * 24 * 60 * 60 * 1000);

  const daily = await fetchDailyOrgCosts({ apiKey, startTime, endTime, timeoutMs: 8000 });
  return NextResponse.json({ ok: true, days: daily.length, daily });
}

