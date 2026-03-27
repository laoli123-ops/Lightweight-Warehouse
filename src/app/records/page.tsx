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
  const [exporting, setExporting] = useState(false);

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

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ page: "1", pageSize: "100000" });
      if (search) params.set("q", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/inbound?${params}`);
      const data = await res.json();
      const allRecords: InboundRecord[] = data.records;

      const XLSX = await import("xlsx");

      const isKo = locale === "ko";
      const rows = allRecords.map((r) => ({
        [isKo ? "일련번호" : "序号"]: r.serialNo,
        [isKo ? "입고 시간" : "入库时间"]: new Date(r.inboundTime).toLocaleString(
          isKo ? "ko-KR" : "zh-CN"
        ),
        [isKo ? "운송장 번호" : "快递单号"]: r.inboundOrderNo,
        [isKo ? "이름" : "姓名"]: r.inboundName || r.customer.nameCn,
        [isKo ? "전화번호" : "手机号"]: r.inboundPhone || r.customer.phone,
        [isKo ? "창고 코드" : "仓库码"]: r.warehouseCode.warehouseCode,
        [isKo ? "구역" : "区域"]: r.warehouseCode.areaCode,
        [isKo ? "상태" : "状态"]:
          r.outboundStatus === "shipped"
            ? (isKo ? "출고완료" : "已出库")
            : (isKo ? "미출고" : "未出库"),
      }));

      const ws = XLSX.utils.json_to_sheet(rows);

      const colWidths = [8, 18, 24, 12, 16, 10, 6, 8];
      ws["!cols"] = colWidths.map((w) => ({ wch: w }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, isKo ? "재고 기록" : "库存记录");

      const date = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `${isKo ? "재고기록" : "库存记录"}_${date}.xlsx`);
    } catch (e) {
      console.error("Export failed:", e);
    }
    setExporting(false);
  };

  const totalPages = Math.ceil(total / 20);
  const dateLang = locale === "ko" ? "ko-KR" : "zh-CN";

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">{t.recordsTitle}</h1>
        <button
          onClick={handleExport}
          disabled={exporting || total === 0}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {exporting ? t.exporting : t.exportExcel}
        </button>
      </div>

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
