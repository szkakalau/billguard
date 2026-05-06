"use client";

import { useEffect, useMemo, useState } from "react";

type ApiKeyRow = {
  id: string;
  name: string;
  status: "active" | "capped" | "disabled";
  lastTestedAt: string | null;
  lastValidAt: string | null;
  lastError: string | null;
  createdAt: string;
  alertRule: {
    dailyBudgetUsd: string | null;
    monthlyBudgetUsd: string | null;
    notifyEmailEnabled: boolean;
    slackWebhookCiphertext: unknown | null;
  } | null;
};

export function KeysClient() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [maskedKey, setMaskedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [plaintextKey, setPlaintextKey] = useState("");
  const [dailyBudgetUsd, setDailyBudgetUsd] = useState<string>("");
  const [monthlyBudgetUsd, setMonthlyBudgetUsd] = useState<string>("");
  const [slackWebhookUrl, setSlackWebhookUrl] = useState<string>("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/keys", { cache: "no-store" });
      const json = (await res.json()) as { keys?: ApiKeyRow[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? "failed");
      setKeys(json.keys ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(t);
  }, []);

  const canSubmit = useMemo(() => name.trim() && plaintextKey.trim(), [name, plaintextKey]);

  async function onCreate() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    setMaskedKey(null);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          plaintextKey,
          dailyBudgetUsd: dailyBudgetUsd ? Number(dailyBudgetUsd) : null,
          monthlyBudgetUsd: monthlyBudgetUsd ? Number(monthlyBudgetUsd) : null,
          slackWebhookUrl: slackWebhookUrl ? slackWebhookUrl : null,
        }),
      });
      const json = (await res.json()) as { maskedKey?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? "failed");
      setMaskedKey(json.maskedKey ?? null);
      setName("");
      setPlaintextKey("");
      setDailyBudgetUsd("");
      setMonthlyBudgetUsd("");
      setSlackWebhookUrl("");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function refresh(apiKeyId: string) {
    setError(null);
    try {
      const res = await fetch("/api/usage/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKeyId }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "failed");
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="mt-8 grid gap-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="text-sm font-medium text-zinc-900">新增 API Key</div>
        <div className="mt-4 grid gap-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-xs text-zinc-600">名称</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
                placeholder="例如：主账号"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs text-zinc-600">Slack Webhook（可选）</span>
              <input
                value={slackWebhookUrl}
                onChange={(e) => setSlackWebhookUrl(e.target.value)}
                className="rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
                placeholder="https://hooks.slack.com/..."
              />
            </label>
          </div>

          <label className="grid gap-1">
            <span className="text-xs text-zinc-600">OpenAI API Key</span>
            <input
              value={plaintextKey}
              onChange={(e) => setPlaintextKey(e.target.value)}
              className="rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
              placeholder="sk-..."
            />
          </label>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-xs text-zinc-600">日预算（USD，可选）</span>
              <input
                value={dailyBudgetUsd}
                onChange={(e) => setDailyBudgetUsd(e.target.value)}
                className="rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
                placeholder="例如：5"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs text-zinc-600">月预算（USD，可选）</span>
              <input
                value={monthlyBudgetUsd}
                onChange={(e) => setMonthlyBudgetUsd(e.target.value)}
                className="rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
                placeholder="例如：100"
              />
            </label>
          </div>

          <button
            type="button"
            disabled={!canSubmit || submitting}
            onClick={onCreate}
            className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitting ? "提交中…" : "保存（加密存储）"}
          </button>

          {maskedKey && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              已保存。请自行妥善保存明文 Key（仅展示一次）：<span className="font-mono">{maskedKey}</span>
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-zinc-900">已添加的 Keys</div>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50"
          >
            刷新列表
          </button>
        </div>

        {loading ? (
          <div className="mt-4 text-sm text-zinc-600">加载中…</div>
        ) : keys.length === 0 ? (
          <div className="mt-4 text-sm text-zinc-600">还没有任何 Key。</div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs text-zinc-600">
                <tr>
                  <th className="py-2 pr-4">名称</th>
                  <th className="py-2 pr-4">状态</th>
                  <th className="py-2 pr-4">最后校验</th>
                  <th className="py-2 pr-4">动作</th>
                </tr>
              </thead>
              <tbody className="text-zinc-900">
                {keys.map((k) => (
                  <tr key={k.id} className="border-t border-zinc-100">
                    <td className="py-3 pr-4">{k.name}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={
                          k.status === "active"
                            ? "rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-800"
                            : k.status === "capped"
                              ? "rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-800"
                              : "rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-700"
                        }
                      >
                        {k.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-xs text-zinc-600">
                      {k.lastTestedAt ? new Date(k.lastTestedAt).toLocaleString() : "—"}
                      {k.lastError ? (
                        <div className="mt-1 max-w-lg truncate text-red-700">{k.lastError}</div>
                      ) : null}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void refresh(k.id)}
                          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium hover:bg-zinc-50"
                        >
                          立即刷新用量
                        </button>
                        <a
                          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium hover:bg-zinc-50"
                          href={`/api/export.csv?days=30&apiKeyId=${encodeURIComponent(k.id)}`}
                        >
                          导出 CSV
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

