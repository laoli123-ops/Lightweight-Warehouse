"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";

const COLS = 3;
const ROWS = 5;
const PER_PAGE = COLS * ROWS;
const AREAS = ["A", "B", "C", "D", "E", "F", "G", "H", "L"];

interface Progress {
  area: string;
  lastUsedSeq: number | null;
  nextUnusedSeq: number | null;
  unusedCount: number;
  maxSeqAll: number | null;
  suggestedStartSeq: number;
}

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
  const { t } = useI18n();
  const router = useRouter();
  const [prefix, setPrefix] = useState("A");
  const [start, setStart] = useState(101);
  const [end, setEnd] = useState(115);
  const [codes, setCodes] = useState<string[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [selectedContinuePages, setSelectedContinuePages] = useState<1 | 2 | 3>(1);
  const [warning, setWarning] = useState<string | null>(null);
  const [printOrder, setPrintOrder] = useState<"normal" | "stack_optimized">("stack_optimized");

  const totalCount = end >= start ? end - start + 1 : 0;
  const pageCount = Math.ceil(totalCount / PER_PAGE);

  const fetchProgress = useCallback(async (area: string) => {
    setLoadingProgress(true);
    try {
      const res = await fetch(`/api/warehouse-codes/progress?area=${area}`);
      const data: Progress = await res.json();
      setProgress(data);

      if (data.nextUnusedSeq !== null) {
        setStart(data.nextUnusedSeq);
        setEnd(data.nextUnusedSeq + PER_PAGE - 1);
      }
    } catch {
      setProgress(null);
    }
    setLoadingProgress(false);
  }, []);

  useEffect(() => {
    fetchProgress(prefix);
  }, [prefix, fetchProgress]);

  const handleGenerate = () => {
    if (!prefix || end < start) return;
    setCodes(generateCodes(prefix, start, end));
  };

  const autoFillPages = (pageNum: number) => {
    if (!progress?.nextUnusedSeq) return;
    const needed = PER_PAGE * pageNum;
    if (progress.unusedCount < needed) {
      setWarning(t.labelNotEnough(progress.area, progress.unusedCount, needed));
      return;
    }
    setWarning(null);
    const s = progress.nextUnusedSeq;
    const e = s + needed - 1;
    setStart(s);
    setEnd(e);
    setCodes(generateCodes(prefix, s, e));
    if (pageNum === 1 || pageNum === 2 || pageNum === 3) {
      setSelectedContinuePages(pageNum);
    }
  };

  const goGenerate = () => {
    if (!progress) return;
    const s = progress.suggestedStartSeq;
    const e = s + PER_PAGE - 1;
    router.push(`/warehouse-codes?area=${prefix}&start=${s}&end=${e}`);
  };

  const chunked = chunkArray(codes, PER_PAGE);
  const pages = printOrder === "stack_optimized" ? [...chunked].reverse() : chunked;

  return (
    <div>
      <div className="mx-auto max-w-3xl print:hidden">
        <h1 className="mb-6 text-2xl font-bold">{t.labelsTitle}</h1>

        <div className="mb-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          {/* Area selector + number inputs */}
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t.labelPrefix}
              </label>
              <select
                value={prefix}
                onChange={(e) => {
                  setPrefix(e.target.value);
                  setCodes([]);
                  setWarning(null);
                }}
                className="rounded-lg border border-gray-200 px-3 py-2 text-base sm:text-sm focus:border-blue-500 focus:outline-none"
              >
                {AREAS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t.labelStartNo}
              </label>
              <input
                type="number"
                value={start}
                onChange={(e) => setStart(parseInt(e.target.value) || 0)}
                className="w-28 rounded-lg border border-gray-200 px-3 py-2 text-base sm:text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t.labelEndNo}
              </label>
              <input
                type="number"
                value={end}
                onChange={(e) => setEnd(parseInt(e.target.value) || 0)}
                className="w-28 rounded-lg border border-gray-200 px-3 py-2 text-base sm:text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={!prefix || end < start}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {t.generatePreview}
            </button>

            {codes.length > 0 && (
              <button
                onClick={() => window.print()}
                className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                {t.print}
              </button>
            )}
          </div>

          {totalCount > 0 && (
            <p className="mt-3 text-sm text-gray-500">
              {t.labelSummary(totalCount, pageCount, PER_PAGE)}
            </p>
          )}

          {pageCount > 1 && (
            <div className="mt-3 flex items-center gap-1.5">
              <div className="flex rounded-lg bg-gray-100 p-0.5">
                <button
                  onClick={() => setPrintOrder("normal")}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    printOrder === "normal"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t.labelOrderNormal}
                </button>
                <button
                  onClick={() => setPrintOrder("stack_optimized")}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    printOrder === "stack_optimized"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t.labelOrderStack}
                </button>
              </div>
              <span className="text-xs text-gray-400">
                {printOrder === "normal" ? t.labelOrderNormalHint : t.labelOrderStackHint}
              </span>
            </div>
          )}
        </div>

        {/* Progress info + quick actions */}
        <div className="mb-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          {loadingProgress ? (
            <p className="text-sm text-gray-400">{t.loading}</p>
          ) : progress?.nextUnusedSeq === null && progress ? (
            <div>
              <p className="text-sm font-medium text-red-500">
                {t.labelNoUnused(progress.area, progress.suggestedStartSeq)}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
                {progress.maxSeqAll !== null && (
                  <span className="text-gray-500">
                    <span className="inline-block h-2 w-2 rounded-full bg-gray-400 mr-1.5 align-middle" />
                    {t.labelMaxSeq(progress.area, progress.maxSeqAll)}
                  </span>
                )}
                <span className="text-gray-600">
                  <span className="inline-block h-2 w-2 rounded-full bg-purple-400 mr-1.5 align-middle" />
                  {t.labelSuggested(progress.area, progress.suggestedStartSeq)}
                </span>
              </div>
              <button
                onClick={goGenerate}
                className="mt-3 rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-purple-700"
              >
                {t.labelGoGenerate}
              </button>
            </div>
          ) : progress ? (
            <>
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
                <span className="text-gray-600">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-400 mr-1.5 align-middle" />
                  {t.labelNextAvail(progress.area, progress.nextUnusedSeq!)}
                </span>
                <span className="text-gray-600">
                  <span className="inline-block h-2 w-2 rounded-full bg-blue-400 mr-1.5 align-middle" />
                  {t.labelUnusedCount(progress.unusedCount)}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {([1, 2, 3] as const).map((n) => {
                  const needed = PER_PAGE * n;
                  const enough = progress!.unusedCount >= needed;
                  const label = n === 1 ? t.labelContinue1 : n === 2 ? t.labelContinue2 : t.labelContinue3;
                  return (
                    <button
                      key={n}
                      onClick={() => autoFillPages(n)}
                      className={`rounded-lg px-3.5 py-1.5 text-xs font-medium ${
                        !enough
                          ? "border border-amber-300 text-amber-600 hover:bg-amber-50"
                          : selectedContinuePages === n
                            ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                            : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {warning && progress && (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5">
                  <p className="text-xs font-medium text-amber-700">{warning}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[15, 30, 45].map((n) => {
                      const s = progress.suggestedStartSeq;
                      return (
                        <button
                          key={n}
                          onClick={() => router.push(`/warehouse-codes?area=${prefix}&start=${s}&end=${s + n - 1}`)}
                          className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700"
                        >
                          {t.labelGenMore(n)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {codes.length === 0 && (
          <div className="mt-8 text-center text-gray-400">
            <p>{t.labelHint}</p>
            <p className="mt-2 text-sm">{t.labelSpec}</p>
          </div>
        )}
      </div>

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

      <style jsx global>{`
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
        @media print {
          @page { size: 100mm 150mm; margin: 0; }
          html, body {
            margin: 0 !important; padding: 0 !important;
            width: 100mm; height: 150mm; overflow: visible !important;
          }
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area {
            position: absolute; left: 0; top: 0;
            margin: 0 !important; padding: 0 !important; width: 100mm;
          }
          .label-page {
            width: 100mm; height: 150mm; margin: 0; padding: 0; border: none;
            page-break-after: always; break-after: page;
          }
          .label-page:last-child { page-break-after: avoid; break-after: avoid; }
          .label-cell { border: 0.3px solid #999; }
          .label-text { font-size: 7mm; font-weight: 900; color: #000; }
        }
      `}</style>
    </div>
  );
}
