import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { product_code, cost_price } = body as { product_code: string; cost_price: number | null };

  if (!product_code) {
    return NextResponse.json({ error: "product_code가 필요합니다." }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("products")
    .update({ cost_price, updated_at: new Date().toISOString() })
    .eq("product_code", product_code);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
