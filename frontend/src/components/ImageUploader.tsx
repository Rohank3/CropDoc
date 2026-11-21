"use client";

import React, { useState, useRef } from "react";
import { Camera, Upload, MapPin, Sparkles, Loader2 } from "lucide-react";
import { Language } from "@/types";
import { translations } from "@/lib/i18n";
import { compressImage } from "@/lib/api";

interface ImageUploaderProps {
  lang: Language;
  onAnalyze: (file: Blob, previewUrl: string, location?: { lat: number; lon: number }) => Promise<void>;
  isAnalyzing: boolean;
}

export function ImageUploader({ lang, onAnalyze, isAnalyzing }: ImageUploaderProps) {
  const t = translations[lang];
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedBlob, setSelectedBlob] = useState<Blob | null>(null);
  const [attachLocation, setAttachLocation] = useState(true);
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lon: number } | undefined>(undefined);
  const [locationStatus, setLocationStatus] = useState<string>("");

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const requestGps = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation unsupported");
      return;
    }
    setLocationStatus("Locating farm...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationCoords({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude
        });
        setLocationStatus("GPS attached");
      },
      (err) => {
        console.warn("Geolocation denied:", err.message);
        setLocationStatus("GPS unattached");
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file.");
      return;
    }

    try {
      const compressed = await compressImage(file, 1024, 0.85);
      const url = URL.createObjectURL(compressed);
      setPreviewUrl(url);
      setSelectedBlob(compressed);

      if (attachLocation && !locationCoords) {
        requestGps();
      }
    } catch (e) {
      console.error("Image processing error:", e);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const triggerAnalyze = () => {
    if (!selectedBlob || !previewUrl) return;
    onAnalyze(selectedBlob, previewUrl, locationCoords);
  };

  const resetSelection = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedBlob(null);
  };

  return (
    <div className="w-full">
      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {/* Main Upload / Preview Area */}
      {!previewUrl ? (
        <div
          onDragEnter={() => setDragActive(true)}
          onDragLeave={() => setDragActive(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className={`relative overflow-hidden rounded-3xl border-2 border-dashed p-6 text-center transition-all sm:p-10 ${
            dragActive
              ? "border-emerald-400 bg-emerald-900/30 scale-[1.01]"
              : "border-emerald-700/60 bg-emerald-950/40 hover:border-emerald-500/80 hover:bg-emerald-950/60"
          }`}
        >
          {/* Background Ambient Glow */}
          <div className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />

          {/* Action Buttons */}
          <div className="mx-auto flex max-w-md flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/30">
              <Camera className="h-8 w-8 text-emerald-400" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white sm:text-xl">
                {t.heroHeading}
              </h3>
              <p className="text-xs text-emerald-200/70 sm:text-sm">
                {t.heroSubtitle}
              </p>
            </div>

            <div className="grid w-full grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
              {/* Native Mobile Camera Button */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="group flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-3.5 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/25 transition-all hover:brightness-110 active:scale-95"
              >
                <Camera className="h-4 w-4 transition-transform group-hover:scale-110 text-emerald-950" />
                <span>{t.snapPhoto}</span>
              </button>

              {/* Gallery Picker Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group flex items-center justify-center gap-2.5 rounded-2xl border border-emerald-700/60 bg-emerald-900/40 px-5 py-3.5 text-sm font-semibold text-emerald-200 transition-all hover:border-emerald-500 hover:bg-emerald-900/80 active:scale-95"
              >
                <Upload className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 text-emerald-400" />
                <span>{t.uploadPhoto}</span>
              </button>
            </div>

            <p className="text-xs text-emerald-300/40 pt-1">
              {t.dragDrop}
            </p>

            {/* Farm GPS Toggle */}
            <div className="mt-2 flex items-center gap-2 rounded-xl bg-emerald-900/30 px-3 py-1.5 ring-1 ring-emerald-700/40">
              <input
                id="gps-toggle"
                type="checkbox"
                checked={attachLocation}
                onChange={(e) => {
                  setAttachLocation(e.target.checked);
                  if (e.target.checked && !locationCoords) requestGps();
                }}
                className="h-4 w-4 rounded border-emerald-600 text-emerald-500 focus:ring-emerald-400"
              />
              <label htmlFor="gps-toggle" className="cursor-pointer text-xs text-emerald-200/80 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-emerald-400" />
                <span>{t.useMyLocation}</span>
                {locationStatus && (
                  <span className="text-[10px] text-emerald-400 font-mono">({locationStatus})</span>
                )}
              </label>
            </div>
          </div>
        </div>
      ) : (
        /* Preview Card */
        <div className="relative overflow-hidden rounded-3xl border border-emerald-700/60 bg-emerald-950/80 p-4 sm:p-6 shadow-2xl">
          <div className="relative mx-auto aspect-video max-h-[380px] w-full overflow-hidden rounded-2xl border border-emerald-800/80 bg-black/60">
            {/* Leaf Image Preview */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Leaf sample preview"
              className="h-full w-full object-contain"
            />

            {/* Scanning Laser Beam Effect */}
            {isAnalyzing && (
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="h-2 w-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#34d399] animate-[scan_2s_ease-in-out_infinite]" />
                <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-[1px] flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2 rounded-2xl bg-black/75 px-6 py-4 border border-emerald-500/40 shadow-xl">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
                    <p className="text-sm font-semibold text-emerald-200">{t.analyzingLeaf}</p>
                    <p className="text-xs text-emerald-400/70">{t.runningVision}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              disabled={isAnalyzing}
              onClick={resetSelection}
              className="rounded-xl border border-emerald-800 bg-emerald-950/60 px-4 py-2.5 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-900 disabled:opacity-50"
            >
              {t.retakePhoto}
            </button>

            <button
              type="button"
              disabled={isAnalyzing}
              onClick={triggerAnalyze}
              className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-600 px-6 py-3 text-sm font-bold text-emerald-950 shadow-lg shadow-emerald-500/25 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-950" />
                  <span>{t.analyzingLeaf}</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-emerald-950 transition-transform group-hover:rotate-12" />
                  <span>Diagnose Leaf Pathology</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
