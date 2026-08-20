"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";

interface BarcodeScannerProps {
  onScan: (value: string) => void;
  onClose: () => void;
  continuous?: boolean;
}

interface NativeBarcodeDetector {
  detect: (source: HTMLCanvasElement) => Promise<Array<{ rawValue: string }>>;
}

interface NativeBarcodeDetectorConstructor {
  new (options: { formats: string[] }): NativeBarcodeDetector;
}

const SCAN_REGION = {
  left: 0.05,
  top: 0.27,
  width: 0.9,
  height: 0.28,
};

export function BarcodeScanner({ onScan, onClose, continuous = false }: BarcodeScannerProps) {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const stoppedRef = useRef(false);
  const lastScanRef = useRef<{ value: string; time: number } | null>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!window.isSecureContext) {
      setError(t.scanNotSecure);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError(t.scanNoMedia);
      return;
    }

    let mounted = true;
    let stream: MediaStream | null = null;
    let intervalId: number | null = null;
    let scanBusy = false;
    let nativeDetector: NativeBarcodeDetector | null = null;
    stoppedRef.current = false;

    const stopScanner = () => {
      if (stoppedRef.current) return;
      stoppedRef.current = true;
      if (intervalId !== null) window.clearInterval(intervalId);
      stream?.getTracks().forEach((track) => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      controlsRef.current = null;
    };

    async function startScanner() {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const ZXing = await import("@zxing/library");

        if (!mounted || !videoRef.current || !canvasRef.current) return;

        const formats = continuous
          ? [ZXing.BarcodeFormat.CODE_128, ZXing.BarcodeFormat.CODE_39, ZXing.BarcodeFormat.ITF]
          : [
              ZXing.BarcodeFormat.CODE_128,
              ZXing.BarcodeFormat.CODE_39,
              ZXing.BarcodeFormat.EAN_13,
              ZXing.BarcodeFormat.EAN_8,
              ZXing.BarcodeFormat.UPC_A,
              ZXing.BarcodeFormat.UPC_E,
              ZXing.BarcodeFormat.ITF,
              ZXing.BarcodeFormat.CODABAR,
              ZXing.BarcodeFormat.QR_CODE,
            ];
        const hints = new Map();
        hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, formats);
        if (!continuous) hints.set(ZXing.DecodeHintType.TRY_HARDER, true);
        const reader = new BrowserMultiFormatReader(hints);

        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (!mounted || stoppedRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();

        const track = stream.getVideoTracks()[0];
        try {
          const capabilities = track.getCapabilities() as MediaTrackCapabilities & {
            focusMode?: string[];
          };
          if (capabilities.focusMode?.includes("continuous")) {
            await track.applyConstraints({
              advanced: [
                { focusMode: "continuous" } as unknown as MediaTrackConstraintSet,
              ],
            });
          }
        } catch {
          // Some mobile browsers expose camera capabilities but reject focus constraints.
        }

        const Detector = (
          window as Window & { BarcodeDetector?: NativeBarcodeDetectorConstructor }
        ).BarcodeDetector;
        if (Detector) {
          try {
            nativeDetector = new Detector({
              formats: continuous
                ? ["code_128", "code_39", "itf"]
                : ["code_128", "code_39", "ean_13", "ean_8", "upc_a", "upc_e", "itf", "codabar", "qr_code"],
            });
          } catch {
            nativeDetector = null;
          }
        }

        controlsRef.current = { stop: stopScanner };
        setReady(true);

        const detectFrame = async () => {
          if (!mounted || stoppedRef.current || scanBusy || video.readyState < 2) return;
          const canvas = canvasRef.current;
          if (!canvas || !video.videoWidth || !video.videoHeight) return;

          scanBusy = true;
          try {
            const sx = Math.round(video.videoWidth * SCAN_REGION.left);
            const sy = Math.round(video.videoHeight * SCAN_REGION.top);
            const sw = Math.round(video.videoWidth * SCAN_REGION.width);
            const sh = Math.round(video.videoHeight * SCAN_REGION.height);
            const scale = Math.min(1, 960 / sw, 320 / sh);
            canvas.width = Math.max(1, Math.round(sw * scale));
            canvas.height = Math.max(1, Math.round(sh * scale));

            const context = canvas.getContext("2d", { willReadFrequently: true });
            if (!context) return;
            context.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

            let value = "";
            if (nativeDetector) {
              try {
                const results = await nativeDetector.detect(canvas);
                value = results[0]?.rawValue?.trim() || "";
              } catch {
                nativeDetector = null;
              }
            }

            if (!value) {
              try {
                value = reader.decodeFromCanvas(canvas).getText().trim();
              } catch {
                // A frame without a readable barcode is expected during scanning.
              }
            }

            if (!value || stoppedRef.current) return;
            const now = Date.now();
            const last = lastScanRef.current;
            if (continuous) {
              if (last?.value === value && now - last.time < 2500) return;
              lastScanRef.current = { value, time: now };
              onScan(value);
            } else {
              stopScanner();
              onScan(value);
            }
          } finally {
            scanBusy = false;
          }
        };

        intervalId = window.setInterval(() => void detectFrame(), continuous ? 80 : 150);
        void detectFrame();
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

    void startScanner();

    return () => {
      mounted = false;
      stopScanner();
    };
  }, [continuous, onScan, t]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold">{t.scanTitle}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
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
            <video ref={videoRef} className="w-full" style={{ maxHeight: "60vh" }} playsInline muted />
            <div
              className="pointer-events-none absolute border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.28)]"
              style={{
                left: `${SCAN_REGION.left * 100}%`,
                top: `${SCAN_REGION.top * 100}%`,
                width: `${SCAN_REGION.width * 100}%`,
                height: `${SCAN_REGION.height * 100}%`,
              }}
            >
              <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-red-500/80" />
            </div>
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <span className="text-sm text-white">{t.scanStarting}</span>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        <p className="mt-3 text-center text-xs text-gray-400">
          {continuous ? "将快递条码完整放入框内，扫描成功后可直接扫描下一张" : t.scanGuide}
        </p>
      </div>
    </div>
  );
}
