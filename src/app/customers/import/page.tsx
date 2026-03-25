"use client";

import { useState, useRef } from "react";

interface ImportResult {
  total: number;
  success: number;
  failed: number;
  errors: string[];
}

export default function CustomerImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/customers/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ total: 0, success: 0, failed: 0, errors: ["导入失败，请检查文件格式"] });
    }

    setImporting(false);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">客户数据导入</h1>

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="mb-2 text-sm font-medium text-gray-700">文件要求</h2>
          <ul className="space-y-1 text-sm text-gray-500">
            <li>支持 .xlsx 和 .csv 格式</li>
            <li>必须包含列：<span className="font-medium text-gray-700">姓名</span>、<span className="font-medium text-gray-700">手机号</span></li>
            <li>也支持列名：中文名、客户姓名、name、电话、phone、手机、联系电话</li>
            <li>手机号允许重复，不会去重</li>
          </ul>
        </div>

        <div className="mb-4 rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.csv"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              setResult(null);
            }}
            className="hidden"
          />
          {file ? (
            <div>
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
              <p className="mt-1 text-xs text-gray-500">
                {(file.size / 1024).toFixed(1)} KB
              </p>
              <button
                onClick={() => {
                  setFile(null);
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="mt-2 text-sm text-red-500 hover:text-red-700"
              >
                移除
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-500">点击或拖拽文件到此处</p>
              <button
                onClick={() => fileRef.current?.click()}
                className="mt-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium hover:bg-gray-200"
              >
                选择文件
              </button>
            </div>
          )}
        </div>

        <button
          onClick={handleImport}
          disabled={!file || importing}
          className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {importing ? "导入中..." : "开始导入"}
        </button>
      </div>

      {result && (
        <div className="mt-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold">导入结果</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-2xl font-bold text-gray-900">{result.total}</p>
              <p className="text-xs text-gray-500">总行数</p>
            </div>
            <div className="rounded-lg bg-green-50 p-3">
              <p className="text-2xl font-bold text-green-600">{result.success}</p>
              <p className="text-xs text-gray-500">成功</p>
            </div>
            <div className="rounded-lg bg-red-50 p-3">
              <p className="text-2xl font-bold text-red-600">{result.failed}</p>
              <p className="text-xs text-gray-500">失败</p>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-medium text-red-600">错误详情</h3>
              <ul className="max-h-40 overflow-y-auto space-y-1 text-sm text-red-500">
                {result.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
