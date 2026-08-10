"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function DateRangePicker({
  from,
  to,
  basePath = "/",
}: {
  from: string;
  to: string;
  basePath?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateRange(nextFrom: string, nextTo: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", nextFrom);
    params.set("to", nextTo);
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
      <input
        type="date"
        value={from}
        max={to}
        onChange={(e) => updateRange(e.target.value, to)}
        className="bg-transparent text-sm text-text-primary outline-none [color-scheme:light]"
      />
      <span className="text-text-secondary">~</span>
      <input
        type="date"
        value={to}
        min={from}
        onChange={(e) => updateRange(from, e.target.value)}
        className="bg-transparent text-sm text-text-primary outline-none [color-scheme:light]"
      />
    </div>
  );
}
