import { supabaseAdmin } from "@/lib/supabaseServer";
import { IngredientsManager } from "@/components/IngredientsManager";

export const dynamic = "force-dynamic";

export default async function IngredientsPage() {
  const { data: ingredients } = await supabaseAdmin
    .from("ingredients")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
      <h1 className="mb-2 text-2xl font-bold text-text-primary">원재료관리</h1>
      <p className="mb-6 text-sm text-text-secondary">
        원두, 우유, 설탕 등 원재료의 팩 용량과 가격을 입력하면 단위당 단가가 자동 계산돼요. 이
        단가는 원가관리 탭의 레시피 원가 계산에 쓰여요.
      </p>
      <IngredientsManager initialIngredients={ingredients ?? []} />
    </main>
  );
}
