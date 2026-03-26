"use client";

import { useState, useEffect } from "react";

interface LabelCode {
  id: number;
  areaCode: string;
  seqNo: number;
  warehouseCode: string;
  codeStatus: string;
}

interface AreaStat {
  area: string;
  unused: number;
}

export default function LabelsPage() {
  const [area, setArea] = useState("");
  const [count, setCount] = useState(10);
  const [labels, setLabels] = useState<LabelCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [areaStats, setAreaStats] = useState<AreaStat[]>([]);

  useEffect(() => {
    fetchAreaStats();
  }, []);

  const fetchAreaStats = async () => {
    const res = await fetch("/api/warehouse-codes/unused");
    const data = await res.json();
    if (!Array.isArray(data)) return;

    const map = new Map<string, number>();
    for (const c of data) {
      map.set(c.areaCode, (map.get(c.areaCode) || 0) + 1);
    }

    const stats = [...map.entries()]
      .map(([a, n]) => ({ area: a, unused: n }))
      .sort((a, b) => a.area.localeCompare(b.area));

    setAreaStats(stats);
    if (stats.length > 0 && !area) {
      setArea(stats[0].area);
    }
  };

  const currentUnused = areaStats.find((s) => s.area === area)?.unused || 0;

  const fetchLabels = async () => {
    if (!area || count <= 0) return;
    setLoading(true);
    const params = new URLSearchParams({ area, count: String(count) });
    const res = await fetch(`/api/labels?${params}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      setLabels(data);
    }
    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold print:hidden">标签预览</h1>

      <div className="mb-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm print:hidden">
        <h2 className="mb-4 text-base font-bold">生成标签</h2>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">区域</label>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              {areaStats.length === 0 && (
                <option value="">暂无可用区域</option>
              )}
              {areaStats.map((s) => (
                <option key={s.area} value={s.area}>
                  {s.area} 区（剩余 {s.unused} 个）
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              数量（最多 {currentUnused}）
            </label>
            <input
              type="number"
              min={1}
              max={currentUnused}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 0)}
              className="w-28 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button
            onClick={fetchLabels}
            disabled={loading || !area || count <= 0 || count > currentUnused}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "加载中..." : "生成预览"}
          </button>
          {labels.length > 0 && (
            <button
              onClick={handlePrint}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              打印标签
            </button>
          )}
        </div>
        {currentUnused === 0 && area && (
          <p className="mt-3 text-sm text-red-500">该区域没有可用的仓库码，请先到仓库码池生成。</p>
        )}
      </div>

      {labels.length > 0 && (
        <>
          <p className="mb-3 text-sm text-gray-500 print:hidden">
            共 {labels.length} 个标签，打印后裁剪使用
          </p>
          <div
            id="label-grid"
            className="grid grid-cols-2 gap-0 sm:grid-cols-3 md:grid-cols-4"
          >
            {labels.map((label) => (
              <div
                key={label.id}
                className="flex items-center justify-center border border-dashed border-gray-300 bg-white print:border-solid print:border-gray-400"
                style={{ height: "60mm", width: "50mm" }}
              >
                <span className="text-4xl font-black tracking-widest">
                  {label.warehouseCode}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {labels.length === 0 && !loading && (
        <div className="mt-8 text-center text-gray-400 print:hidden">
          <p>选择区域和数量，自动获取未使用的仓库码生成标签</p>
          <p className="mt-2 text-sm">适配 100mm × 150mm 标签纸，打印后沿虚线裁剪</p>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #label-grid, #label-grid * { visibility: visible; }
          #label-grid {
            position: absolute;
            left: 0;
            top: 0;
            display: grid;
            grid-template-columns: repeat(2, 50mm);
            gap: 0;
          }
        }
      `}</style>
    </div>
  );
}
