import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DashboardCharts } from "@/app/dashboard/DashboardCharts";

/** Matches usageRecord select below (explicit when Prisma inference widens on CI). */
type DashboardUsageRow = {
  date: Date;
  costUsd: unknown;
  apiKey: { id: string; name: string };
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const userId = (session.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login");

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const records = (await prisma.usageRecord.findMany({
    where: {
      date: { gte: since },
      apiKey: { userId },
    },
    select: {
      date: true,
      costUsd: true,
      apiKey: { select: { name: true, id: true } },
    },
    orderBy: [{ date: "asc" }],
  })) as DashboardUsageRow[];

  const dailyMap = new Map<string, number>();
  const byKeyMap = new Map<string, number>();

  for (const r of records) {
    const d = r.date.toISOString().slice(0, 10);
    dailyMap.set(d, (dailyMap.get(d) ?? 0) + Number(r.costUsd));
    byKeyMap.set(r.apiKey.name, (byKeyMap.get(r.apiKey.name) ?? 0) + Number(r.costUsd));
  }

  const daily = Array.from(dailyMap.entries()).map(([date, costUsd]) => ({
    date,
    costUsd: Number(costUsd.toFixed(4)),
  }));
  const byKey = Array.from(byKeyMap.entries())
    .map(([name, costUsd]) => ({ name, costUsd: Number(costUsd.toFixed(4)) }))
    .sort((a, b) => b.costUsd - a.costUsd)
    .slice(0, 6);

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">仪表盘</h1>
            <p className="mt-1 text-sm text-zinc-600">
              你好，{session?.user?.name ?? session?.user?.email ?? "用户"}。
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/keys"
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50"
            >
              管理 Keys
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <DashboardCharts daily={daily} byKey={byKey} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href="/api/export.csv?days=30"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50"
          >
            导出 CSV（30 天）
          </a>
        </div>
      </div>
    </div>
  );
}

