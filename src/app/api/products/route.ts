import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { product_code, cost_price, sell_price, yield_count } = body as {
    product_code: string;
    cost_price?: number | null;
    sell_price?: number | null;
    yield_count?: number;
  };

  if (!product_code) {
    return NextResponse.json({ error: "product_code가 필요합니다." }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if ("cost_price" in body) updates.cost_price = cost_price;
  if ("sell_price" in body) updates.sell_price = sell_price;
  if ("yield_count" in body) updates.yield_count = yield_count && yield_count > 0 ? yield_count : 1;

  const { error } = await supabaseAdmin.from("products").update(updates).eq("product_code", product_code);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
