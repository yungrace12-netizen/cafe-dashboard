import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseServer";
import { parseDetailFile, parseAbcFile, detectFileType } from "@/lib/parseOkpos";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const files = formData.getAll("files") as File[];

  if (!files.length) {
    return NextResponse.json({ error: "업로드된 파일이 없습니다." }, { status: 400 });
  }

  const summary = {
    transactions: 0,
    payments: 0,
    products: 0,
    salesByProduct: 0,
    errors: [] as string[],
  };

  for (const file of files) {
    const type = detectFileType(file.name);
    const buf = await file.arrayBuffer();

    try {
      if (type === "detail") {
        const { transactions, payments } = parseDetailFile(buf);

        // 거래 upsert (sale_date + receipt_no 유니크 제약 기준)
        const { data: insertedTxns, error: txnErr } = await supabase
          .from("sales_transactions")
          .upsert(transactions, { onConflict: "sale_date,receipt_no" })
          .select("id, sale_date, receipt_no");
        if (txnErr) throw txnErr;

        // 결제내역은 transaction_id를 참조해야 하므로, 방금 upsert된 id를 매핑
        const idMap = new Map(
          (insertedTxns ?? []).map((t) => [`${t.sale_date}_${t.receipt_no}`, t.id])
        );
        const paymentsWithId = payments
          .map((p) => ({
            transaction_id: idMap.get(`${p.sale_date}_${p.receipt_no}`),
            payment_method: p.payment_method,
            amount: p.amount,
          }))
          .filter((p) => p.transaction_id);

        if (paymentsWithId.length) {
          // 같은 거래 재업로드 시 중복 방지를 위해 기존 결제내역 삭제 후 재삽입
          const txnIds = [...idMap.values()];
          await supabase.from("sales_payments").delete().in("transaction_id", txnIds);
          const { error: payErr } = await supabase.from("sales_payments").insert(paymentsWithId);
          if (payErr) throw payErr;
        }

        summary.transactions += transactions.length;
        summary.payments += paymentsWithId.length;
      } else if (type === "abc") {
        const { products, sales } = parseAbcFile(buf);

        const { error: prodErr } = await supabase
          .from("products")
          .upsert(products, { onConflict: "product_code", ignoreDuplicates: false });
        if (prodErr) throw prodErr;

        const { error: salesErr } = await supabase
          .from("sales_by_product")
          .upsert(sales, { onConflict: "sale_date,product_code" });
        if (salesErr) throw salesErr;

        summary.products += products.length;
        summary.salesByProduct += sales.length;
      } else {
        summary.errors.push(`${file.name}: 알 수 없는 파일 형식`);
      }
    } catch (e) {
      summary.errors.push(`${file.name}: ${(e as Error).message}`);
    }
  }

  return NextResponse.json(summary);
}
