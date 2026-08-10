import { supabaseAdmin } from "@/lib/supabaseServer";
import { ProductsTable, ProductRow } from "@/components/ProductsTable";
import { getProductCostMap } from "@/lib/costs";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const [{ data: products }, { data: salesByProduct }, { data: ingredients }, costMap] =
    await Promise.all([
      supabaseAdmin.from("products").select("product_code, product_name, category, cost_price"),
      supabaseAdmin.from("sales_by_product").select("product_code, net_amount, quantity"),
      supabaseAdmin.from("ingredients").select("*").order("name"),
      getProductCostMap(),
    ]);

  const agg = new Map<string, { qty: number; net: number }>();
  for (const s of salesByProduct ?? []) {
    const cur = agg.get(s.product_code) ?? { qty: 0, net: 0 };
    cur.qty += s.quantity;
    cur.net += s.net_amount;
    agg.set(s.product_code, cur);
  }

  const rows: ProductRow[] = (products ?? []).map((p) => {
    const a = agg.get(p.product_code);
    const costInfo = costMap.get(p.product_code) ?? null;
    return {
      product_code: p.product_code,
      product_name: p.product_name,
      category: p.category ?? "-",
      cost_price: p.cost_price,
      computed_cost: costInfo?.cost ?? null,
      cost_source: costInfo?.source ?? null,
      avg_sell_price: a && a.qty > 0 ? a.net / a.qty : 0,
    };
  });

  const filledCount = rows.filter((r) => r.computed_cost != null).length;

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-text-primary">원가관리</h1>
        <p className="text-sm text-text-secondary">
          원가 확인 완료: {filledCount} / {rows.length}개
        </p>
      </div>
      <p className="mb-6 text-sm text-text-secondary">
        상품을 클릭하면 레시피(원재료 조합)를 입력할 수 있어요. 원재료 사용량을 넣으면 원가가
        자동 계산돼요. 사입 완제품처럼 레시피가 필요 없는 경우엔 직접 원가를 입력할 수도 있어요.
      </p>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center text-text-secondary">
          아직 상품 데이터가 없어요. 엑셀업로드 탭에서 상품ABC분석 파일을 먼저 올려주세요.
        </div>
      ) : (
        <ProductsTable initialRows={rows} ingredients={ingredients ?? []} />
      )}
    </main>
  );
}
