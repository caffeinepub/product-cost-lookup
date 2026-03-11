import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, Camera, FlipHorizontal, X } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (value: string) => void;
}

declare global {
  interface Window {
    BarcodeDetector: any;
    ZXing: any;
  }
}

const isMobile =
  /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );

// ZXing CDN fallback — loaded once and cached
const ZXING_CDN =
  "https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js";

type ScanEngine = "native" | "zxing" | "none";

export function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastScanRef = useRef<string>("");
  const detectorRef = useRef<any>(null);
  const zxingReaderRef = useRef<any>(null);
  const mountedRef = useRef(true);
  const engineRef = useRef<ScanEngine>("none");

  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment",
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const stopScan = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  }, []);

  const scanFrameWithNative = useCallback(
    (canvas: HTMLCanvasElement) => {
      detectorRef.current
        .detect(canvas)
        .then((results: any[]) => {
          if (!mountedRef.current) return;
          for (const result of results) {
            if (result.rawValue && result.rawValue !== lastScanRef.current) {
              lastScanRef.current = result.rawValue;
              onScan(result.rawValue);
              return;
            }
          }
          if (mountedRef.current) {
            animFrameRef.current = requestAnimationFrame(tick);
          }
        })
        .catch(() => {
          if (mountedRef.current) {
            animFrameRef.current = requestAnimationFrame(tick);
          }
        });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onScan],
  );

  const scanFrameWithZXing = useCallback(
    (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      try {
        const ZXing = window.ZXing;
        if (!ZXing || !zxingReaderRef.current) {
          animFrameRef.current = requestAnimationFrame(tick);
          return;
        }
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const luminanceSource = new ZXing.RGBLuminanceSource(
          imageData.data,
          canvas.width,
          canvas.height,
        );
        const binaryBitmap = new ZXing.BinaryBitmap(
          new ZXing.HybridBinarizer(luminanceSource),
        );
        const result = zxingReaderRef.current.decode(binaryBitmap);
        if (result) {
          const text = result.getText();
          if (text && text !== lastScanRef.current) {
            lastScanRef.current = text;
            onScan(text);
            return;
          }
        }
      } catch (_) {
        // NotFoundException — no barcode in frame, keep scanning
      }
      if (mountedRef.current) {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onScan],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: tick is self-referential
  const tick = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < video.HAVE_ENOUGH_DATA) {
      animFrameRef.current = requestAnimationFrame(tick);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      animFrameRef.current = requestAnimationFrame(tick);
      return;
    }
    ctx.drawImage(video, 0, 0);

    const engine = engineRef.current;
    if (engine === "native" && detectorRef.current) {
      scanFrameWithNative(canvas);
    } else if (engine === "zxing") {
      scanFrameWithZXing(ctx, canvas);
    } else {
      // Engine not ready yet, try again next frame
      animFrameRef.current = requestAnimationFrame(tick);
    }
  }, [scanFrameWithNative, scanFrameWithZXing]);

  const loadZXingCdn = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.ZXing) {
        resolve();
        return;
      }
      const existing = document.querySelector(`script[src="${ZXING_CDN}"]`);
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () =>
          reject(new Error("ZXing CDN failed to load")),
        );
        return;
      }
      const script = document.createElement("script");
      script.src = ZXING_CDN;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("ZXing CDN failed to load"));
      document.head.appendChild(script);
    });
  }, []);

  const initZXingReader = useCallback(async () => {
    await loadZXingCdn();
    const ZXing = window.ZXing;
    if (!ZXing) throw new Error("ZXing not available after load");

    const hints = new Map();
    hints.set(ZXing.DecodeHintType.TRY_HARDER, true);
    hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [
      ZXing.BarcodeFormat.EAN_13,
      ZXing.BarcodeFormat.EAN_8,
      ZXing.BarcodeFormat.UPC_A,
      ZXing.BarcodeFormat.UPC_E,
      ZXing.BarcodeFormat.CODE_128,
      ZXing.BarcodeFormat.CODE_39,
      ZXing.BarcodeFormat.CODE_93,
      ZXing.BarcodeFormat.CODABAR,
      ZXing.BarcodeFormat.QR_CODE,
      ZXing.BarcodeFormat.DATA_MATRIX,
      ZXing.BarcodeFormat.PDF_417,
    ]);
    const reader = new ZXing.MultiFormatReader();
    reader.setHints(hints);
    zxingReaderRef.current = reader;
    engineRef.current = "zxing";
  }, [loadZXingCdn]);

  const startScan = useCallback(
    async (facing: "environment" | "user") => {
      if (!mountedRef.current) return;
      setIsLoading(true);
      setError(null);
      lastScanRef.current = "";
      engineRef.current = "none";

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facing,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        if (!mountedRef.current) {
          for (const t of stream.getTracks()) t.stop();
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // Attempt to use native BarcodeDetector first
        if ("BarcodeDetector" in window && window.BarcodeDetector) {
          try {
            const formats = await window.BarcodeDetector.getSupportedFormats();
            detectorRef.current = new window.BarcodeDetector({ formats });
            engineRef.current = "native";
          } catch {
            // Native failed — fall through to ZXing
            engineRef.current = "none";
          }
        }

        // Fallback to ZXing if native not available
        if (engineRef.current === "none") {
          try {
            await initZXingReader();
          } catch (_zxingErr) {
            // ZXing also failed — show error
            throw new Error(
              "Barcode scanner unavailable on this browser. Try Chrome or Edge.",
            );
          }
        }

        if (mountedRef.current) {
          setIsLoading(false);
          setIsScanning(true);
          animFrameRef.current = requestAnimationFrame(tick);
        }
      } catch (err) {
        if (mountedRef.current) {
          setIsLoading(false);
          setError(
            err instanceof Error ? err : new Error("Camera access denied"),
          );
        }
      }
    },
    [initZXingReader, tick],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional — only re-run when open changes
  useEffect(() => {
    if (open) {
      startScan(facingMode);
    } else {
      stopScan();
    }
    return () => {
      stopScan();
    };
  }, [open]);

  const handleSwitchCamera = useCallback(async () => {
    stopScan();
    const newFacing = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newFacing);
    await startScan(newFacing);
  }, [facingMode, startScan, stopScan]);

  const handleClose = useCallback(() => {
    stopScan();
    onClose();
  }, [stopScan, onClose]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        data-ocid="scanner.dialog"
        className="bg-card border-border sm:max-w-md p-0 overflow-hidden gap-0"
      >
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="font-display text-base flex items-center gap-2">
            <Camera className="h-4 w-4 text-primary" />
            Barcode / QR Scanner
          </DialogTitle>
        </DialogHeader>

        {/* Camera preview */}
        <div
          className="relative bg-black mx-4 mb-2 rounded-md overflow-hidden"
          style={{ aspectRatio: "4/3" }}
        >
          <video
            ref={videoRef}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            playsInline
            muted
          />
          <canvas ref={canvasRef} style={{ display: "none" }} />

          {/* Scanning overlay */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Corner brackets */}
              <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-sm" />
              <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-sm" />
              <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-sm" />
              <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-sm" />

              {/* Animated scan line */}
              <motion.div
                className="absolute left-6 right-6 h-0.5 bg-primary/70"
                style={{ top: "25%" }}
                animate={{ top: ["25%", "75%", "25%"] }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              />
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="flex flex-col items-center gap-2">
                <motion.div
                  className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 0.8,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "linear",
                  }}
                />
                <span className="text-xs text-white/70 font-mono">
                  Initializing camera…
                </span>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4">
              <div className="flex flex-col items-center gap-3 text-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <div>
                  <p className="text-sm font-medium text-white">Camera Error</p>
                  <p className="text-xs text-white/60 mt-1 leading-relaxed">
                    {error.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Close button overlay */}
          <button
            type="button"
            data-ocid="scanner.close_button"
            onClick={handleClose}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white/80 hover:text-white transition-colors"
            aria-label="Close scanner"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Status + controls */}
        <div className="px-5 pb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {isScanning && !error ? (
              <motion.div
                className="w-2 h-2 rounded-full bg-primary"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY }}
              />
            ) : (
              <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
            )}
            <span className="text-xs text-muted-foreground font-mono">
              {isLoading
                ? "Starting camera…"
                : isScanning && !error
                  ? "Scanning…"
                  : error
                    ? "Camera unavailable"
                    : "Ready"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isMobile && isScanning && !error && (
              <Button
                data-ocid="scanner.switch_button"
                size="sm"
                variant="outline"
                onClick={handleSwitchCamera}
                disabled={isLoading}
                className="h-8 border-border/60 text-muted-foreground hover:text-foreground gap-1.5 text-xs"
              >
                <FlipHorizontal className="h-3.5 w-3.5" />
                Switch Camera
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClose}
              className="h-8 text-muted-foreground hover:text-foreground text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>

        {/* Hint */}
        {!error && (
          <p className="text-center text-[11px] text-muted-foreground/50 font-mono pb-4 -mt-2">
            Point the camera at a barcode or QR code
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
