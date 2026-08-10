import { supabaseAdmin } from "@/lib/supabaseServer";

export interface IngredientRow {
  id: string;
  name: string;
  unit: string;
  package_amount: number;
  package_price: number;
}

export function unitCost(ing: Pick<IngredientRow, "package_amount" | "package_price">) {
  return ing.package_amount > 0 ? ing.package_price / ing.package_amount : 0;
}

/**
 * 모든 상품의 원가를 계산해서 Map으로 반환.
 * - 레시피(recipe_items)가 등록된 상품 → 원재료 사용량 × 단가 합산
 * - 레시피가 없는 상품 → products.cost_price(수동입력값, 있다면) 사용
 * - 둘 다 없으면 null (원가 미확인)
 */
export async function getProductCostMap(): Promise<
  Map<string, { cost: number; source: "recipe" | "manual" } | null>
> {
  const [{ data: products }, { data: recipeItems }, { data: ingredients }] = await Promise.all([
    supabaseAdmin.from("products").select("product_code, cost_price"),
    supabaseAdmin.from("recipe_items").select("product_code, ingredient_id, quantity"),
    supabaseAdmin.from("ingredients").select("id, package_amount, package_price"),
  ]);

  const ingCostMap = new Map((ingredients ?? []).map((i) => [i.id, unitCost(i)]));

  const recipeCostByProduct = new Map<string, number>();
  const hasRecipe = new Set<string>();
  for (const item of recipeItems ?? []) {
    hasRecipe.add(item.product_code);
    const uCost = ingCostMap.get(item.ingredient_id) ?? 0;
    recipeCostByProduct.set(
      item.product_code,
      (recipeCostByProduct.get(item.product_code) ?? 0) + uCost * item.quantity
    );
  }

  const result = new Map<string, { cost: number; source: "recipe" | "manual" } | null>();
  for (const p of products ?? []) {
    if (hasRecipe.has(p.product_code)) {
      result.set(p.product_code, {
        cost: Math.round(recipeCostByProduct.get(p.product_code) ?? 0),
        source: "recipe",
      });
    } else if (p.cost_price != null) {
      result.set(p.product_code, { cost: p.cost_price, source: "manual" });
    } else {
      result.set(p.product_code, null);
    }
  }
  return result;
}
