"use client";

import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/lib/i18n";

interface InboundRecord {
  id: number;
  serialNo: number;
  inboundTime: string;
  inboundOrderNo: string;
  inboundName: string;
  inboundPhone: string;
  outboundStatus: string;
  customer: {
    id: number;
    nameCn: string;
    namePinyin: string;
    phone: string;
  };
  warehouseCode: {
    id: number;
    warehouseCode: string;
    areaCode: string;
  };
}

export default function RecordsPage() {
  const { t, locale } = useI18n();
  const [records, setRecords] = useState<InboundRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (search) params.set("q", search);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/inbound?${params}`);
    const data = await res.json();
    setRecords(data.records);
    setTotal(data.total);
    setLoading(false);
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleShip = async (id: number) => {
    if (!confirm(t.confirmShip)) return;
    const res = await fetch(`/api/inbound/${id}/ship`, { method: "POST" });
    if (res.ok) {
      fetchRecords();
    } else {
      const data = await res.json();
      alert(data.error || t.shipFailed);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRecords();
  };

  const totalPages = Math.ceil(total / 20);
  const dateLang = locale === "ko" ? "ko-KR" : "zh-CN";

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-6 text-2xl font-bold">{t.recordsTitle}</h1>

      <form onSubmit={handleSearch} className="mb-4 flex flex-wrap gap-2">
        <input
          type="text"
          placeholder={t.searchRecordPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] rounded-lg border border-gray-200 px-3 py-2 text-base sm:text-sm focus:border-blue-500 focus:outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-base sm:text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">{t.allStatus}</option>
          <option value="unshipped">{t.statusUnshipped}</option>
          <option value="shipped">{t.statusShipped}</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium hover:bg-gray-200"
        >
          {t.search}
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              <th className="px-3 py-3 font-medium text-gray-600">{t.thSerialNo}</th>
              <th className="px-3 py-3 font-medium text-gray-600">{t.thInboundTime}</th>
              <th className="px-3 py-3 font-medium text-gray-600">{t.thOrderNo}</th>
              <th className="px-3 py-3 font-medium text-gray-600">{t.thCustomerName}</th>
              <th className="px-3 py-3 font-medium text-gray-600">{t.thPhone}</th>
              <th className="px-3 py-3 font-medium text-gray-600">{t.thWarehouseCode}</th>
              <th className="px-3 py-3 font-medium text-gray-600">{t.thStatus}</th>
              <th className="px-3 py-3 font-medium text-gray-600">{t.thActions}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">{t.loading}</td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">{t.noData}</td>
              </tr>
            ) : (
              records.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-3 py-3 text-gray-500">{r.serialNo}</td>
                  <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                    {new Date(r.inboundTime).toLocaleString(dateLang, {
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-3 py-3 font-mono text-xs">{r.inboundOrderNo}</td>
                  <td className="px-3 py-3 font-medium">{r.inboundName || r.customer.nameCn}</td>
                  <td className="px-3 py-3 text-gray-600">{r.inboundPhone || r.customer.phone}</td>
                  <td className="px-3 py-3 font-mono font-bold text-blue-600">
                    {r.warehouseCode.warehouseCode}
                  </td>
                  <td className="px-3 py-3">
                    {r.outboundStatus === "shipped" ? (
                      <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                        {t.statusShipped}
                      </span>
                    ) : (
                      <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        {t.statusUnshipped}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {r.outboundStatus === "unshipped" && (
                      <button
                        onClick={() => handleShip(r.id)}
                        className="rounded-lg bg-orange-500 px-3 py-1 text-xs font-medium text-white hover:bg-orange-600"
                      >
                        {t.shipBtn}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <span>{t.totalRecords(total)}</span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="rounded px-3 py-1 hover:bg-gray-100 disabled:opacity-40"
            >
              {t.prevPage}
            </button>
            <span className="px-3 py-1">{t.pageOf(page, totalPages)}</span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="rounded px-3 py-1 hover:bg-gray-100 disabled:opacity-40"
            >
              {t.nextPage}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
