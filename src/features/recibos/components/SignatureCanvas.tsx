import { useRef, useEffect, useState, useCallback } from "react";
import { Pen, Eraser, Check } from "lucide-react";
import { cx } from "@/lib/utils";

interface SignatureCanvasProps {
  onChange?: (dataUrl: string | null) => void;
  width?: number;
  height?: number;
  className?: string;
}

export default function SignatureCanvas({
  onChange,
  width = 400,
  height = 160,
  className,
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawing, setHasDrawing] = useState(false);

  const getCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    return { canvas, ctx };
  };

  useEffect(() => {
    const res = getCanvas();
    if (!res) return;
    const { ctx, canvas } = res;
    // Setup canvas for high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#111";

    // Draw subtle grid
    ctx.save();
    ctx.strokeStyle = "#e5e5e5";
    ctx.lineWidth = 1;
    for (let y = 0; y < height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();
  }, [width, height]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const res = getCanvas();
    if (!res) return;
    const { ctx } = res;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  }, []);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const res = getCanvas();
    if (!res) return;
    const { ctx } = res;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }, [isDrawing]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    const res = getCanvas();
    if (!res) return;
    const { canvas } = res;
    setIsDrawing(false);
    setHasDrawing(true);
    onChange?.(canvas.toDataURL("image/png"));
  }, [isDrawing, onChange]);

  const clear = useCallback(() => {
    const res = getCanvas();
    if (!res) return;
    const { ctx, canvas } = res;
    ctx.clearRect(0, 0, width, height);
    // Redraw grid
    ctx.save();
    ctx.strokeStyle = "#e5e5e5";
    ctx.lineWidth = 1;
    for (let y = 0; y < height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();
    setHasDrawing(false);
    onChange?.(null);
  }, [width, height, onChange]);

  return (
    <div className={cx("space-y-2", className)}>
      <div
        className="relative rounded-2xl border-2 border-dashed border-neutral-200 bg-white overflow-hidden cursor-crosshair touch-none"
        style={{ width, height }}
      >
        <canvas
          ref={canvasRef}
          className="block"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasDrawing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-1 text-neutral-300">
              <Pen className="h-5 w-5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Firma aquí
              </span>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={clear}
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-neutral-400 hover:text-rose-500 transition-colors"
        >
          <Eraser className="h-3.5 w-3.5" />
          Limpiar
        </button>
        {hasDrawing && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
            <Check className="h-3.5 w-3.5" />
            Firma capturada
          </span>
        )}
      </div>
    </div>
  );
}
