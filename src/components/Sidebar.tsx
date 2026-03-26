"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useI18n, Locale } from "@/lib/i18n";

const navKeys = [
  { href: "/customers", key: "navCustomers" as const, icon: "👤" },
  { href: "/customers/import", key: "navCustomerImport" as const, icon: "📥" },
  { href: "/warehouse-codes", key: "navWarehouseCodes" as const, icon: "🏷️" },
  { href: "/inbound", key: "navInbound" as const, icon: "📦" },
  { href: "/records", key: "navRecords" as const, icon: "📋" },
  { href: "/labels", key: "navLabels" as const, icon: "🖨️" },
];

function LangSwitch() {
  const { locale, setLocale } = useI18n();
  const options: { value: Locale; label: string }[] = [
    { value: "zh", label: "中文" },
    { value: "ko", label: "한국어" },
  ];

  return (
    <div className="flex gap-1 rounded-lg bg-gray-100 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => setLocale(o.value)}
          className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
            locale === o.value
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function NavContent({
  pathname,
  onLinkClick,
}: {
  pathname: string;
  onLinkClick: () => void;
}) {
  const { t } = useI18n();

  return (
    <>
      <div className="flex h-14 items-center justify-center border-b border-gray-100">
        <h1 className="text-lg font-bold text-blue-600">{t.systemName}</h1>
      </div>
      <div className="mx-3 mt-3">
        <LangSwitch />
      </div>
      <nav className="mt-2 space-y-0.5 px-2">
        {navKeys.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {t[item.key]}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <button
        className="fixed left-3 top-3 z-50 rounded-lg bg-white p-2 shadow-md md:hidden"
        onClick={() => setOpen(true)}
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/20" onClick={close} />
          <aside className="relative z-10 h-full w-56 bg-white shadow-lg">
            <NavContent pathname={pathname} onLinkClick={close} />
          </aside>
        </div>
      )}

      <aside className="hidden w-56 shrink-0 bg-white shadow-lg md:block">
        <NavContent pathname={pathname} onLinkClick={close} />
      </aside>
    </>
  );
}
