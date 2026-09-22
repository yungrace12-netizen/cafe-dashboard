import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { product_code, cost_price, sell_price } = body as {
    product_code: string;
    cost_price?: number | null;
    sell_price?: number | null;
  };

  if (!product_code) {
    return NextResponse.json({ error: "product_code가 필요합니다." }, { status: 400 });
  }

  // 요청에 포함된 필드만 업데이트 (cost_price만 보낼 수도, sell_price만 보낼 수도 있음)
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if ("cost_price" in body) updates.cost_price = cost_price;
  if ("sell_price" in body) updates.sell_price = sell_price;

  const { error } = await supabaseAdmin.from("products").update(updates).eq("product_code", product_code);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
