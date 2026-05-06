import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** Matches `usageRecord.findMany` select below (explicit for CI where Prisma inference can widen). */
type ExportCsvRow = {
  date: Date;
  costUsd: unknown;
  apiKey: { id: string; name: string };
};

function csvEscape(s: string) {
  // Prevent CSV formula injection in common spreadsheet apps
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  const needs = /[",\n]/.test(s);
  const escaped = s.replaceAll('"', '""');
  return needs ? `"${escaped}"` : escaped;
}

export async function GET(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const days = Math.min(Math.max(Number(url.searchParams.get("days") ?? "30") || 30, 1), 180);
  const apiKeyId = url.searchParams.get("apiKeyId");

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const records = (await prisma.usageRecord.findMany({
    where: {
      date: { gte: since },
      apiKey: {
        userId,
        ...(apiKeyId ? { id: apiKeyId } : {}),
      },
    },
    orderBy: [{ date: "asc" }],
    select: {
      date: true,
      costUsd: true,
      apiKey: { select: { id: true, name: true } },
    },
  })) as ExportCsvRow[];

  const lines = [
    ["date", "apiKeyId", "apiKeyName", "costUsd"].join(","),
    ...records.map((r) =>
      [
        r.date.toISOString().slice(0, 10),
        r.apiKey.id,
        csvEscape(r.apiKey.name),
        Number(r.costUsd).toFixed(4),
      ].join(","),
    ),
  ];

  return new NextResponse(lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"billguard-${days}d.csv\"`,
    },
  });
}

