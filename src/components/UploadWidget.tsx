"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Status = "idle" | "uploading" | "done" | "error";

export function UploadWidget() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return;
    setStatus("uploading");
    setMessage("");

    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("files", f));

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      const total =
        (data.transactions ?? 0) + (data.products ?? 0);
      if (data.errors?.length) {
        setStatus("error");
        setMessage(data.errors[0]);
      } else {
        setStatus("done");
        setMessage(
          `거래 ${data.transactions ?? 0}건, 상품 ${data.salesByProduct ?? 0}건 반영됨`
        );
      }
      if (total > 0) {
        router.refresh(); // 대시보드 데이터 즉시 재조회
      }
    } catch {
      setStatus("error");
      setMessage("업로드 중 오류가 발생했어요.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
      setTimeout(() => setStatus("idle"), 3500);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {message && (
        <span
          className={`text-xs ${
            status === "error" ? "text-red-500" : "text-text-secondary"
          }`}
        >
          {message}
        </span>
      )}
      <button
        onClick={() => inputRef.current?.click()}
        disabled={status === "uploading"}
        className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-dark disabled:opacity-50"
      >
        {status === "uploading" ? "업로드 중..." : "엑셀 업로드"}
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".xls,.xlsx"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
