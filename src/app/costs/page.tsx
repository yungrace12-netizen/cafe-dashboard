import { ExpensesManager } from "@/components/ExpensesManager";

export default function CostsPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <h1 className="mb-2 text-2xl font-bold text-text-primary">비용관리</h1>
      <p className="mb-6 text-sm text-text-secondary">
        인건비, 임대료 등 상품과 무관한 월별 비용을 입력하세요. 고정비/변동비 구분은 손익분기점
        계산에 사용돼요.
      </p>
      <ExpensesManager />
    </main>
  );
}
