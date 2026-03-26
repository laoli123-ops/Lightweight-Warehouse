"use client";

import { useState } from "react";

const COLS = 3;
const ROWS = 5;
const PER_PAGE = COLS * ROWS;

function generateCodes(prefix: string, start: number, end: number): string[] {
  const codes: string[] = [];
  for (let i = start; i <= end; i++) {
    codes.push(`${prefix}${i}`);
  }
  return codes;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    pages.push(arr.slice(i, i + size));
  }
  return pages;
}

export default function LabelsPage() {
  const [prefix, setPrefix] = useState("A");
  const [start, setStart] = useState(101);
  const [end, setEnd] = useState(115);
  const [codes, setCodes] = useState<string[]>([]);

  const totalCount = end >= start ? end - start + 1 : 0;
  const pageCount = Math.ceil(totalCount / PER_PAGE);

  const handleGenerate = () => {
    if (!prefix || end < start) return;
    setCodes(generateCodes(prefix, start, end));
  };

  const pages = chunkArray(codes, PER_PAGE);

  return (
    <div>
      {/* ---- Controls (hidden when printing) ---- */}
      <div className="mx-auto max-w-3xl print:hidden">
        <h1 className="mb-6 text-2xl font-bold">标签打印</h1>

        <div className="mb-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                区域前缀
              </label>
              <select
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                {["A", "B", "C", "D", "E", "F"].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                起始编号
              </label>
              <input
                type="number"
                value={start}
                onChange={(e) => setStart(parseInt(e.target.value) || 0)}
                className="w-28 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                结束编号
              </label>
              <input
                type="number"
                value={end}
                onChange={(e) => setEnd(parseInt(e.target.value) || 0)}
                className="w-28 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={!prefix || end < start}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              生成预览
            </button>

            {codes.length > 0 && (
              <button
                onClick={() => window.print()}
                className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                打印
              </button>
            )}
          </div>

          {totalCount > 0 && (
            <p className="mt-3 text-sm text-gray-500">
              共 {totalCount} 个标签，{pageCount} 页（每页 {PER_PAGE} 个）
            </p>
          )}
        </div>

        {codes.length === 0 && (
          <div className="mt-8 text-center text-gray-400">
            <p>输入区域前缀和编号范围，点击"生成预览"</p>
            <p className="mt-2 text-sm">
              适配 100mm × 150mm 标签纸，每页 3×5 = 15 个标签
            </p>
          </div>
        )}
      </div>

      {/* ---- Label pages (visible in both screen preview & print) ---- */}
      {pages.length > 0 && (
        <div id="print-area" className="mx-auto mt-6 print:mt-0">
          {pages.map((page, pageIdx) => (
            <div
              key={pageIdx}
              className="label-page mx-auto mb-8 border border-gray-200 bg-white print:mb-0 print:border-0"
            >
              {page.map((code, i) => (
                <div key={i} className="label-cell">
                  <span className="label-text">{code}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ---- Embedded styles for precise mm-based print layout ---- */}
      <style jsx global>{`
        /* ========== Screen preview ========== */
        .label-page {
          display: grid;
          grid-template-columns: repeat(${COLS}, 1fr);
          grid-template-rows: repeat(${ROWS}, 1fr);
          width: 100mm;
          height: 150mm;
          box-sizing: border-box;
        }

        .label-cell {
          display: flex;
          align-items: center;
          justify-content: center;
          border: 0.5px solid #d1d5db;
          box-sizing: border-box;
        }

        .label-text {
          font-family: "Helvetica Neue", Arial, "PingFang SC", sans-serif;
          font-size: 7mm;
          font-weight: 900;
          letter-spacing: 0.5mm;
          user-select: none;
        }

        /* ========== Print ========== */
        @media print {
          @page {
            size: 100mm 150mm;
            margin: 0;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100mm;
            height: 150mm;
            overflow: visible !important;
          }

          /* Hide everything, then reveal only the labels */
          body * {
            visibility: hidden;
          }
          #print-area,
          #print-area * {
            visibility: visible;
          }

          /* Pull print area out of the normal flow */
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0 !important;
            padding: 0 !important;
            width: 100mm;
          }

          .label-page {
            width: 100mm;
            height: 150mm;
            margin: 0;
            padding: 0;
            border: none;
            page-break-after: always;
            break-after: page;
          }
          .label-page:last-child {
            page-break-after: avoid;
            break-after: avoid;
          }

          .label-cell {
            border: 0.3px solid #999;
          }

          .label-text {
            font-size: 7mm;
            font-weight: 900;
            color: #000;
          }
        }
      `}</style>
    </div>
  );
}
