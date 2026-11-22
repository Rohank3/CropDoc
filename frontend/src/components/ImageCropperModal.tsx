"use client";

import React, { useRef, useState, useEffect } from "react";
import { Crop, ZoomIn, ZoomOut, Check, X, Move } from "lucide-react";
import { Language } from "@/types";
import { translations } from "@/lib/i18n";

interface ImageCropperModalProps {
  isOpen: boolean;
  imageUrl: string;
  lang: Language;
  onCropComplete: (croppedBlob: Blob, croppedUrl: string) => void;
  onCancel: () => void;
}

export function ImageCropperModal({
  isOpen,
  imageUrl,
  lang,
  onCropComplete,
  onCancel
}: ImageCropperModalProps) {
  const t = translations[lang];
  const dialogRef = useRef<HTMLDialogElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Open / Close native dialog element
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  // Load image
  useEffect(() => {
    if (!imageUrl || !isOpen) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      setImageObj(img);
      setZoom(1.0);
      setPan({ x: 0, y: 0 });
    };
  }, [imageUrl, isOpen]);

  // Render canvas
  useEffect(() => {
    if (!imageObj || !canvasRef.current || !isOpen) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Calculate dimensions maintaining aspect ratio
    const imgRatio = imageObj.width / imageObj.height;
    let baseWidth = canvasWidth;
    let baseHeight = canvasWidth / imgRatio;

    if (baseHeight < canvasHeight) {
      baseHeight = canvasHeight;
      baseWidth = canvasHeight * imgRatio;
    }

    const drawW = baseWidth * zoom;
    const drawH = baseHeight * zoom;
    const drawX = (canvasWidth - drawW) / 2 + pan.x;
    const drawY = (canvasHeight - drawH) / 2 + pan.y;

    ctx.drawImage(imageObj, drawX, drawY, drawW, drawH);

    // Draw crop guidelines (rule of thirds square)
    const cropSize = Math.min(canvasWidth, canvasHeight) * 0.82;
    const cropX = (canvasWidth - cropSize) / 2;
    const cropY = (canvasHeight - cropSize) / 2;

    // Darken outer bounds
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    // Top
    ctx.fillRect(0, 0, canvasWidth, cropY);
    // Bottom
    ctx.fillRect(0, cropY + cropSize, canvasWidth, canvasHeight - (cropY + cropSize));
    // Left
    ctx.fillRect(0, cropY, cropX, cropSize);
    // Right
    ctx.fillRect(cropX + cropSize, cropY, canvasWidth - (cropX + cropSize), cropSize);

    // Guide border
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 3;
    ctx.strokeRect(cropX, cropY, cropSize, cropSize);

    // Rule of thirds subtle grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    // vertical
    ctx.moveTo(cropX + cropSize / 3, cropY);
    ctx.lineTo(cropX + cropSize / 3, cropY + cropSize);
    ctx.moveTo(cropX + (2 * cropSize) / 3, cropY);
    ctx.lineTo(cropX + (2 * cropSize) / 3, cropY + cropSize);
    // horizontal
    ctx.moveTo(cropX, cropY + cropSize / 3);
    ctx.lineTo(cropX + cropSize, cropY + cropSize / 3);
    ctx.moveTo(cropX, cropY + (2 * cropSize) / 3);
    ctx.lineTo(cropX + cropSize, cropY + (2 * cropSize) / 3);
    ctx.stroke();
  }, [imageObj, zoom, pan, isOpen]);

  // Pointer interaction for panning
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture released
    }
  };

  // Perform Crop Export
  const executeCrop = () => {
    if (!imageObj || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    const cropSize = Math.min(canvasWidth, canvasHeight) * 0.82;
    const cropX = (canvasWidth - cropSize) / 2;
    const cropY = (canvasHeight - cropSize) / 2;

    const imgRatio = imageObj.width / imageObj.height;
    let baseWidth = canvasWidth;
    let baseHeight = canvasWidth / imgRatio;

    if (baseHeight < canvasHeight) {
      baseHeight = canvasHeight;
      baseWidth = canvasHeight * imgRatio;
    }

    const drawW = baseWidth * zoom;
    const drawH = baseHeight * zoom;
    const drawX = (canvasWidth - drawW) / 2 + pan.x;
    const drawY = (canvasHeight - drawH) / 2 + pan.y;

    // Map screen crop rect back to original image coordinates
    const scaleFactor = imageObj.width / drawW;
    const srcX = Math.max(0, (cropX - drawX) * scaleFactor);
    const srcY = Math.max(0, (cropY - drawY) * scaleFactor);
    const srcSize = Math.min(imageObj.width - srcX, imageObj.height - srcY, cropSize * scaleFactor);

    // Target export canvas (512x512)
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = 512;
    exportCanvas.height = 512;
    const exportCtx = exportCanvas.getContext("2d");
    if (!exportCtx) return;

    exportCtx.drawImage(
      imageObj,
      srcX,
      srcY,
      srcSize,
      srcSize,
      0,
      0,
      512,
      512
    );

    exportCanvas.toBlob(
      (blob) => {
        if (blob) {
          const newUrl = URL.createObjectURL(blob);
          onCropComplete(blob, newUrl);
        }
      },
      "image/jpeg",
      0.90
    );
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="cropper-title"
      className="fixed inset-0 z-50 m-auto w-full max-w-lg rounded-2xl bg-slate-900 text-white shadow-2xl backdrop:bg-black/80 p-0 border border-slate-700 open:animate-in open:fade-in open:zoom-in-95"
      style={{ overscrollBehavior: "contain" }}
    >
      <div className="flex flex-col h-full max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <Crop className="w-5 h-5 text-emerald-400" />
            <h2 id="cropper-title" className="text-base font-semibold text-white">
              {t.cropImage}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions banner */}
        <div className="bg-slate-800/80 px-4 py-2 text-xs text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Move className="w-3.5 h-3.5 text-emerald-400" />
            {t.cropInstructions}
          </span>
          <span className="text-[11px] font-mono text-emerald-400">1:1 Leaf Crop</span>
        </div>

        {/* Viewport canvas */}
        <div className="relative flex-1 flex items-center justify-center bg-black overflow-hidden p-3 min-h-[300px]">
          <canvas
            ref={canvasRef}
            width={380}
            height={380}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="touch-none cursor-grab active:cursor-grabbing rounded-xl border border-slate-800 max-w-full max-h-[50vh] object-contain shadow-inner"
          />
        </div>

        {/* Zoom controls */}
        <div className="px-5 py-3 bg-slate-800/60 border-t border-slate-800 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setZoom((prev) => Math.max(0.8, prev - 0.2))}
            aria-label="Zoom Out"
            className="p-2 rounded-xl bg-slate-700/80 hover:bg-slate-600 text-white transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <input
            type="range"
            min="0.8"
            max="3.0"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-48 accent-emerald-500 cursor-pointer"
            aria-label="Zoom slider"
          />

          <button
            type="button"
            onClick={() => setZoom((prev) => Math.min(3.0, prev + 0.2))}
            aria-label="Zoom In"
            className="p-2 rounded-xl bg-slate-700/80 hover:bg-slate-600 text-white transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 p-4 bg-slate-900 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-medium text-sm transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
          >
            {t.cancelCrop}
          </button>
          <button
            type="button"
            onClick={executeCrop}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <Check className="w-4 h-4" />
            {t.applyCrop}
          </button>
        </div>
      </div>
    </dialog>
  );
}
