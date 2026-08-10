"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface UploadResult {
  transactions: number;
  payments: number;
  products: number;
  salesByProduct: number;
  errors: string[];
}

export default function UploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  async function handleUpload() {
    if (!files.length) return;
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    setResult(data);
    setLoading(false);
    setFiles([]);
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-10 sm:px-8">
      <h1 className="mb-2 text-2xl font-bold text-text-primary">엑셀업로드</h1>
      <p className="mb-6 text-sm text-text-secondary">
        OK POS ASP에서 받은 &lsquo;당일매출상세현황&rsquo;, &lsquo;상품ABC분석&rsquo; 엑셀 파일을
        여러 개 선택해서 한 번에 업로드하세요.
      </p>

      <div className="rounded-2xl border border-border bg-card p-6">
        <input
          type="file"
          multiple
          accept=".xls,.xlsx"
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="mb-4 block w-full text-sm text-text-secondary file:mr-3 file:rounded-full file:border-0 file:bg-accent-soft file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-accent-dark"
        />

        {files.length > 0 && (
          <ul className="mb-4 list-disc space-y-0.5 pl-5 text-sm text-text-secondary">
            {files.map((f) => (
              <li key={f.name}>{f.name}</li>
            ))}
          </ul>
        )}

        <button
          onClick={handleUpload}
          disabled={!files.length || loading}
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-40"
        >
          {loading ? "업로드 중..." : "업로드"}
        </button>

        {result && (
          <div className="mt-6 rounded-xl bg-accent-softer p-4 text-sm">
            <p>거래(transactions): {result.transactions}건</p>
            <p>결제내역(payments): {result.payments}건</p>
            <p>상품마스터(products): {result.products}개</p>
            <p>상품별판매(sales_by_product): {result.salesByProduct}건</p>
            {result.errors?.length > 0 && (
              <div className="mt-2 text-red-600">
                {result.errors.map((e, i) => (
                  <p key={i}>⚠ {e}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
