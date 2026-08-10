import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req: NextRequest) {
  const productCode = req.nextUrl.searchParams.get("product_code");
  if (!productCode) {
    return NextResponse.json({ error: "product_code가 필요합니다." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("recipe_items")
    .select("id, quantity, ingredient_id, ingredients(id, name, unit, package_amount, package_price)")
    .eq("product_code", productCode);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { product_code, ingredient_id, quantity } = body;

  if (!product_code || !ingredient_id || quantity == null) {
    return NextResponse.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("recipe_items")
    .upsert({ product_code, ingredient_id, quantity }, { onConflict: "product_code,ingredient_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });

  const { error } = await supabaseAdmin.from("recipe_items").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
