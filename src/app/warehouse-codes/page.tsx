"use client";

import { useState, useEffect, useCallback } from "react";

interface WCode {
  id: number;
  areaCode: string;
  seqNo: number;
  warehouseCode: string;
  codeStatus: string;
}

const statusMap: Record<string, { label: string; color: string }> = {
  unused: { label: "未使用", color: "bg-green-100 text-green-700" },
  used: { label: "已使用", color: "bg-yellow-100 text-yellow-700" },
  shipped: { label: "已出库", color: "bg-gray-100 text-gray-500" },
};

export default function WarehouseCodesPage() {
  const [codes, setCodes] = useState<WCode[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [areaFilter, setAreaFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [genForm, setGenForm] = useState({ areaCode: "A", startSeq: 101, endSeq: 150 });
  const [genResult, setGenResult] = useState<{ created: number; skipped: number } | null>(null);

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
    }
  };

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">仓库码池</h1>
        <button
          onClick={() => { setShowGenerate(!showGenerate); setGenResult(null); }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + 批量生成
        </button>
      </div>

      {showGenerate && (
        <div className="mb-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-bold">批量生成仓库码</h2>
          <form onSubmit={handleGenerate} className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">区域</label>
              <select
                value={genForm.areaCode}
                onChange={(e) => setGenForm({ ...genForm, areaCode: e.target.value })}
                className="rounded-lg border border-gray-200 px-3 py-2 text-base sm:text-sm focus:border-blue-500 focus:outline-none"
              >
                {["A", "B", "C", "D", "E", "F"].map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">起始序号</label>
              <input
                type="number"
                value={genForm.startSeq}
                onChange={(e) => setGenForm({ ...genForm, startSeq: parseInt(e.target.value) || 0 })}
                className="w-28 rounded-lg border border-gray-200 px-3 py-2 text-base sm:text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">结束序号</label>
              <input
                type="number"
                value={genForm.endSeq}
                onChange={(e) => setGenForm({ ...genForm, endSeq: parseInt(e.target.value) || 0 })}
                className="w-28 rounded-lg border border-gray-200 px-3 py-2 text-base sm:text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              生成
            </button>
          </form>
          {genResult && (
            <p className="mt-3 text-sm text-gray-600">
              已创建 <span className="font-bold text-green-600">{genResult.created}</span> 个，
              跳过 <span className="font-bold text-yellow-600">{genResult.skipped}</span> 个（已存在）
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
          <option value="">全部区域</option>
          {["A", "B", "C", "D", "E", "F"].map((a) => (
            <option key={a} value={a}>区域 {a}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-base sm:text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">全部状态</option>
          <option value="unused">未使用</option>
          <option value="used">已使用</option>
          <option value="shipped">已出库</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-600">仓库码</th>
              <th className="px-4 py-3 font-medium text-gray-600">区域</th>
              <th className="px-4 py-3 font-medium text-gray-600">序号</th>
              <th className="px-4 py-3 font-medium text-gray-600">状态</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">加载中...</td>
              </tr>
            ) : codes.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">暂无数据</td>
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
          <span>共 {total} 条</span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="rounded px-3 py-1 hover:bg-gray-100 disabled:opacity-40"
            >
              上一页
            </button>
            <span className="px-3 py-1">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="rounded px-3 py-1 hover:bg-gray-100 disabled:opacity-40"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
