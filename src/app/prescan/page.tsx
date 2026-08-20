"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BarcodeScanner } from "@/components/BarcodeScanner";

const STORAGE_KEY = "warehouse-prescan-order-numbers";

export default function PrescanPage() {
  const [orderNo, setOrderNo] = useState("");
  const [orderNos, setOrderNos] = useState<string[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [finished, setFinished] = useState(false);
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    let savedOrderNos: string[] = [];
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(saved)) savedOrderNos = saved.filter((v): v is string => typeof v === "string");
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    const timer = window.setTimeout(() => setOrderNos(savedOrderNos), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orderNos));
  }, [orderNos]);

  useEffect(() => {
    return () => {
      void audioContextRef.current?.close();
    };
  }, []);

  const prepareScanSound = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    if (audioContextRef.current.state === "suspended") {
      void audioContextRef.current.resume();
    }
  };

  const playScanSound = () => {
    const context = audioContextRef.current;
    if (!context || context.state !== "running") return;

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(880, context.currentTime);
    oscillator.frequency.setValueAtTime(1175, context.currentTime + 0.07);
    gain.gain.setValueAtTime(0.42, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.22);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.22);
  };

  const notify = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 1800);
  };

  const addOrderNo = useCallback((raw: string, withSound = false) => {
    const value = raw.trim();
    if (!value) return;
    setOrderNos((current) => {
      if (current.includes(value)) {
        notify(`单号 ${value} 已扫描，请勿重复`);
        return current;
      }
      if (withSound) playScanSound();
      notify(`已记录：${value}`);
      return [value, ...current];
    });
    setOrderNo("");
    setFinished(false);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const handleCameraScan = useCallback((value: string) => {
    addOrderNo(value, true);
  }, [addOrderNo]);

  const copyAll = async () => {
    const text = [...orderNos].reverse().join("\n");
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    notify(`已复制 ${orderNos.length} 个快递单号`);
  };

  const clearAll = () => {
    if (!window.confirm(`确定清空已扫描的 ${orderNos.length} 个单号？`)) return;
    setOrderNos([]);
    setFinished(false);
    inputRef.current?.focus();
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">快递单号预扫描揽收</h1>
        <p className="mt-1 text-sm text-gray-500">连续扫描快递条形码，结束后可一次复制全部单号</p>
      </div>

      {message && (
        <div className="fixed left-1/2 top-4 z-[100] -translate-x-1/2 rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white shadow-lg">
          {message}
        </div>
      )}

      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
        <label className="mb-3 block text-base font-bold">扫描或输入快递单号</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            ref={inputRef}
            autoFocus
            type="text"
            inputMode="text"
            autoComplete="off"
            placeholder="扫码枪扫描后回车 / 手动输入"
            value={orderNo}
            onChange={(e) => setOrderNo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addOrderNo(orderNo);
              }
            }}
            className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-3 text-base focus:border-blue-500 focus:outline-none"
          />
          <div className="flex gap-2">
            <button onClick={() => addOrderNo(orderNo)} className="flex-1 rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 sm:flex-none">添加</button>
            <button onClick={() => { prepareScanSound(); setShowScanner(true); }} className="flex-1 rounded-lg bg-gray-800 px-5 py-3 text-sm font-bold text-white hover:bg-gray-900 sm:flex-none">扫码</button>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-400">扫码枪请保持输入框聚焦；重复单号不会再次加入</p>
      </div>

      <div className="mt-5 rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="font-bold">已扫描清单 <span className="ml-1 text-blue-600">{orderNos.length}</span></h2>
          {orderNos.length > 0 && <button onClick={clearAll} className="text-sm text-red-500 hover:text-red-700">清空</button>}
        </div>
        {orderNos.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-gray-400">还没有扫描快递单号</div>
        ) : (
          <div className="max-h-[45vh] divide-y divide-gray-50 overflow-y-auto">
            {orderNos.map((value, index) => (
              <div key={value} className="flex items-center gap-3 px-5 py-3">
                <span className="w-8 shrink-0 text-right text-xs text-gray-400">{orderNos.length - index}</span>
                <span className="min-w-0 flex-1 break-all font-mono text-sm font-medium">{value}</span>
                <button onClick={() => setOrderNos((items) => items.filter((item) => item !== value))} className="shrink-0 text-xs text-red-400 hover:text-red-600">删除</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {orderNos.length > 0 && (
        <div className="mt-5 space-y-3">
          {!finished ? (
            <button onClick={() => setFinished(true)} className="w-full rounded-xl bg-green-600 py-3 text-base font-bold text-white hover:bg-green-700">结束扫描（共 {orderNos.length} 个）</button>
          ) : (
            <div className="rounded-xl border border-green-200 bg-green-50 p-5">
              <p className="mb-3 text-center font-bold text-green-800">本次扫描完成，共 {orderNos.length} 个快递单号</p>
              <button onClick={copyAll} className="w-full rounded-xl bg-green-600 py-3 text-base font-bold text-white hover:bg-green-700">复制全部单号</button>
              <button onClick={() => { setFinished(false); inputRef.current?.focus(); }} className="mt-2 w-full py-2 text-sm text-green-700 hover:text-green-900">继续扫描</button>
            </div>
          )}
        </div>
      )}

      {showScanner && <BarcodeScanner continuous onScan={handleCameraScan} onClose={() => setShowScanner(false)} />}
    </div>
  );
}
