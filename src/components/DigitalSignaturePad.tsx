import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, Check, PenTool, ShieldCheck } from 'lucide-react';

interface DigitalSignaturePadProps {
  signerName: string;
  signerPosition: string;
  onSave: (signatureDataUrl: string) => void;
  initialSignature?: string;
  readOnly?: boolean;
}

export const DigitalSignaturePad: React.FC<DigitalSignaturePadProps> = ({
  signerName,
  signerPosition,
  onSave,
  initialSignature,
  readOnly = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(!!initialSignature);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(initialSignature || null);

  useEffect(() => {
    if (initialSignature) {
      setSignatureUrl(initialSignature);
      setHasDrawn(true);
    }
  }, [initialSignature]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e3a8a'; // Deep official blue ink
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setSignatureUrl(dataUrl);
    onSave(dataUrl);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setSignatureUrl(null);
    onSave('');
  };

  return (
    <div id="digital-signature-container" className="bg-slate-50/70 border border-slate-200 rounded-xl p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <PenTool className="w-4 h-4 text-blue-700" />
          <h4 className="font-semibold text-slate-800 text-sm sm:text-base">
            ลายมือชื่อดิจิทัลของผู้ประเมิน (Digital Signature)
          </h4>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>ระบบบันทึกล็อคตัวตนและเวลาอัตโนมัติ (Anti-Impersonation)</span>
        </div>
      </div>

      <div className="relative border-2 border-dashed border-blue-200 rounded-lg bg-white overflow-hidden shadow-inner">
        {signatureUrl && readOnly ? (
          <div className="flex items-center justify-center p-4 min-h-[140px]">
            <img
              src={signatureUrl}
              alt="Digital Signature"
              className="max-h-28 object-contain"
            />
          </div>
        ) : (
          <>
            <canvas
              ref={canvasRef}
              width={540}
              height={140}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-[140px] cursor-crosshair touch-none block"
            />
            {!hasDrawn && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 text-xs sm:text-sm">
                <span>เซ็นลายมือชื่อด้วยเมาส์หรือนิ้วมือในกรอบนี้</span>
                <span className="text-[11px] text-slate-400 mt-0.5">(ลายเซ็นจะถูกประทับลงในแบบรายงานทางการ)</span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div>
          <span className="font-semibold text-slate-800">ผู้ลงนาม:</span> {signerName} ({signerPosition})
        </div>
        {!readOnly && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="clear-signature-btn"
              onClick={clearCanvas}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              ล้างลายเซ็น
            </button>
            {hasDrawn && (
              <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                <Check className="w-3.5 h-3.5" />
                ลงนามเรียบร้อย
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
