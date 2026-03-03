import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQRScanner } from "@/qr-code/useQRScanner";
import { AlertCircle, Camera, FlipHorizontal, X } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (value: string) => void;
}

const isMobile =
  /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );

export function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
  const {
    qrResults,
    isScanning,
    isLoading,
    isActive,
    error,
    startScanning,
    stopScanning,
    switchCamera,
    clearResults,
    videoRef,
    canvasRef,
  } = useQRScanner({
    facingMode: "environment",
    scanInterval: 100,
    maxResults: 1,
  });

  // Start scanning when dialog opens
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally run only when open changes
  useEffect(() => {
    if (open) {
      clearResults();
      startScanning();
    } else {
      stopScanning();
    }
  }, [open]);

  // Fire callback when a scan result arrives
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally run only when qrResults changes
  useEffect(() => {
    if (qrResults.length > 0 && open) {
      onScan(qrResults[0].data);
    }
  }, [qrResults]);

  const handleClose = () => {
    stopScanning();
    onClose();
  };

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
          {isActive && isScanning && (
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
            {isMobile && isActive && !error && (
              <Button
                data-ocid="scanner.switch_button"
                size="sm"
                variant="outline"
                onClick={() => switchCamera()}
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
