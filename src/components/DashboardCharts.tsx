"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const DONUT_COLORS = ["#0e9f6e", "#6ee7b7", "#a7f3d0", "#d1fae5"];

function formatWon(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 text-xs shadow-sm">
      {label && <p className="mb-1 text-text-secondary">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="font-medium text-text-primary">
          {formatWon(p.value)}
        </p>
      ))}
    </div>
  );
}

export function DailySalesChart({
  data,
}: {
  data: { date: string; net_amount: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0e9f6e" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#0e9f6e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: "#6b7280" }}
          axisLine={{ stroke: "#e7e9ee" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`}
        />
        <Tooltip content={<ChartTooltip />} />
        <Area
          type="monotone"
          dataKey="net_amount"
          name="매출"
          stroke="#0e9f6e"
          strokeWidth={2.5}
          fill="url(#salesFill)"
          dot={{ r: 3, fill: "#0e9f6e", strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function PaymentMethodDonut({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex items-center gap-6">
      <ResponsiveContainer width="55%" height={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="flex-1 space-y-2.5">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-text-secondary">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
              />
              {d.name}
            </span>
            <span className="font-medium text-text-primary tabular-nums">
              {total ? Math.round((d.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 레퍼런스의 "비용 순위" 리스트 스타일을 본뜬 랭킹형 막대 리스트 */
export function RankedList({
  data,
  unit = "원",
}: {
  data: { label: string; value: number; sub?: string }[];
  unit?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <ul className="space-y-3">
      {data.map((d, i) => (
        <li key={d.label} className="flex items-center gap-3">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent-dark">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="truncate text-sm text-text-primary">{d.label}</span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-text-primary">
                {d.value.toLocaleString("ko-KR")}
                {unit}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-bar-track">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${(d.value / max) * 100}%` }}
              />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
