"use client";

import { useState, useCallback, useMemo } from "react";
import { useI18n } from "@/lib/i18n";

interface RecordHit {
  id: number;
  serialNo: number;
  inboundOrderNo: string;
  inboundName: string;
  inboundPhone: string;
  outboundStatus: string;
  warehouseCode: { warehouseCode: string; areaCode: string };
  customer: { nameCn: string; phone: string };
}

interface LookupRow {
  orderNo: string;
  status: "unshipped" | "shipped" | "not_found";
  records: RecordHit[];
}

interface Toast {
  type: "success" | "error";
  message: string;
}

type ShareFilter = "all" | "found" | "unshipped" | "shipped" | "not_found";

export default function BulkPage() {
  const { t, locale } = useI18n();
  const [input, setInput] = useState("");
  const [rows, setRows] = useState<LookupRow[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [looking, setLooking] = useState(false);
  const [shipping, setShipping] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [shareFilter, setShareFilter] = useState<ShareFilter>("all");

  const showToast = useCallback((type: Toast["type"], message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const unshippedIds = rows
    .filter((r) => r.status === "unshipped")
    .flatMap((r) => r.records.filter((rec) => rec.outboundStatus === "unshipped").map((rec) => rec.id));

  const stats = {
    total: rows.length,
    unshipped: rows.filter((r) => r.status === "unshipped").length,
    shipped: rows.filter((r) => r.status === "shipped").length,
    notFound: rows.filter((r) => r.status === "not_found").length,
  };

  const filteredRows = useMemo(() => {
    switch (shareFilter) {
      case "found":
        return rows.filter((r) => r.status !== "not_found");
      case "unshipped":
        return rows.filter((r) => r.status === "unshipped");
      case "shipped":
        return rows.filter((r) => r.status === "shipped");
      case "not_found":
        return rows.filter((r) => r.status === "not_found");
      default:
        return rows;
    }
  }, [rows, shareFilter]);

  const statusText = useCallback(
    (status: LookupRow["status"]) => {
      switch (status) {
        case "unshipped":
          return t.bulkResultUnshipped;
        case "shipped":
          return t.bulkResultShipped;
        case "not_found":
          return t.bulkResultNotFound;
      }
    },
    [t],
  );

  const generateTextLines = useCallback(
    (source: LookupRow[]) =>
      source.map((row) => {
        if (row.status === "not_found") return `${row.orderNo} - ${t.bulkResultNotFound}`;
        if (row.status === "shipped") return `${row.orderNo} - ${t.bulkResultShipped}`;
        const code = row.records[0]?.warehouseCode.warehouseCode ?? "—";
        return `${row.orderNo} - ${code}`;
      }),
    [t],
  );

  const handleLookup = async () => {
    const lines = input
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      showToast("error", t.bulkEmpty);
      return;
    }

    setLooking(true);
    setRows([]);
    setSelected(new Set());

    const res = await fetch("/api/inbound/bulk-lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNos: lines }),
    });
    const data = await res.json();

    if (data.results) {
      setRows(data.results);
      const autoSelect = new Set<number>();
      for (const row of data.results as LookupRow[]) {
        if (row.status === "unshipped") {
          for (const rec of row.records) {
            if (rec.outboundStatus === "unshipped") autoSelect.add(rec.id);
          }
        }
      }
      setSelected(autoSelect);
    }

    setLooking(false);
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllUnshipped = () => setSelected(new Set(unshippedIds));
  const deselectAll = () => setSelected(new Set());

  const handleBulkShip = async () => {
    if (selected.size === 0) return;
    if (!confirm(t.bulkConfirm(selected.size))) return;

    setShipping(true);
    const res = await fetch("/api/inbound/bulk-ship", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...selected] }),
    });
    const data = await res.json();

    if (res.ok) {
      showToast("success", t.bulkShipSuccess(data.shipped));
      await handleLookup();
    } else {
      showToast("error", data.error || t.shipFailed);
    }
    setShipping(false);
  };

  const handleCopy = async () => {
    const text = generateTextLines(filteredRows).join("\n");
    await navigator.clipboard.writeText(text);
    showToast("success", t.bulkCopied);
  };

  const buildExportData = (source: LookupRow[]) =>
    source.map((row) => {
      const isKo = locale === "ko";
      const code =
        row.status === "not_found" ? "—" : row.records[0]?.warehouseCode.warehouseCode ?? "—";
      const name =
        row.status === "not_found"
          ? "—"
          : row.records[0]?.inboundName || row.records[0]?.customer.nameCn || "—";
      const phone =
        row.status === "not_found"
          ? "—"
          : row.records[0]?.inboundPhone || row.records[0]?.customer.phone || "—";
      return {
        [isKo ? "운송장 번호" : "快递单号"]: row.orderNo,
        [isKo ? "창고 코드" : "仓库码"]: code,
        [isKo ? "이름" : "姓名"]: name,
        [isKo ? "전화번호" : "手机号"]: phone,
        [isKo ? "상태" : "出库状态"]: statusText(row.status),
      };
    });

  const handleExportExcel = async () => {
    const XLSX = await import("xlsx");
    const data = buildExportData(filteredRows);
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [{ wch: 24 }, { wch: 12 }, { wch: 14 }, { wch: 18 }, { wch: 12 }];
    const wb = XLSX.utils.book_new();
    const sheetName = locale === "ko" ? "조회결과" : "查询结果";
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const date = new Date().toISOString().slice(0, 10);
    const filename = locale === "ko" ? `일괄조회_${date}.xlsx` : `批量查询_${date}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const handleExportCSV = async () => {
    const XLSX = await import("xlsx");
    const data = buildExportData(filteredRows);
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const bom = "\uFEFF";
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    a.download = locale === "ko" ? `일괄조회_${date}.csv` : `批量查询_${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusBadge = (status: LookupRow["status"]) => {
    switch (status) {
      case "unshipped":
        return (
          <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
            {t.bulkStatusUnshipped}
          </span>
        );
      case "shipped":
        return (
          <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
            {t.bulkStatusShipped}
          </span>
        );
      case "not_found":
        return (
          <span className="inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-600">
            {t.bulkStatusNotFound}
          </span>
        );
    }
  };

  const filterOptions: { value: ShareFilter; label: string }[] = [
    { value: "all", label: t.bulkFilterAll },
    { value: "found", label: t.bulkFilterFound },
    { value: "unshipped", label: t.bulkFilterUnshipped },
    { value: "shipped", label: t.bulkFilterShipped },
    { value: "not_found", label: t.bulkFilterNotFound },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-6 text-2xl font-bold">{t.bulkTitle}</h1>

      {toast && (
        <div
          className={`fixed left-1/2 top-4 z-[100] -translate-x-1/2 rounded-lg px-5 py-3 shadow-lg sm:top-6 ${
            toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      )}

      {/* Input area */}
      <div className="mb-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          {t.bulkInputLabel}
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.bulkInputPlaceholder}
          rows={6}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-base sm:text-sm focus:border-blue-500 focus:outline-none"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={handleLookup}
            disabled={looking || !input.trim()}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {looking ? t.bulkLooking : t.bulkLookup}
          </button>
        </div>
      </div>

      {/* Results */}
      {rows.length > 0 && (
        <>
          {/* Summary + outbound actions */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <p className="text-sm text-gray-600">
              {t.bulkSummary(stats.total, stats.unshipped, stats.shipped, stats.notFound)}
            </p>
            <div className="ml-auto flex gap-2">
              <button
                onClick={selected.size === unshippedIds.length ? deselectAll : selectAllUnshipped}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
              >
                {selected.size === unshippedIds.length && unshippedIds.length > 0
                  ? t.bulkDeselectAll
                  : t.bulkSelectAll}
              </button>
              <button
                onClick={handleBulkShip}
                disabled={shipping || selected.size === 0}
                className="rounded-lg bg-orange-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {shipping ? t.bulkShipping : t.bulkShipSelected(selected.size)}
              </button>
            </div>
          </div>

          {/* Share / export bar */}
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
            <span className="mr-1 text-xs font-medium text-gray-500">{t.bulkShareTitle}</span>

            <select
              value={shareFilter}
              onChange={(e) => setShareFilter(e.target.value as ShareFilter)}
              className="rounded-lg border border-gray-200 px-2 py-1.5 text-base sm:text-xs focus:border-blue-500 focus:outline-none"
            >
              {filterOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <span className="text-xs text-gray-400">({filteredRows.length})</span>

            <div className="ml-auto flex gap-2">
              <button
                onClick={handleCopy}
                disabled={filteredRows.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-40"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="9" y="9" width="13" height="13" rx="2" strokeWidth="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeWidth="2" />
                </svg>
                {t.bulkCopyResults}
              </button>
              <button
                onClick={handleExportExcel}
                disabled={filteredRows.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-40"
              >
                {t.bulkExportExcel}
              </button>
              <button
                onClick={handleExportCSV}
                disabled={filteredRows.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-40"
              >
                {t.bulkExportCSV}
              </button>
            </div>
          </div>

          {/* Text preview */}
          <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
            <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap font-mono text-xs text-gray-700">
              {generateTextLines(filteredRows).join("\n")}
            </pre>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  <th className="w-10 px-3 py-3" />
                  <th className="px-3 py-3 font-medium text-gray-600">{t.thOrderNo}</th>
                  <th className="px-3 py-3 font-medium text-gray-600">{t.thWarehouseCode}</th>
                  <th className="px-3 py-3 font-medium text-gray-600">{t.thCustomerName}</th>
                  <th className="px-3 py-3 font-medium text-gray-600">{t.thPhone}</th>
                  <th className="px-3 py-3 font-medium text-gray-600">{t.thStatus}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  if (row.records.length === 0) {
                    return (
                      <tr key={row.orderNo} className="border-b border-gray-50 bg-red-50/30">
                        <td className="px-3 py-3" />
                        <td className="px-3 py-3 font-mono text-xs">{row.orderNo}</td>
                        <td className="px-3 py-3 text-gray-400">—</td>
                        <td className="px-3 py-3 text-gray-400">—</td>
                        <td className="px-3 py-3 text-gray-400">—</td>
                        <td className="px-3 py-3">{statusBadge(row.status)}</td>
                      </tr>
                    );
                  }
                  return row.records.map((rec) => {
                    const canSelect = rec.outboundStatus === "unshipped";
                    const isSelected = selected.has(rec.id);
                    return (
                      <tr
                        key={rec.id}
                        onClick={() => canSelect && toggleSelect(rec.id)}
                        className={`border-b border-gray-50 ${
                          canSelect ? "cursor-pointer hover:bg-blue-50/50" : ""
                        } ${isSelected ? "bg-blue-50" : ""} ${
                          rec.outboundStatus === "shipped" ? "opacity-60" : ""
                        }`}
                      >
                        <td className="px-3 py-3 text-center">
                          {canSelect && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(rec.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600"
                            />
                          )}
                        </td>
                        <td className="px-3 py-3 font-mono text-xs">{rec.inboundOrderNo}</td>
                        <td className="px-3 py-3 font-mono font-bold text-blue-600">
                          {rec.warehouseCode.warehouseCode}
                        </td>
                        <td className="px-3 py-3 font-medium">
                          {rec.inboundName || rec.customer.nameCn}
                        </td>
                        <td className="px-3 py-3 text-gray-600">
                          {rec.inboundPhone || rec.customer.phone}
                        </td>
                        <td className="px-3 py-3">
                          {statusBadge(rec.outboundStatus === "shipped" ? "shipped" : "unshipped")}
                        </td>
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
