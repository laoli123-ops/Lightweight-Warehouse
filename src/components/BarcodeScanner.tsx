"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";

interface BarcodeScannerProps {
  onScan: (value: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const stoppedRef = useRef(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setError(t.scanNotSecure);
      return;
    }

    if (
      typeof navigator !== "undefined" &&
      !navigator.mediaDevices?.getUserMedia
    ) {
      setError(t.scanNoMedia);
      return;
    }

    let mounted = true;
    stoppedRef.current = false;

    async function startScanner() {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const ZXing = await import("@zxing/library");

        if (!mounted || !videoRef.current) return;

        const hints = new Map();
        hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [
          ZXing.BarcodeFormat.CODE_128,
          ZXing.BarcodeFormat.CODE_39,
          ZXing.BarcodeFormat.EAN_13,
          ZXing.BarcodeFormat.EAN_8,
          ZXing.BarcodeFormat.UPC_A,
          ZXing.BarcodeFormat.UPC_E,
          ZXing.BarcodeFormat.ITF,
          ZXing.BarcodeFormat.CODABAR,
          ZXing.BarcodeFormat.QR_CODE,
        ]);
        hints.set(ZXing.DecodeHintType.TRY_HARDER, true);

        const reader = new BrowserMultiFormatReader(hints, {
          delayBetweenScanAttempts: 400,
        });

        const controls = await reader.decodeFromConstraints(
          {
            video: {
              facingMode: "environment",
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          videoRef.current,
          (result, _err, controls) => {
            if (result && !stoppedRef.current) {
              stoppedRef.current = true;
              controls.stop();
              controlsRef.current = null;
              onScan(result.getText());
            }
          }
        );

        if (!mounted || stoppedRef.current) {
          controls.stop();
          return;
        }

        controlsRef.current = controls;
        setReady(true);
      } catch (e) {
        if (!mounted) return;

        let msg: string;
        if (e instanceof Error) {
          msg = e.message;
          if (e.name === "NotAllowedError") msg = t.scanPermDenied;
          else if (e.name === "NotFoundError") msg = t.scanNotFound;
          else if (e.name === "NotReadableError") msg = t.scanNotReadable;
        } else {
          msg = t.scanGenericError;
        }
        setError(msg);
      }
    }

    startScanner();

    return () => {
      mounted = false;
      if (!stoppedRef.current && controlsRef.current) {
        stoppedRef.current = true;
        try {
          controlsRef.current.stop();
        } catch {
          /* already stopped */
        }
        controlsRef.current = null;
      }
    };
  }, [onScan, t]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold">{t.scanTitle}</h3>
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
            <p className="mt-2 text-xs text-gray-500">{t.scanHintSecure}</p>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-lg bg-black">
            <video
              ref={videoRef}
              className="w-full"
              style={{ maxHeight: "60vh" }}
              playsInline
              muted
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-16 w-64 rounded border-2 border-white/60" />
            </div>
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <span className="text-sm text-white">{t.scanStarting}</span>
              </div>
            )}
          </div>
        )}

        <p className="mt-3 text-center text-xs text-gray-400">{t.scanGuide}</p>
      </div>
    </div>
  );
}
