"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/customers", label: "客户管理", icon: "👤" },
  { href: "/customers/import", label: "客户导入", icon: "📥" },
  { href: "/warehouse-codes", label: "仓库码池", icon: "🏷️" },
  { href: "/inbound", label: "入库登记", icon: "📦" },
  { href: "/records", label: "库存记录", icon: "📋" },
  { href: "/labels", label: "标签预览", icon: "🖨️" },
];

function NavContent({
  pathname,
  onLinkClick,
}: {
  pathname: string;
  onLinkClick: () => void;
}) {
  return (
    <>
      <div className="flex h-14 items-center justify-center border-b border-gray-100">
        <h1 className="text-lg font-bold text-blue-600">仓库管理系统</h1>
      </div>
      <nav className="mt-2 space-y-0.5 px-2">
        {navItems.map((item) => {
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
              {item.label}
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
      {/* Mobile: hamburger button */}
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

      {/* Mobile: overlay + drawer — only in DOM when open */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/20" onClick={close} />
          <aside className="relative z-10 h-full w-56 bg-white shadow-lg">
            <NavContent pathname={pathname} onLinkClick={close} />
          </aside>
        </div>
      )}

      {/* Desktop: always-visible static sidebar */}
      <aside className="hidden w-56 shrink-0 bg-white shadow-lg md:block">
        <NavContent pathname={pathname} onLinkClick={close} />
      </aside>
    </>
  );
}
