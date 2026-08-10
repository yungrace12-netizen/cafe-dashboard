import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("ingredients")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ingredients: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, unit, package_amount, package_price } = body;

  if (!name || !unit || !package_amount || package_price == null) {
    return NextResponse.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("ingredients")
    .insert({ name, unit, package_amount, package_price })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ingredient: data });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, name, unit, package_amount, package_price } = body;
  if (!id) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("ingredients")
    .update({ name, unit, package_amount, package_price, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });

  const { error } = await supabaseAdmin.from("ingredients").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
