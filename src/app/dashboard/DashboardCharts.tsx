"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type DailyPoint = { date: string; costUsd: number };
type PiePoint = { name: string; costUsd: number };

const PIE_COLORS = [
  "#111827",
  "#2563eb",
  "#059669",
  "#7c3aed",
  "#d97706",
  "#dc2626",
];

export function DashboardCharts(props: {
  daily: DailyPoint[];
  byKey: PiePoint[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="text-sm font-medium text-zinc-900">过去 30 天游览</div>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={props.daily}>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="costUsd"
                stroke="#111827"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="text-sm font-medium text-zinc-900">各 Key 花费占比（30 天）</div>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={props.byKey}
                dataKey="costUsd"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
              >
                {props.byKey.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 grid gap-1 text-xs text-zinc-600">
          {props.byKey.map((p, idx) => (
            <div key={p.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-sm"
                  style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }}
                />
                <span className="truncate">{p.name}</span>
              </div>
              <span>${p.costUsd.toFixed(4)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

