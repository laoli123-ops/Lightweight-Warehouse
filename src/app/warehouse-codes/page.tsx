"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n";

const AREAS = ["A", "B", "C", "D", "E", "F", "G", "H", "L"];

interface WCode {
  id: number;
  areaCode: string;
  seqNo: number;
  warehouseCode: string;
  codeStatus: string;
}

interface Progress {
  area: string;
  lastUsedSeq: number | null;
  nextUnusedSeq: number | null;
  unusedCount: number;
  maxSeqAll: number | null;
  suggestedStartSeq: number;
}

export default function WarehouseCodesPage() {
  return (
    <Suspense>
      <WarehouseCodesInner />
    </Suspense>
  );
}

function WarehouseCodesInner() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const [codes, setCodes] = useState<WCode[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [areaFilter, setAreaFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [genForm, setGenForm] = useState({ areaCode: "A", startSeq: 101, endSeq: 150 });
  const [genResult, setGenResult] = useState<{ created: number; skipped: number } | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [initDone, setInitDone] = useState(false);
  const [selectedQuickRange, setSelectedQuickRange] = useState<15 | 30 | 45 | null>(null);

  // Read query params on mount to prefill the generation form
  useEffect(() => {
    const qArea = searchParams.get("area");
    const qStart = searchParams.get("start");
    const qEnd = searchParams.get("end");
    if (qArea || qStart || qEnd) {
      setGenForm((prev) => ({
        areaCode: qArea || prev.areaCode,
        startSeq: qStart ? parseInt(qStart) || prev.startSeq : prev.startSeq,
        endSeq: qEnd ? parseInt(qEnd) || prev.endSeq : prev.endSeq,
      }));
      setShowGenerate(true);
    }
    setInitDone(true);
  }, [searchParams]);

  const fetchProgress = useCallback(async (area: string) => {
    if (!area) { setProgress(null); return; }
    try {
      const res = await fetch(`/api/warehouse-codes/progress?area=${area}`);
      setProgress(await res.json());
    } catch {
      setProgress(null);
    }
  }, []);

  // Fetch progress when genForm.areaCode changes
  useEffect(() => {
    if (initDone && showGenerate) fetchProgress(genForm.areaCode);
  }, [genForm.areaCode, showGenerate, initDone, fetchProgress]);

  const statusMap: Record<string, { label: string; color: string }> = {
    unused: { label: t.statusUnused, color: "bg-green-100 text-green-700" },
    used: { label: t.statusUsed, color: "bg-yellow-100 text-yellow-700" },
    shipped: { label: t.statusShipped, color: "bg-gray-100 text-gray-500" },
  };

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: "50" });
    if (areaFilter) params.set("area", areaFilter);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/warehouse-codes?${params}`);
    const data = await res.json();
    setCodes(data.codes);
    setTotal(data.total);
    setLoading(false);
  }, [page, areaFilter, statusFilter]);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/warehouse-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(genForm),
    });
    const data = await res.json();
    if (res.ok) {
      setGenResult(data);
      fetchCodes();
      fetchProgress(genForm.areaCode);
    }
  };

  const applyQuickRange = (count: number) => {
    if (!progress) return;
    const s = progress.suggestedStartSeq;
    setGenForm({ ...genForm, startSeq: s, endSeq: s + count - 1 });
    if (count === 15 || count === 30 || count === 45) {
      setSelectedQuickRange(count);
    }
  };

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">{t.navWarehouseCodes}</h1>
        <button
          onClick={() => { setShowGenerate(!showGenerate); setGenResult(null); if (!showGenerate) fetchProgress(genForm.areaCode); }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {t.batchGenerate}
        </button>
      </div>

      {showGenerate && (
        <div className="mb-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-bold">{t.batchGenerateTitle}</h2>

          {/* Progress card */}
          {progress && (
            <div className="mb-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
                {progress.lastUsedSeq !== null ? (
                  <span className="text-gray-600">
                    <span className="inline-block h-2 w-2 rounded-full bg-orange-400 mr-1.5 align-middle" />
                    {t.labelUsedUpTo(progress.area, progress.lastUsedSeq)}
                  </span>
                ) : (
                  <span className="text-gray-400">
                    <span className="inline-block h-2 w-2 rounded-full bg-gray-300 mr-1.5 align-middle" />
                    {t.labelNoneUsed}
                  </span>
                )}
                {progress.maxSeqAll !== null && (
                  <span className="text-gray-500">
                    <span className="inline-block h-2 w-2 rounded-full bg-gray-400 mr-1.5 align-middle" />
                    {t.labelMaxSeq(progress.area, progress.maxSeqAll)}
                  </span>
                )}
                {progress.nextUnusedSeq !== null ? (
                  <span className="text-gray-600">
                    <span className="inline-block h-2 w-2 rounded-full bg-green-400 mr-1.5 align-middle" />
                    {t.labelNextAvail(progress.area, progress.nextUnusedSeq)}
                  </span>
                ) : (
                  <span className="text-gray-600">
                    <span className="inline-block h-2 w-2 rounded-full bg-purple-400 mr-1.5 align-middle" />
                    {t.labelSuggested(progress.area, progress.suggestedStartSeq)}
                  </span>
                )}
                <span className="text-gray-600">
                  <span className="inline-block h-2 w-2 rounded-full bg-blue-400 mr-1.5 align-middle" />
                  {t.labelUnusedCount(progress.unusedCount)}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {[15, 30, 45].map((n) => (
                  <button
                    key={n}
                    onClick={() => applyQuickRange(n)}
                    className={`rounded-lg px-3 py-1 text-xs font-medium ${
                      selectedQuickRange === n
                        ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                        : "border border-gray-200 text-gray-600 hover:bg-white"
                    }`}
                  >
                    {t.wcQuickRange(n)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleGenerate} className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t.labelArea}</label>
              <select
                value={genForm.areaCode}
                onChange={(e) => {
                  setGenForm({ ...genForm, areaCode: e.target.value });
                  setSelectedQuickRange(null);
                }}
                className="rounded-lg border border-gray-200 px-3 py-2 text-base sm:text-sm focus:border-blue-500 focus:outline-none"
              >
                {AREAS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t.labelStartSeq}</label>
              <input
                type="number"
                value={genForm.startSeq}
                onChange={(e) => {
                  setGenForm({ ...genForm, startSeq: parseInt(e.target.value) || 0 });
                  setSelectedQuickRange(null);
                }}
                className="w-28 rounded-lg border border-gray-200 px-3 py-2 text-base sm:text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t.labelEndSeq}</label>
              <input
                type="number"
                value={genForm.endSeq}
                onChange={(e) => {
                  setGenForm({ ...genForm, endSeq: parseInt(e.target.value) || 0 });
                  setSelectedQuickRange(null);
                }}
                className="w-28 rounded-lg border border-gray-200 px-3 py-2 text-base sm:text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              {t.generate}
            </button>
          </form>
          {genResult && (
            <p className="mt-3 text-sm text-gray-600">
              <span className="font-bold text-green-600">{t.genCreated(genResult.created)}</span>
              ，<span className="font-bold text-yellow-600">{t.genSkipped(genResult.skipped)}</span>
            </p>
          )}
        </div>
      )}

      <div className="mb-4 flex gap-2">
        <select
          value={areaFilter}
          onChange={(e) => { setAreaFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-base sm:text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">{t.allAreas}</option>
          {AREAS.map((a) => (
            <option key={a} value={a}>{t.areaLabel(a)}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-base sm:text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">{t.allStatus}</option>
          <option value="unused">{t.statusUnused}</option>
          <option value="used">{t.statusUsed}</option>
          <option value="shipped">{t.statusShipped}</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-600">{t.thWarehouseCode}</th>
              <th className="px-4 py-3 font-medium text-gray-600">{t.labelArea}</th>
              <th className="px-4 py-3 font-medium text-gray-600">{t.thSeqNo}</th>
              <th className="px-4 py-3 font-medium text-gray-600">{t.thStatus}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">{t.loading}</td>
              </tr>
            ) : codes.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">{t.noData}</td>
              </tr>
            ) : (
              codes.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-bold">{c.warehouseCode}</td>
                  <td className="px-4 py-3">{c.areaCode}</td>
                  <td className="px-4 py-3">{c.seqNo}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusMap[c.codeStatus]?.color || ""}`}>
                      {statusMap[c.codeStatus]?.label || c.codeStatus}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <span>{t.totalItems(total)}</span>
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
