"use client";

import { useEffect, useState } from "react";

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  package_amount: number;
  package_price: number;
}

export interface RecipeItem {
  id: string;
  quantity: number;
  ingredient_id: string;
  ingredients: Ingredient;
}

export interface ProductRow {
  product_code: string;
  product_name: string;
  category: string;
  cost_price: number | null; // 레시피 없을 때의 수동입력 폴백값
  computed_cost: number | null; // 개당 원가 (레시피 배치원가 ÷ 생산개수, 또는 수동입력값)
  cost_source: "recipe" | "manual" | null;
  sell_price: number | null; // 직접입력한 판매가 (우선순위 1)
  avg_sell_price: number; // 판매 데이터 기반 평균 판매가 (직접입력 없을 때 폴백)
  yield_count: number; // 레시피 1회분으로 나오는 완제품 개수 (기본 1)
}

function formatWon(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

function RecipeEditor({
  productCode,
  ingredients,
  yieldCount,
  onBatchCostChange,
}: {
  productCode: string;
  ingredients: Ingredient[];
  yieldCount: number;
  onBatchCostChange: (batchTotal: number) => void;
}) {
  const [items, setItems] = useState<RecipeItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIngredient, setSelectedIngredient] = useState(ingredients[0]?.id ?? "");
  const [quantity, setQuantity] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/recipes?product_code=${encodeURIComponent(productCode)}`);
    const data = await res.json();
    const loaded: RecipeItem[] = data.items ?? [];
    setItems(loaded);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productCode]);

  const batchTotal = (items ?? []).reduce(
    (s, it) => s + it.quantity * (it.ingredients.package_price / it.ingredients.package_amount),
    0
  );

  useEffect(() => {
    if (items != null) onBatchCostChange(Math.round(batchTotal));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchTotal, items]);

  async function handleAdd() {
    if (!selectedIngredient || !quantity) return;
    await fetch("/api/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_code: productCode,
        ingredient_id: selectedIngredient,
        quantity: Number(quantity),
      }),
    });
    setQuantity("");
    load();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/recipes?id=${id}`, { method: "DELETE" });
    load();
  }

  if (loading) return <p className="py-3 text-xs text-text-secondary">불러오는 중...</p>;

  const perUnit = yieldCount > 0 ? batchTotal / yieldCount : batchTotal;

  return (
    <div className="rounded-lg bg-canvas p-3">
      {items && items.length > 0 && (
        <ul className="mb-3 space-y-1.5">
          {items.map((it) => (
            <li key={it.id} className="flex items-center justify-between text-xs">
              <span className="text-text-primary">
                {it.ingredients.name} {it.quantity}
                {it.ingredients.unit}
              </span>
              <span className="flex items-center gap-2">
                <span className="tabular-nums text-text-secondary">
                  {formatWon(
                    Math.round(
                      it.quantity * (it.ingredients.package_price / it.ingredients.package_amount)
                    )
                  )}
                </span>
                <button
                  onClick={() => handleDelete(it.id)}
                  className="text-text-secondary hover:text-red-500"
                >
                  삭제
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {ingredients.length === 0 ? (
        <p className="text-xs text-text-secondary">
          먼저 원재료관리 탭에서 원재료를 등록해주세요.
        </p>
      ) : (
        <div className="flex items-center gap-2">
          <select
            value={selectedIngredient}
            onChange={(e) => setSelectedIngredient(e.target.value)}
            className="rounded-md border border-border bg-white px-2 py-1 text-xs outline-none focus:border-accent"
          >
            {ingredients.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} ({i.unit})
              </option>
            ))}
          </select>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="사용량"
            className="w-20 rounded-md border border-border bg-white px-2 py-1 text-xs outline-none focus:border-accent"
          />
          <button
            onClick={handleAdd}
            className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-white hover:bg-accent-dark"
          >
            추가
          </button>
        </div>
      )}

      {items && items.length > 0 && (
        <p className="mt-3 border-t border-border pt-2 text-xs text-text-secondary">
          배치(레시피 1회) 원가 {formatWon(Math.round(batchTotal))} ÷ 생산개수 {yieldCount}개 ={" "}
          <span className="font-semibold text-text-primary">개당 {formatWon(Math.round(perUnit))}</span>
        </p>
      )}
    </div>
  );
}

export function ProductsTable({
  initialRows,
  ingredients,
}: {
  initialRows: ProductRow[];
  ingredients: Ingredient[];
}) {
  const [rows, setRows] = useState(initialRows);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [savingCode, setSavingCode] = useState<string | null>(null);
  // 레시피 배치 총원가(생산개수 나누기 전) 저장 - yield_count 바뀔 때 재계산용
  const [batchCosts, setBatchCosts] = useState<Record<string, number>>({});

  async function saveManualCost(code: string, value: string) {
    const cost_price = value === "" ? null : Number(value);
    setSavingCode(code);
    try {
      await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_code: code, cost_price }),
      });
      setRows((prev) =>
        prev.map((r) =>
          r.product_code === code
            ? { ...r, cost_price, computed_cost: cost_price, cost_source: cost_price != null ? "manual" : null }
            : r
        )
      );
    } finally {
      setSavingCode(null);
    }
  }

  async function saveSellPrice(code: string, value: string) {
    const sell_price = value === "" ? null : Number(value);
    setSavingCode(code);
    try {
      await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_code: code, sell_price }),
      });
      setRows((prev) => prev.map((r) => (r.product_code === code ? { ...r, sell_price } : r)));
    } finally {
      setSavingCode(null);
    }
  }

  async function saveYieldCount(code: string, value: string) {
    const yield_count = value === "" ? 1 : Math.max(1, Number(value));
    setSavingCode(code);
    try {
      await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_code: code, yield_count }),
      });
      setRows((prev) =>
        prev.map((r) => {
          if (r.product_code !== code) return r;
          const batchCost = batchCosts[code];
          const newComputed =
            r.cost_source === "recipe" && batchCost != null
              ? Math.round(batchCost / yield_count)
              : r.computed_cost;
          return { ...r, yield_count, computed_cost: newComputed };
        })
      );
    } finally {
      setSavingCode(null);
    }
  }

  function handleBatchCostChange(code: string, batchTotal: number) {
    setBatchCosts((prev) => ({ ...prev, [code]: batchTotal }));
    setRows((prev) =>
      prev.map((r) => {
        if (r.product_code !== code) return r;
        const yieldCount = r.yield_count || 1;
        return {
          ...r,
          computed_cost: Math.round(batchTotal / yieldCount),
          cost_source: "recipe",
        };
      })
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-text-secondary">
            <th className="px-4 py-3 font-medium">상품명</th>
            <th className="px-4 py-3 font-medium">분류</th>
            <th className="px-4 py-3 text-right font-medium">판매가</th>
            <th className="px-4 py-3 text-right font-medium">원가(개당)</th>
            <th className="px-4 py-3 text-right font-medium">원가율</th>
            <th className="px-4 py-3 font-medium">방식</th>
          </tr>
        </thead>
        <tbody>
          {[...rows]
            .sort((a, b) => {
              if ((a.computed_cost == null) !== (b.computed_cost == null)) {
                return a.computed_cost == null ? -1 : 1;
              }
              return a.product_name.localeCompare(b.product_name, "ko");
            })
            .map((r) => {
              const isOpen = expanded === r.product_code;
              const effectiveSellPrice = r.sell_price ?? r.avg_sell_price;
              const costRate =
                r.computed_cost != null && effectiveSellPrice > 0
                  ? Math.round((r.computed_cost / effectiveSellPrice) * 100)
                  : null;
              return (
                <>
                  <tr
                    key={r.product_code}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-accent-softer"
                    onClick={() => setExpanded(isOpen ? null : r.product_code)}
                  >
                    <td className="px-4 py-2.5 text-text-primary">
                      <span className="mr-1.5 inline-block w-3 text-text-secondary">
                        {isOpen ? "▾" : "▸"}
                      </span>
                      {r.product_name}
                    </td>
                    <td className="px-4 py-2.5 text-text-secondary">{r.category}</td>
                    <td className="px-4 py-2.5 text-right">
                      <input
                        type="number"
                        defaultValue={r.sell_price ?? ""}
                        placeholder={
                          r.avg_sell_price > 0 ? `${Math.round(r.avg_sell_price)}(평균)` : "미입력"
                        }
                        onClick={(e) => e.stopPropagation()}
                        onBlur={(e) => saveSellPrice(r.product_code, e.target.value)}
                        disabled={savingCode === r.product_code}
                        className="w-28 rounded-md border border-border px-2 py-1 text-right tabular-nums outline-none focus:border-accent"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-medium text-text-primary">
                      {r.computed_cost != null ? formatWon(r.computed_cost) : "미입력"}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {costRate != null ? (
                        <span className={costRate > 50 ? "text-red-500" : "text-text-secondary"}>
                          {costRate}%
                        </span>
                      ) : (
                        <span className="text-text-secondary">-</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-text-secondary">
                      {r.cost_source === "recipe" ? "레시피" : r.cost_source === "manual" ? "직접입력" : "-"}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="border-b border-border last:border-0">
                      <td colSpan={6} className="px-4 py-3">
                        <div
                          className="mb-2 flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <p className="text-xs font-medium text-text-secondary">
                            레시피 (원재료 조합)
                          </p>
                          <span className="mx-1 text-text-secondary">·</span>
                          <span className="text-xs text-text-secondary">이 레시피 1회로 만들어지는 개수:</span>
                          <input
                            type="number"
                            min={1}
                            defaultValue={r.yield_count ?? 1}
                            onBlur={(e) => saveYieldCount(r.product_code, e.target.value)}
                            disabled={savingCode === r.product_code}
                            className="w-16 rounded-md border border-border px-2 py-1 text-right text-xs tabular-nums outline-none focus:border-accent"
                          />
                          <span className="text-xs text-text-secondary">개</span>
                        </div>
                        <RecipeEditor
                          productCode={r.product_code}
                          ingredients={ingredients}
                          yieldCount={r.yield_count || 1}
                          onBatchCostChange={(batchTotal) =>
                            handleBatchCostChange(r.product_code, batchTotal)
                          }
                        />
                        <div
                          className="mt-3 flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-xs text-text-secondary">
                            레시피 없이 직접 원가 입력(예: 사입 완제품):
                          </span>
                          <input
                            type="number"
                            defaultValue={r.cost_price ?? ""}
                            placeholder="미입력"
                            onBlur={(e) => saveManualCost(r.product_code, e.target.value)}
                            disabled={savingCode === r.product_code}
                            className="w-24 rounded-md border border-border px-2 py-1 text-right text-xs tabular-nums outline-none focus:border-accent"
                          />
                        </div>
                        <p className="mt-2 text-xs text-text-secondary">
                          예: 반죽 1회(2,800원)로 치아바타 6개가 나오면 &ldquo;생산개수&rdquo;에
                          6을 입력하세요 — 개당 원가가 자동 계산돼요. 음료처럼 1개씩 만드는
                          상품은 기본값 1 그대로 두시면 돼요.
                        </p>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}
