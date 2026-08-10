import { supabaseAdmin } from "@/lib/supabaseServer";
import { DateRangePicker } from "@/components/DateRangePicker";
import { defaultMonthRange, monthsInRange } from "@/lib/dateRange";
import { getProductCostMap } from "@/lib/costs";

export const dynamic = "force-dynamic";

function formatWon(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

async function getPnlData(from: string, to: string) {
  const [{ data: transactions }, { data: salesByProduct }, costMap] = await Promise.all([
    supabaseAdmin
      .from("sales_transactions")
      .select("supply_amount, net_amount")
      .gte("sale_date", from)
      .lte("sale_date", to),
    supabaseAdmin
      .from("sales_by_product")
      .select("product_code, quantity")
      .gte("sale_date", from)
      .lte("sale_date", to),
    getProductCostMap(),
  ]);

  const txns = transactions ?? [];
  const salesRows = salesByProduct ?? [];

  // 매출액: 부가세 제외 공급가액 기준 (supply_amount가 없는 옛 데이터는 net_amount로 대체)
  const revenue = txns.reduce((sum, t) => sum + (t.supply_amount ?? t.net_amount), 0);

  // 매출원가: 원가가 확인된(레시피 또는 수동입력) 상품만 반영, 미확인 상품 수량은 별도 집계
  let cogs = 0;
  let uncostedQty = 0;
  const costedProductCodes = new Set<string>();
  for (const s of salesRows) {
    const info = costMap.get(s.product_code);
    if (info != null) {
      cogs += info.cost * s.quantity;
      costedProductCodes.add(s.product_code);
    } else {
      uncostedQty += s.quantity;
    }
  }

  // 판매관리비: 기간이 걸치는 월들의 expenses 합계
  const months = monthsInRange(from, to);
  const { data: expenseRows } = await supabaseAdmin
    .from("expenses")
    .select("category, cost_type, amount, expense_month")
    .in("expense_month", months);

  const expenses = expenseRows ?? [];
  const fixedCosts = expenses.filter((e) => e.cost_type === "고정비").reduce((s, e) => s + e.amount, 0);
  const variableCostsManual = expenses
    .filter((e) => e.cost_type === "변동비")
    .reduce((s, e) => s + e.amount, 0);

  const sgaTotal = fixedCosts + variableCostsManual; // 판매관리비 = 고정비+변동비 합계

  const grossProfit = revenue - cogs;
  const operatingProfit = grossProfit - sgaTotal;
  const operatingMargin = revenue ? (operatingProfit / revenue) * 100 : 0;

  // 손익분기점: 총 변동비(매출원가+변동비) / 매출액 = 변동비율
  const totalVariable = cogs + variableCostsManual;
  const variableRate = revenue ? totalVariable / revenue : 0;
  const bep = variableRate < 1 ? fixedCosts / (1 - variableRate) : null;
  const bepAchievement = bep && bep > 0 ? (revenue / bep) * 100 : null;

  // 비용 순위 Top 5 (매출원가 포함해서 함께 비교)
  const costRanking = [
    { label: "매출원가", value: cogs },
    ...expenses.map((e) => ({ label: e.category, value: e.amount })),
  ]
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return {
    revenue,
    cogs,
    grossProfit,
    sgaTotal,
    fixedCosts,
    variableCostsManual,
    operatingProfit,
    operatingMargin,
    bep,
    bepAchievement,
    uncostedQty,
    costedCount: costedProductCodes.size,
    costRanking,
  };
}

export default async function PnlPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const defaults = defaultMonthRange();
  const from = params.from ?? defaults.from;
  const to = params.to ?? defaults.to;

  const {
    revenue,
    cogs,
    grossProfit,
    sgaTotal,
    fixedCosts,
    variableCostsManual,
    operatingProfit,
    operatingMargin,
    bep,
    bepAchievement,
    uncostedQty,
    costRanking,
  } = await getPnlData(from, to);

  const rows = [
    { label: "매출액", value: revenue, emphasis: true },
    { label: "매출원가", value: -cogs },
    { label: "매출총이익", value: grossProfit, emphasis: true, divider: true },
    { label: "판매관리비 (고정비+변동비)", value: -sgaTotal },
    { label: "영업이익", value: operatingProfit, emphasis: true, divider: true, highlight: true },
  ];

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-text-primary">손익계산서</h1>
        <DateRangePicker from={from} to={to} basePath="/pnl" />
      </div>

      {uncostedQty > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          원가 미입력 상품이 {uncostedQty.toLocaleString("ko-KR")}개 판매됐어요. 이 상품들의 원가는
          매출원가 계산에서 빠져있어요 — <a href="/products" className="underline">원가관리</a>에서
          입력하면 더 정확해져요.
        </div>
      )}

      {/* KPI */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="mb-2 text-sm text-text-secondary">영업이익</p>
          <p
            className={`text-[26px] font-bold tabular-nums ${
              operatingProfit >= 0 ? "text-accent-dark" : "text-red-500"
            }`}
          >
            {formatWon(operatingProfit)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="mb-2 text-sm text-text-secondary">영업이익률</p>
          <p className="text-[26px] font-bold tabular-nums text-text-primary">
            {operatingMargin.toFixed(1)}%
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="mb-2 text-sm text-text-secondary">손익분기점 달성률</p>
          <p className="text-[26px] font-bold tabular-nums text-text-primary">
            {bepAchievement != null ? `${bepAchievement.toFixed(0)}%` : "-"}
          </p>
          {bep != null && (
            <p className="mt-2 text-xs text-text-secondary">BEP 매출: {formatWon(Math.round(bep))}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* 손익계산서 표 */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">손익 구조</h2>
          <ul>
            {rows.map((r) => (
              <li
                key={r.label}
                className={`flex items-center justify-between py-2.5 text-sm ${
                  r.divider ? "border-t border-border" : ""
                }`}
              >
                <span
                  className={r.emphasis ? "font-semibold text-text-primary" : "text-text-secondary"}
                >
                  {r.label}
                </span>
                <span
                  className={`tabular-nums ${
                    r.highlight
                      ? r.value >= 0
                        ? "font-bold text-accent-dark"
                        : "font-bold text-red-500"
                      : r.emphasis
                        ? "font-semibold text-text-primary"
                        : "text-text-secondary"
                  }`}
                >
                  {r.value < 0 ? "-" : ""}
                  {formatWon(Math.abs(r.value))}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-text-secondary">
            고정비 {formatWon(fixedCosts)} · 변동비(수동입력) {formatWon(variableCostsManual)}
          </p>
        </div>

        {/* 비용 순위 */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">비용 순위 Top 5</h2>
          {costRanking.length === 0 ? (
            <p className="text-sm text-text-secondary">입력된 비용이 없어요.</p>
          ) : (
            <ul className="space-y-3">
              {costRanking.map((c, i) => {
                const max = costRanking[0].value || 1;
                return (
                  <li key={c.label + i} className="flex items-center gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent-dark">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm text-text-primary">{c.label}</span>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-text-primary">
                          {formatWon(c.value)}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-bar-track">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${(c.value / max) * 100}%` }}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
