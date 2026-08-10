"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const VIEW_TABS = [
  { href: "/", label: "대시보드" },
  { href: "/pnl", label: "손익계산서" },
];

const MANAGE_TABS = [
  { href: "/products", label: "원가관리" },
  { href: "/ingredients", label: "원재료관리" },
  { href: "/costs", label: "비용관리" },
  { href: "/upload", label: "엑셀업로드" },
];

function TabLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition whitespace-nowrap ${
        active
          ? "bg-accent text-white"
          : "text-text-secondary hover:bg-accent-soft hover:text-accent-dark"
      }`}
    >
      {label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-border bg-card px-4 py-3 md:h-screen md:w-52 md:flex-col md:items-stretch md:gap-6 md:overflow-visible md:border-b-0 md:border-r md:px-4 md:py-6">
      <span className="mr-2 shrink-0 text-sm font-semibold text-text-primary md:mr-0 md:mb-2">
        ☕ 카페 매출관리
      </span>

      <div className="flex items-center gap-1 md:flex-col md:items-stretch md:gap-1">
        <p className="hidden px-3 pb-1 text-xs font-medium text-text-secondary md:block">조회</p>
        {VIEW_TABS.map((t) => (
          <TabLink key={t.href} {...t} active={pathname === t.href} />
        ))}
      </div>

      <div className="h-5 w-px shrink-0 bg-border md:hidden" />

      <div className="flex items-center gap-1 md:flex-col md:items-stretch md:gap-1">
        <p className="hidden px-3 pb-1 text-xs font-medium text-text-secondary md:block">관리</p>
        {MANAGE_TABS.map((t) => (
          <TabLink key={t.href} {...t} active={pathname === t.href} />
        ))}
      </div>
    </nav>
  );
}
