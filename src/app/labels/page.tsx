"use client";

import { useState } from "react";

interface LabelCode {
  id: number;
  areaCode: string;
  seqNo: number;
  warehouseCode: string;
  codeStatus: string;
}

export default function LabelsPage() {
  const [area, setArea] = useState("A");
  const [startSeq, setStartSeq] = useState(101);
  const [endSeq, setEndSeq] = useState(110);
  const [labels, setLabels] = useState<LabelCode[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLabels = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      area,
      startSeq: String(startSeq),
      endSeq: String(endSeq),
    });
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
        <h2 className="mb-4 text-base font-bold">选择标签范围</h2>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">区域</label>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
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
              value={startSeq}
              onChange={(e) => setStartSeq(parseInt(e.target.value) || 0)}
              className="w-28 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">结束序号</label>
            <input
              type="number"
              value={endSeq}
              onChange={(e) => setEndSeq(parseInt(e.target.value) || 0)}
              className="w-28 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button
            onClick={fetchLabels}
            disabled={loading}
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
      </div>

      {labels.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 print:grid-cols-3 print:gap-2">
          {labels.map((label) => (
            <div
              key={label.id}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white p-6 print:rounded-none print:border-solid print:p-4"
            >
              <div className="text-3xl font-black tracking-wider print:text-2xl">
                {label.warehouseCode}
              </div>
              <div className="mt-2 text-xs text-gray-400">
                区域 {label.areaCode} - {label.seqNo}
              </div>
              {/* Barcode placeholder for future ZPL support */}
              <div className="mt-3 flex h-10 w-full items-center justify-center bg-gray-50 print:bg-white">
                <svg className="h-8 w-24">
                  {/* Simple barcode visual representation */}
                  {Array.from({ length: 20 }, (_, i) => (
                    <rect
                      key={i}
                      x={i * 5}
                      y={0}
                      width={i % 3 === 0 ? 3 : 1.5}
                      height={32}
                      fill="black"
                    />
                  ))}
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}

      {labels.length === 0 && !loading && (
        <div className="mt-8 text-center text-gray-400 print:hidden">
          <p>请选择区域和序号范围，然后点击"生成预览"</p>
          <p className="mt-2 text-sm">生成后可直接打印标签贴在包裹上</p>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .grid, .grid * { visibility: visible; }
          .grid { position: absolute; left: 0; top: 0; }
        }
      `}</style>
    </div>
  );
}
