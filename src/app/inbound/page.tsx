"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { useI18n } from "@/lib/i18n";

interface Customer {
  id: number;
  nameCn: string;
  namePinyin: string;
  phone: string;
  phoneLast4: string;
}

interface WCode {
  id: number;
  warehouseCode: string;
  areaCode: string;
  seqNo: number;
}

interface Toast {
  type: "success" | "error";
  message: string;
}

export default function InboundPage() {
  const { t } = useI18n();
  const [customerSearch, setCustomerSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [inboundOrderNo, setInboundOrderNo] = useState("");
  const [unusedCodes, setUnusedCodes] = useState<WCode[]>([]);
  const [selectedCode, setSelectedCode] = useState<WCode | null>(null);
  const [areaFilter, setAreaFilter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const orderInputRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const showToast = useCallback((type: Toast["type"], message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ type, message });
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const handleScanResult = useCallback((value: string) => {
    setInboundOrderNo(value.trim());
    setShowScanner(false);
  }, []);

  useEffect(() => {
    fetchUnusedCodes();
  }, []);

  const fetchUnusedCodes = async () => {
    const res = await fetch("/api/warehouse-codes/unused");
    const data = await res.json();
    setUnusedCodes(data);
  };

  const searchCustomers = async () => {
    if (!customerSearch.trim()) return;
    const res = await fetch(`/api/customers?q=${encodeURIComponent(customerSearch)}&pageSize=50`);
    const data = await res.json();
    setCustomers(data.customers);
  };

  const handleSubmit = async (forceCreate = false) => {
    if (!selectedCustomer || !inboundOrderNo || !selectedCode) {
      showToast("error", t.fillAllFields);
      return;
    }

    setSubmitting(true);
    setDuplicateWarning("");

    const res = await fetch("/api/inbound", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: selectedCustomer.id,
        inboundOrderNo,
        warehouseCodeId: selectedCode.id,
        forceCreate,
      }),
    });

    const data = await res.json();

    if (res.status === 409 && data.duplicate) {
      setDuplicateWarning(t.duplicateOrderWarning);
      setSubmitting(false);
      return;
    }

    if (!res.ok) {
      showToast("error", data.error || t.inboundFailed);
      setSubmitting(false);
      return;
    }

    showToast(
      "success",
      t.inboundSuccess(data.record.serialNo, data.record.warehouseCode.warehouseCode)
    );
    setSelectedCustomer(null);
    setInboundOrderNo("");
    setSelectedCode(null);
    setCustomerSearch("");
    setCustomers([]);
    setDuplicateWarning("");
    fetchUnusedCodes();
    setSubmitting(false);
  };

  const filteredCodes = areaFilter
    ? unusedCodes.filter((c) => c.areaCode === areaFilter)
    : unusedCodes;

  const uniqueAreas = [...new Set(unusedCodes.map((c) => c.areaCode))].sort();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold">{t.inboundTitle}</h1>

      {toast && (
        <div
          className={`fixed left-1/2 top-4 z-[100] -translate-x-1/2 rounded-lg px-5 py-3 shadow-lg transition-all sm:top-6 ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          <p className="text-sm font-medium whitespace-pre-line">{toast.message}</p>
        </div>
      )}

      <div className="space-y-6">
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-bold">{t.step1}</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={t.step1Placeholder}
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchCustomers()}
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-base sm:text-sm focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={searchCustomers}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium hover:bg-gray-200"
            >
              {t.search}
            </button>
          </div>

          {customers.length > 0 && (
            <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-gray-100">
              {customers.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedCustomer(c);
                    setCustomers([]);
                  }}
                  className={`cursor-pointer border-b border-gray-50 px-4 py-2.5 text-sm hover:bg-blue-50 ${
                    selectedCustomer?.id === c.id ? "bg-blue-50" : ""
                  }`}
                >
                  <span className="font-medium">{c.nameCn}</span>
                  <span className="ml-2 text-gray-400">{c.namePinyin}</span>
                  <span className="ml-2 text-gray-500">{c.phone}</span>
                </div>
              ))}
            </div>
          )}

          {selectedCustomer && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2.5 text-sm">
              <span className="font-medium text-blue-700">{t.selected}</span>
              <span>{selectedCustomer.nameCn}</span>
              <span className="text-gray-500">({selectedCustomer.phone})</span>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                {t.cancel}
              </button>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-bold">{t.step2}</h2>
          <div className="flex gap-2">
            <input
              ref={orderInputRef}
              type="text"
              inputMode="text"
              autoComplete="off"
              placeholder={t.step2Placeholder}
              value={inboundOrderNo}
              onChange={(e) => setInboundOrderNo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.preventDefault();
              }}
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-base sm:text-sm focus:border-blue-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="flex items-center gap-1.5 rounded-lg bg-gray-800 px-3 py-2 text-sm font-medium text-white hover:bg-gray-900"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9V5a2 2 0 012-2h4M3 15v4a2 2 0 002 2h4m8-18h4a2 2 0 012 2v4m0 6v4a2 2 0 01-2 2h-4" />
              </svg>
              {t.scan}
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-400">{t.step2Hint}</p>
        </div>

        {showScanner && (
          <BarcodeScanner
            onScan={handleScanResult}
            onClose={() => setShowScanner(false)}
          />
        )}

        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-bold">{t.step3}</h2>

          <div className="mb-3 flex gap-2">
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-base sm:text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">{t.allAreas}</option>
              {uniqueAreas.map((a) => (
                <option key={a} value={a}>{t.areaLabel(a)}</option>
              ))}
            </select>
            <span className="self-center text-sm text-gray-500">
              {t.available(filteredCodes.length)}
            </span>
          </div>

          {selectedCode && (
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2.5 text-sm">
              <span className="font-medium text-blue-700">{t.selected}</span>
              <span className="font-mono font-bold">{selectedCode.warehouseCode}</span>
              <button
                onClick={() => setSelectedCode(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                {t.cancel}
              </button>
            </div>
          )}

          <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
            {filteredCodes.slice(0, 100).map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCode(c)}
                className={`rounded-lg border px-2 py-1.5 text-xs font-mono font-medium transition-colors ${
                  selectedCode?.id === c.id
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                }`}
              >
                {c.warehouseCode}
              </button>
            ))}
          </div>

          {filteredCodes.length > 100 && (
            <p className="mt-2 text-xs text-gray-400">{t.showFirst100(filteredCodes.length)}</p>
          )}
        </div>

        {duplicateWarning && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm font-medium text-yellow-800">{duplicateWarning}</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => handleSubmit(true)}
                className="rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700"
              >
                {t.confirmInbound}
              </button>
              <button
                onClick={() => setDuplicateWarning("")}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => handleSubmit(false)}
          disabled={submitting || !selectedCustomer || !inboundOrderNo || !selectedCode}
          className="w-full rounded-xl bg-blue-600 py-3 text-base font-bold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? t.submitting : t.confirmInbound}
        </button>
      </div>
    </div>
  );
}
