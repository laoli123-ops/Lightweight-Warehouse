"use client";

import { useEffect, useRef, useState } from "react";

interface BarcodeScannerProps {
  onScan: (value: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<unknown>(null);
  const stoppedRef = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setError(
        "当前页面不是安全上下文（非 HTTPS），浏览器禁止访问摄像头。\n" +
        "请使用 https://<局域网IP>:3000 访问本页面。"
      );
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.mediaDevices?.getUserMedia) {
      setError(
        "当前浏览器不支持摄像头访问（mediaDevices API 不可用）。\n" +
        "请使用 HTTPS 访问，或换用 Chrome / Safari 浏览器。"
      );
      return;
    }

    let mounted = true;
    stoppedRef.current = false;

    function safeStop(scanner: { stop?: () => Promise<void> } | null) {
      if (stoppedRef.current || !scanner?.stop) return;
      stoppedRef.current = true;
      try {
        scanner.stop().catch(() => {});
      } catch {
        // scanner already stopped — ignore
      }
    }

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");

        if (!mounted || !containerRef.current) return;

        const scanner = new Html5Qrcode("barcode-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 280, height: 120 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            safeStop(scanner);
            onScan(decodedText);
          },
          () => {}
        );
      } catch (e) {
        if (!mounted) return;

        let msg: string;
        if (e instanceof Error) {
          msg = e.message;
          if (e.name === "NotAllowedError") {
            msg = "摄像头权限被拒绝，请在浏览器设置中允许摄像头访问。";
          } else if (e.name === "NotFoundError") {
            msg = "未检测到摄像头设备。";
          } else if (e.name === "NotReadableError") {
            msg = "摄像头被其他应用占用，请关闭其他使用摄像头的应用后重试。";
          }
        } else {
          msg = "无法启动摄像头，请检查权限设置";
        }
        setError(msg);
      }
    }

    startScanner();

    return () => {
      mounted = false;
      safeStop(scannerRef.current as { stop?: () => Promise<void> } | null);
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-sm rounded-xl bg-white p-4 shadow-xl mx-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold">扫描条码</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error ? (
          <div className="rounded-lg bg-red-50 p-4 text-center">
            <p className="whitespace-pre-line text-sm text-red-600">{error}</p>
            <p className="mt-2 text-xs text-gray-500">
              请确保使用 HTTPS 访问并已授予摄像头权限，或使用手动输入
            </p>
          </div>
        ) : (
          <div
            id="barcode-reader"
            ref={containerRef}
            className="overflow-hidden rounded-lg"
          />
        )}

        <p className="mt-3 text-center text-xs text-gray-400">
          将条码对准框内，自动识别
        </p>
      </div>
    </div>
  );
}
