"use client";

import { useEffect, useState } from "react";

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  package_amount: number;
  package_price: number;
}

function formatWon(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

export function IngredientsManager({ initialIngredients }: { initialIngredients: Ingredient[] }) {
  const [ingredients, setIngredients] = useState(initialIngredients);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("g");
  const [packageAmount, setPackageAmount] = useState("");
  const [packagePrice, setPackagePrice] = useState("");

  async function reload() {
    const res = await fetch("/api/ingredients");
    const data = await res.json();
    setIngredients(data.ingredients ?? []);
  }

  async function handleAdd() {
    if (!name || !packageAmount || !packagePrice) return;
    await fetch("/api/ingredients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        unit,
        package_amount: Number(packageAmount),
        package_price: Number(packagePrice),
      }),
    });
    setName("");
    setPackageAmount("");
    setPackagePrice("");
    reload();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/ingredients?id=${id}`, { method: "DELETE" });
    reload();
  }

  return (
    <div>
      {/* 입력 폼 */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-3 text-sm font-semibold text-text-primary">원재료 추가</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs text-text-secondary">이름</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 원두, 우유"
              className="w-32 rounded-md border border-border px-2 py-1.5 text-sm outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-text-secondary">기준단위</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="rounded-md border border-border px-2 py-1.5 text-sm outline-none focus:border-accent"
            >
              <option value="g">g</option>
              <option value="ml">ml</option>
              <option value="개">개</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-text-secondary">팩 용량</label>
            <input
              type="number"
              value={packageAmount}
              onChange={(e) => setPackageAmount(e.target.value)}
              placeholder="예: 1000"
              className="w-24 rounded-md border border-border px-2 py-1.5 text-right text-sm outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-text-secondary">팩 가격</label>
            <input
              type="number"
              value={packagePrice}
              onChange={(e) => setPackagePrice(e.target.value)}
              placeholder="예: 25000"
              className="w-28 rounded-md border border-border px-2 py-1.5 text-right text-sm outline-none focus:border-accent"
            />
          </div>
          <button
            onClick={handleAdd}
            className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent-dark"
          >
            추가
          </button>
        </div>
      </div>

      {/* 목록 */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-text-secondary">
              <th className="px-4 py-3 font-medium">이름</th>
              <th className="px-4 py-3 text-right font-medium">팩 용량</th>
              <th className="px-4 py-3 text-right font-medium">팩 가격</th>
              <th className="px-4 py-3 text-right font-medium">단위당 단가</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {ingredients.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-text-secondary">
                  등록된 원재료가 없어요.
                </td>
              </tr>
            ) : (
              ingredients.map((i) => (
                <tr key={i.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 text-text-primary">{i.name}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-text-secondary">
                    {i.package_amount.toLocaleString("ko-KR")}
                    {i.unit}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-text-secondary">
                    {formatWon(i.package_price)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-medium text-text-primary">
                    {(i.package_price / i.package_amount).toFixed(1)}원/{i.unit}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => handleDelete(i.id)}
                      className="text-xs text-text-secondary hover:text-red-500"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
