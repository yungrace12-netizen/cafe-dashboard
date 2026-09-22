"use client";

import { useState } from "react";

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
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function reload() {
    const res = await fetch("/api/ingredients");
    const data = await res.json();
    setIngredients(data.ingredients ?? []);
  }

  async function handleAdd() {
    setError(null);
    if (!name || !packageAmount || !packagePrice) {
      setError("이름, 팩 용량, 팩 가격을 모두 입력해주세요.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          unit,
          package_amount: Number(packageAmount),
          package_price: Number(packagePrice),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `저장 실패 (상태코드 ${res.status})`);
        return;
      }
      setName("");
      setPackageAmount("");
      setPackagePrice("");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했어요.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      const res = await fetch(`/api/ingredients?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `삭제 실패 (상태코드 ${res.status})`);
        return;
      }
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했어요.");
    }
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
            disabled={saving}
            className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-50"
          >
            {saving ? "저장 중..." : "추가"}
          </button>
        </div>
        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">⚠ {error}</p>
        )}
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
