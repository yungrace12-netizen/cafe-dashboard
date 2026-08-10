import { supabaseAdmin } from "@/lib/supabaseServer";
import { DailySalesChart, PaymentMethodDonut, RankedList } from "@/components/DashboardCharts";
import { UploadWidget } from "@/components/UploadWidget";
import { DateRangePicker } from "@/components/DateRangePicker";
import { defaultMonthRange } from "@/lib/dateRange";

export const dynamic = "force-dynamic"; // 업로드/기간변경 직후에도 항상 최신 데이터로 렌더링

function formatWon(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

async function getDashboardData(from: string, to: string) {
  const { data: transactions } = await supabaseAdmin
    .from("sales_transactions")
    .select("id, sale_date, net_amount")
    .gte("sale_date", from)
    .lte("sale_date", to)
    .order("sale_date", { ascending: true });

  const txns = transactions ?? [];
  const txnIds = txns.map((t) => t.id);

  const [{ data: payments }, { data: salesByProduct }, { data: products }] = await Promise.all([
    txnIds.length
      ? supabaseAdmin.from("sales_payments").select("payment_method, amount").in("transaction_id", txnIds)
      : Promise.resolve({ data: [] }),
    supabaseAdmin
      .from("sales_by_product")
      .select("product_code, net_amount, quantity, sale_date")
      .gte("sale_date", from)
      .lte("sale_date", to),
    supabaseAdmin.from("products").select("product_code, product_name"),
  ]);

  const pays = payments ?? [];
  const salesRows = salesByProduct ?? [];
  const productRows = products ?? [];

  const totalNet = txns.reduce((sum, t) => sum + t.net_amount, 0);
  const txnCount = txns.length;
  const avgUnitPrice = txnCount ? Math.round(totalNet / txnCount) : 0;

  const byDate = new Map<string, number>();
  for (const t of txns) {
    byDate.set(t.sale_date, (byDate.get(t.sale_date) ?? 0) + t.net_amount);
  }
  const dailySales = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, net_amount]) => ({ date: date.slice(5), net_amount }));

  const byMethod = new Map<string, number>();
  for (const p of pays) {
    byMethod.set(p.payment_method, (byMethod.get(p.payment_method) ?? 0) + p.amount);
  }
  const paymentBreakdown = [...byMethod.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  const nameMap = new Map(productRows.map((p) => [p.product_code, p.product_name]));
  const byProductAmount = new Map<string, number>();
  const byProductQty = new Map<string, number>();
  for (const s of salesRows) {
    byProductAmount.set(s.product_code, (byProductAmount.get(s.product_code) ?? 0) + s.net_amount);
    byProductQty.set(s.product_code, (byProductQty.get(s.product_code) ?? 0) + s.quantity);
  }
  const topProductsByAmount = [...byProductAmount.entries()]
    .map(([code, value]) => ({ label: nameMap.get(code) ?? code, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
  const topProductsByQty = [...byProductQty.entries()]
    .map(([code, value]) => ({ label: nameMap.get(code) ?? code, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return {
    totalNet,
    txnCount,
    avgUnitPrice,
    dailySales,
    paymentBreakdown,
    topProductsByAmount,
    topProductsByQty,
  };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const defaults = defaultMonthRange();
  const from = params.from ?? defaults.from;
  const to = params.to ?? defaults.to;

  const {
    totalNet,
    txnCount,
    avgUnitPrice,
    dailySales,
    paymentBreakdown,
    topProductsByAmount,
    topProductsByQty,
  } = await getDashboardData(from, to);

  const hasData = txnCount > 0;

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      {/* 헤더 */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-text-primary">대시보드</h1>
        <div className="flex flex-wrap items-center gap-3">
          <DateRangePicker from={from} to={to} />
          <UploadWidget />
        </div>
      </div>

      {!hasData ? (
        <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center">
          <p className="text-text-secondary">
            선택한 기간({from} ~ {to})에 데이터가 없어요. 기간을 바꾸거나{" "}
            <strong>엑셀 업로드</strong> 버튼으로 OK POS 데이터를 올려주세요.
          </p>
        </div>
      ) : (
        <>
          {/* KPI 카드 */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="mb-2 text-sm text-text-secondary">총 매출</p>
              <p className="text-[26px] font-bold tabular-nums text-text-primary">
                {formatWon(totalNet)}
              </p>
              <p className="mt-2 text-xs text-text-secondary">
                {from.slice(5)} ~ {to.slice(5)} 누적
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="mb-2 text-sm text-text-secondary">총 거래건수</p>
              <p className="text-[26px] font-bold tabular-nums text-text-primary">
                {txnCount.toLocaleString("ko-KR")}건
              </p>
              <p className="mt-2 text-xs text-text-secondary">
                {from.slice(5)} ~ {to.slice(5)} 누적
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="mb-2 text-sm text-text-secondary">평균 객단가</p>
              <p className="text-[26px] font-bold tabular-nums text-text-primary">
                {formatWon(avgUnitPrice)}
              </p>
              <p className="mt-2 text-xs text-text-secondary">거래 1건당 평균</p>
            </div>
          </div>

          {/* 일별 매출 추이 */}
          <div className="mb-6 rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 text-sm font-semibold text-text-primary">일별 매출 추이</h2>
            <DailySalesChart data={dailySales} />
          </div>

          {/* 결제수단 + 상품 랭킹 */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-4 text-sm font-semibold text-text-primary">결제수단별 비중</h2>
              <PaymentMethodDonut data={paymentBreakdown} />
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-4 text-sm font-semibold text-text-primary">
                매출 Top 5 · 상품
              </h2>
              <RankedList data={topProductsByAmount} />
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-4 text-sm font-semibold text-text-primary">
                판매량 Top 5 · 상품
              </h2>
              <RankedList data={topProductsByQty} unit="개" />
            </div>
          </div>
        </>
      )}
    </main>
  );
}
