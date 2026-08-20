"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

const modules = [
  { href: "/customers", labelKey: "navCustomers" as const, descKey: "descCustomers" as const, icon: "👤", color: "bg-blue-500" },
  { href: "/customers/import", labelKey: "navCustomerImport" as const, descKey: "descCustomerImport" as const, icon: "📥", color: "bg-green-500" },
  { href: "/warehouse-codes", labelKey: "navWarehouseCodes" as const, descKey: "descWarehouseCodes" as const, icon: "🏷️", color: "bg-purple-500" },
  { href: "/inbound", labelKey: "navInbound" as const, descKey: "descInbound" as const, icon: "📦", color: "bg-orange-500" },
  { href: "/prescan", labelKey: "navPrescan" as const, descKey: "descPrescan" as const, icon: "📡", color: "bg-cyan-600" },
  { href: "/records", labelKey: "navRecords" as const, descKey: "descRecords" as const, icon: "📋", color: "bg-teal-500" },
  { href: "/labels", labelKey: "navLabels" as const, descKey: "descLabels" as const, icon: "🖨️", color: "bg-rose-500" },
  { href: "/bulk", labelKey: "navBulk" as const, descKey: "descBulk" as const, icon: "🚚", color: "bg-amber-500" },
];

export default function HomePage() {
  const { t } = useI18n();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">{t.systemTitle}</h1>
        <p className="mt-2 text-gray-500">{t.systemSubtitle}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="group rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${m.color} text-lg text-white`}>
              {m.icon}
            </div>
            <h2 className="text-base font-semibold text-gray-900 group-hover:text-blue-600">{t[m.labelKey]}</h2>
            <p className="mt-1 text-sm text-gray-500">{t[m.descKey]}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
