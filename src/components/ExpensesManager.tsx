"use client";

import { useEffect, useState } from "react";

interface Expense {
  id: string;
  expense_month: string;
  category: string;
  cost_type: "고정비" | "변동비";
  amount: number;
  memo: string | null;
}

function formatWon(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export function ExpensesManager() {
  const [month, setMonth] = useState(currentMonth());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState("");
  const [costType, setCostType] = useState<"고정비" | "변동비">("고정비");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");

  async function load(m: string) {
    setLoading(true);
    const res = await fetch(`/api/expenses?month=${m}`);
    const data = await res.json();
    setExpenses(data.expenses ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load(month);
  }, [month]);

  async function handleAdd() {
    if (!category || !amount) return;
    await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        expense_month: month,
        category,
        cost_type: costType,
        amount: Number(amount),
        memo: memo || null,
      }),
    });
    setCategory("");
    setAmount("");
    setMemo("");
    load(month);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/expenses?id=${id}`, { method: "DELETE" });
    load(month);
  }

  const fixedTotal = expenses.filter((e) => e.cost_type === "고정비").reduce((s, e) => s + e.amount, 0);
  const variableTotal = expenses.filter((e) => e.cost_type === "변동비").reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <label className="text-sm text-text-secondary">조회 월</label>
        <input
          type="month"
          value={month.slice(0, 7)}
          onChange={(e) => setMonth(`${e.target.value}-01`)}
          className="rounded-md border border-border px-2 py-1 text-sm outline-none focus:border-accent [color-scheme:light]"
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="mb-1 text-sm text-text-secondary">고정비 합계</p>
          <p className="text-xl font-bold tabular-nums text-text-primary">{formatWon(fixedTotal)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="mb-1 text-sm text-text-secondary">변동비 합계</p>
          <p className="text-xl font-bold tabular-nums text-text-primary">{formatWon(variableTotal)}</p>
        </div>
      </div>

      {/* 입력 폼 */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-3 text-sm font-semibold text-text-primary">비용 추가</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs text-text-secondary">항목명</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="예: 인건비, 임대료"
              className="w-36 rounded-md border border-border px-2 py-1.5 text-sm outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-text-secondary">구분</label>
            <select
              value={costType}
              onChange={(e) => setCostType(e.target.value as "고정비" | "변동비")}
              className="rounded-md border border-border px-2 py-1.5 text-sm outline-none focus:border-accent"
            >
              <option value="고정비">고정비</option>
              <option value="변동비">변동비</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-text-secondary">금액</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-28 rounded-md border border-border px-2 py-1.5 text-right text-sm outline-none focus:border-accent"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs text-text-secondary">메모(선택)</label>
            <input
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="선택 입력"
              className="w-full rounded-md border border-border px-2 py-1.5 text-sm outline-none focus:border-accent"
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
              <th className="px-4 py-3 font-medium">항목</th>
              <th className="px-4 py-3 font-medium">구분</th>
              <th className="px-4 py-3 text-right font-medium">금액</th>
              <th className="px-4 py-3 font-medium">메모</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-text-secondary">
                  불러오는 중...
                </td>
              </tr>
            ) : expenses.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-text-secondary">
                  이번 달 입력된 비용이 없어요.
                </td>
              </tr>
            ) : (
              expenses.map((e) => (
                <tr key={e.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 text-text-primary">{e.category}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{e.cost_type}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-text-primary">
                    {formatWon(e.amount)}
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">{e.memo ?? "-"}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => handleDelete(e.id)}
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
