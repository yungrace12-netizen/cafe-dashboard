import * as XLSX from "xlsx";

export interface ParsedTransaction {
  sale_date: string;
  receipt_no: string;
  pos_no: string;
  paid_at: string;
  order_type: string;
  total_amount: number;
  net_amount: number;
  supply_amount: number | null;
  vat_amount: number | null;
  guest_count: number | null;
  unit_price: number | null;
}

export interface ParsedPayment {
  sale_date: string;
  receipt_no: string;
  payment_method: string;
  amount: number;
}

export interface ParsedProduct {
  product_code: string;
  product_name: string;
  category: string;
}

export interface ParsedSaleByProduct {
  sale_date: string;
  product_code: string;
  net_amount: number;
  quantity: number;
  abc_grade: string;
}

function sheetToMatrix(buf: ArrayBuffer): unknown[][] {
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null }) as unknown[][];
}

function extractDate(cell: unknown): string {
  const m = String(cell).match(/(\d{4}-\d{2}-\d{2})/);
  if (!m) throw new Error("조회일자를 찾을 수 없습니다: " + cell);
  return m[1];
}

/** 당일매출상세현황 파싱 (거래단위 + 결제수단) */
export function parseDetailFile(buf: ArrayBuffer): {
  transactions: ParsedTransaction[];
  payments: ParsedPayment[];
} {
  const rows = sheetToMatrix(buf);
  const saleDate = extractDate(rows[2][0]);

  const header = rows[6] as string[]; // 결제수단 세부항목이 포함된 실제 헤더 행
  const data = rows.slice(7, rows.length - 1); // 합계 행 제외

  const vatIdx = header.indexOf("부가세");
  const firstOrderIdx = header.indexOf("최초\n주문시각");
  const guestTotalIdx = header.length - 4; // 객수\n합계
  const unitPriceIdx = header.length - 2; // 객단가

  const paymentCols: { idx: number; name: string }[] = [];
  for (let i = vatIdx + 1; i < firstOrderIdx; i++) {
    if (header[i] === "결제합계") continue; // 총액 컬럼이라 제외
    paymentCols.push({ idx: i, name: header[i] });
  }

  const transactions: ParsedTransaction[] = [];
  const payments: ParsedPayment[] = [];

  for (const row of data) {
    const receiptNo = String(row[2] ?? "").trim();
    if (!receiptNo || receiptNo === "null" || receiptNo === "합계") continue;

    transactions.push({
      sale_date: saleDate,
      receipt_no: receiptNo,
      pos_no: String(row[1] ?? "").trim(),
      paid_at: String(row[3] ?? "").trim(),
      order_type: String(row[4] ?? "").trim(),
      total_amount: Number(row[5]),
      net_amount: Number(row[6]),
      supply_amount: row[7] != null ? Number(row[7]) : null,
      vat_amount: row[8] != null ? Number(row[8]) : null,
      guest_count: row[guestTotalIdx] != null ? Number(row[guestTotalIdx]) : null,
      unit_price: row[unitPriceIdx] != null ? Number(row[unitPriceIdx]) : null,
    });

    for (const { idx, name } of paymentCols) {
      const amount = row[idx];
      if (amount != null && Number(amount) !== 0) {
        payments.push({
          sale_date: saleDate,
          receipt_no: receiptNo,
          payment_method: name,
          amount: Number(amount),
        });
      }
    }
  }

  return { transactions, payments };
}

/** 상품ABC분석 파싱 (상품마스터 + 상품별 일일 판매) */
export function parseAbcFile(buf: ArrayBuffer): {
  products: ParsedProduct[];
  sales: ParsedSaleByProduct[];
} {
  const rows = sheetToMatrix(buf);
  const saleDate = extractDate(rows[2][0]);
  const data = rows.slice(6, rows.length - 1); // 헤더/합계 제외

  const products: ParsedProduct[] = [];
  const sales: ParsedSaleByProduct[] = [];

  for (const row of data) {
    const code = row[3];
    if (code == null) continue;
    const productCode = String(code).trim();

    products.push({
      product_code: productCode,
      product_name: String(row[4] ?? "").trim(),
      category: String(row[2] ?? "").trim(),
    });

    sales.push({
      sale_date: saleDate,
      product_code: productCode,
      net_amount: Number(row[5]),
      quantity: Number(row[6]),
      abc_grade: String(row[0] ?? "").trim(),
    });
  }

  return { products, sales };
}

/** 파일명으로 리포트 종류 판별 */
export function detectFileType(filename: string): "detail" | "abc" | "unknown" {
  if (filename.includes("당일매출상세현황")) return "detail";
  if (filename.includes("상품ABC분석")) return "abc";
  return "unknown";
}
