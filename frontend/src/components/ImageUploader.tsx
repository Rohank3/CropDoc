"use client";

import React, { useState, useRef } from "react";
import { Camera, Upload, MapPin, Loader2, ArrowRight } from "lucide-react";
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
        console.warn("Geolocation notice:", err.message);
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

      {/* Main Upload Area */}
      {!previewUrl ? (
        <div
          onDragEnter={() => setDragActive(true)}
          onDragLeave={() => setDragActive(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className={`relative overflow-hidden rounded-3xl border-2 border-dashed p-6 text-center transition-all sm:p-12 ${
            dragActive
              ? "border-emerald-600 bg-emerald-50/50"
              : "border-stone-300 bg-white hover:border-emerald-600 shadow-xs"
          }`}
        >
          <div className="mx-auto flex max-w-md flex-col items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-100">
              <Camera className="h-6 w-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">
                {t.heroHeading}
              </h3>
              <p className="text-xs text-stone-600 sm:text-sm leading-relaxed max-w-sm mx-auto">
                {t.heroSubtitle}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid w-full grid-cols-1 gap-3 pt-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="group flex items-center justify-center gap-2 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-emerald-900 active:scale-[0.98]"
              >
                <Camera className="h-4 w-4" />
                <span>{t.snapPhoto}</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50 hover:border-stone-300 active:scale-[0.98] shadow-2xs"
              >
                <Upload className="h-4 w-4 text-stone-500" />
                <span>{t.uploadPhoto}</span>
              </button>
            </div>

            <p className="text-xs text-stone-400 pt-1">
              {t.dragDrop}
            </p>

            {/* Farm Location Toggle */}
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50/80 px-3 py-1.5">
              <input
                id="gps-toggle"
                type="checkbox"
                checked={attachLocation}
                onChange={(e) => {
                  setAttachLocation(e.target.checked);
                  if (e.target.checked && !locationCoords) requestGps();
                }}
                className="h-4 w-4 rounded border-stone-300 text-emerald-800 focus:ring-emerald-700"
              />
              <label htmlFor="gps-toggle" className="cursor-pointer text-xs text-stone-600 flex items-center gap-1.5 font-medium">
                <MapPin className="h-3.5 w-3.5 text-emerald-800" />
                <span>{t.useMyLocation}</span>
                {locationStatus && (
                  <span className="text-[10px] text-stone-500 font-mono">({locationStatus})</span>
                )}
              </label>
            </div>
          </div>
        </div>
      ) : (
        /* Image Preview View */
        <div className="relative overflow-hidden rounded-3xl border border-stone-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="relative mx-auto aspect-video max-h-[400px] w-full overflow-hidden rounded-2xl border border-stone-200 bg-stone-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Leaf sample preview"
              className="h-full w-full object-contain"
            />

            {/* Professional Inspection Overlay */}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-7 py-5 shadow-lg border border-stone-100 max-w-sm text-center">
                  <Loader2 className="h-7 w-7 animate-spin text-emerald-800" />
                  <div>
                    <p className="text-sm font-bold text-stone-900">{t.analyzingLeaf}</p>
                    <p className="text-xs text-stone-500 mt-0.5">{t.runningVision}</p>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden mt-1">
                    <div className="bg-emerald-800 h-1.5 rounded-full w-2/3 animate-pulse" />
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
              className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-50"
            >
              {t.retakePhoto}
            </button>

            <button
              type="button"
              disabled={isAnalyzing}
              onClick={triggerAnalyze}
              className="group flex items-center justify-center gap-2 rounded-xl bg-emerald-800 px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-emerald-900 active:scale-[0.98] disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>{t.analyzingLeaf}</span>
                </>
              ) : (
                <>
                  <span>Begin Diagnosis</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
