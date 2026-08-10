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
  computed_cost: number | null;
  cost_source: "recipe" | "manual" | null;
  avg_sell_price: number;
}

function formatWon(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

function RecipeEditor({
  productCode,
  ingredients,
  onCostChange,
}: {
  productCode: string;
  ingredients: Ingredient[];
  onCostChange: (cost: number) => void;
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
    const total = loaded.reduce(
      (s, it) => s + it.quantity * (it.ingredients.package_price / it.ingredients.package_amount),
      0
    );
    onCostChange(Math.round(total));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productCode]);

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

  function handleRecipeCostChange(code: string, cost: number) {
    setRows((prev) =>
      prev.map((r) =>
        r.product_code === code ? { ...r, computed_cost: cost, cost_source: "recipe" } : r
      )
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-text-secondary">
            <th className="px-4 py-3 font-medium">상품명</th>
            <th className="px-4 py-3 font-medium">분류</th>
            <th className="px-4 py-3 text-right font-medium">판매가(참고)</th>
            <th className="px-4 py-3 text-right font-medium">원가</th>
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
              const costRate =
                r.computed_cost != null && r.avg_sell_price > 0
                  ? Math.round((r.computed_cost / r.avg_sell_price) * 100)
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
                    <td className="px-4 py-2.5 text-right tabular-nums text-text-secondary">
                      {r.avg_sell_price > 0 ? formatWon(Math.round(r.avg_sell_price)) : "-"}
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
                        <p className="mb-2 text-xs font-medium text-text-secondary">
                          레시피 (원재료 조합)
                        </p>
                        <RecipeEditor
                          productCode={r.product_code}
                          ingredients={ingredients}
                          onCostChange={(cost) => handleRecipeCostChange(r.product_code, cost)}
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
