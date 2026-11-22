"use client";

import React, { useState, useRef } from "react";
import { Camera, Upload, MapPin, Loader2, ArrowRight, Crop, AlertTriangle, Volume2, RefreshCw } from "lucide-react";
import { Language, LeafValidationResult } from "@/types";
import { translations } from "@/lib/i18n";
import { compressImage } from "@/lib/api";
import { ImageCropperModal } from "@/components/ImageCropperModal";

interface ImageUploaderProps {
  lang: Language;
  onAnalyze: (file: Blob, previewUrl: string, location?: { lat: number; lon: number }) => Promise<void>;
  isAnalyzing: boolean;
  validationError?: LeafValidationResult | null;
  onClearValidation?: () => void;
}

export function ImageUploader({
  lang,
  onAnalyze,
  isAnalyzing,
  validationError,
  onClearValidation
}: ImageUploaderProps) {
  const t = translations[lang];
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedBlob, setSelectedBlob] = useState<Blob | null>(null);
  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);

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
    setLocationStatus(lang === "hi" ? "खेत खोज रहे हैं..." : "Locating farm...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationCoords({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude
        });
        setLocationStatus(lang === "hi" ? "GPS जुड़ा" : "GPS attached");
      },
      (err) => {
        console.warn("Geolocation notice:", err.message);
        setLocationStatus(lang === "hi" ? "GPS अनुपलब्ध" : "GPS unattached");
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file.");
      return;
    }

    if (onClearValidation) onClearValidation();

    try {
      const compressed = await compressImage(file, 1200, 0.88);
      const url = URL.createObjectURL(compressed);
      setRawImageUrl(url);
      setPreviewUrl(url);
      setSelectedBlob(compressed);
      // Automatically open cropper so farmer can frame the leaf lesion
      setIsCropperOpen(true);

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

  const handleCropComplete = (croppedBlob: Blob, croppedUrl: string) => {
    setSelectedBlob(croppedBlob);
    setPreviewUrl(croppedUrl);
    setIsCropperOpen(false);
  };

  const triggerAnalyze = () => {
    if (!selectedBlob || !previewUrl) return;
    if (onClearValidation) onClearValidation();
    onAnalyze(selectedBlob, previewUrl, locationCoords);
  };

  const resetSelection = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (rawImageUrl && rawImageUrl !== previewUrl) URL.revokeObjectURL(rawImageUrl);
    setPreviewUrl(null);
    setSelectedBlob(null);
    setRawImageUrl(null);
    setIsCropperOpen(false);
    if (onClearValidation) onClearValidation();
  };

  // Play audio readout for validation errors
  const playValidationAudio = () => {
    if (!validationError || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const text = lang === "hi" ? validationError.message_hi : validationError.message;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === "hi" ? "hi-IN" : "en-US";
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
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

      {/* Leaf Cropper Modal */}
      {rawImageUrl && (
        <ImageCropperModal
          isOpen={isCropperOpen}
          imageUrl={rawImageUrl}
          lang={lang}
          onCropComplete={handleCropComplete}
          onCancel={() => setIsCropperOpen(false)}
        />
      )}

      {/* Stage 1 Validation Rejection Banner */}
      {validationError && (
        <div className="mb-6 rounded-2xl border-2 border-amber-400 bg-amber-50 p-4 sm:p-5 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-200 text-amber-900 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-amber-950">
                  {lang === "hi" ? "पत्ती की पहचान नहीं हो सकी" : "Leaf Validation Notice"}
                </h4>
                <p className="text-sm text-amber-900 mt-1 font-medium leading-relaxed">
                  {lang === "hi" ? validationError.message_hi : validationError.message}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs font-mono text-amber-800">
                  <span className="rounded-md bg-amber-100 px-2 py-0.5 border border-amber-300">
                    Blur Metric: {validationError.blur_score} (min 30.0)
                  </span>
                  <span className="rounded-md bg-amber-100 px-2 py-0.5 border border-amber-300">
                    Foliar Pigment: {validationError.foliage_ratio}% (min 8.0%)
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={playValidationAudio}
              title="Listen to advisory"
              className="p-2.5 rounded-xl bg-amber-200/80 hover:bg-amber-300 text-amber-900 transition active:scale-95 shrink-0"
              aria-label="Listen to warning"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 py-2.5 px-4 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-semibold text-xs transition flex items-center justify-center gap-2 active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{lang === "hi" ? "दोबारा साफ़ फोटो लें" : "Retake Clear Photo"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Upload / Camera Area */}
      {!previewUrl ? (
        <div
          onDragEnter={() => setDragActive(true)}
          onDragLeave={() => setDragActive(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className={`relative overflow-hidden rounded-3xl border-2 border-dashed p-6 text-center transition-all sm:p-10 ${
            dragActive
              ? "border-emerald-600 bg-emerald-50/50"
              : "border-stone-300 bg-white hover:border-emerald-600 shadow-xs"
          }`}
        >
          <div className="mx-auto flex max-w-md flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-inner">
              <Camera className="h-8 w-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">
                {t.heroHeading}
              </h3>
              <p className="text-xs text-stone-600 sm:text-sm leading-relaxed max-w-sm mx-auto">
                {t.heroSubtitle}
              </p>
            </div>

            {/* High-Contrast Action Buttons for Farmers */}
            <div className="grid w-full grid-cols-1 gap-3 pt-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="group flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-4 text-base font-bold text-white shadow-md transition-all hover:bg-emerald-800 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <Camera className="h-5 w-5" />
                <span>{t.snapPhoto}</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group flex items-center justify-center gap-2 rounded-2xl border-2 border-stone-300 bg-white px-5 py-4 text-base font-bold text-stone-800 transition-all hover:bg-stone-50 hover:border-stone-400 active:scale-[0.98] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
              >
                <Upload className="h-5 w-5 text-stone-600" />
                <span>{t.uploadPhoto}</span>
              </button>
            </div>

            <p className="text-xs text-stone-400 pt-1">
              {t.dragDrop}
            </p>

            {/* Farm Location Toggle */}
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50/80 px-3.5 py-2">
              <input
                id="gps-toggle"
                type="checkbox"
                checked={attachLocation}
                onChange={(e) => {
                  setAttachLocation(e.target.checked);
                  if (e.target.checked && !locationCoords) requestGps();
                }}
                className="h-4 w-4 rounded border-stone-300 text-emerald-700 focus:ring-emerald-600 cursor-pointer"
              />
              <label htmlFor="gps-toggle" className="cursor-pointer text-xs text-stone-700 flex items-center gap-1.5 font-medium">
                <MapPin className="h-3.5 w-3.5 text-emerald-700" />
                <span>{t.useMyLocation}</span>
                {locationStatus && (
                  <span className="text-[11px] text-emerald-800 font-semibold">({locationStatus})</span>
                )}
              </label>
            </div>
          </div>
        </div>
      ) : (
        /* Image Preview with Interactive Cropper Option */
        <div className="relative overflow-hidden rounded-3xl border border-stone-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="relative mx-auto aspect-video max-h-[400px] w-full overflow-hidden rounded-2xl border border-stone-200 bg-stone-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Leaf sample preview"
              className="h-full w-full object-contain"
            />

            {/* Crop Leaf Trigger Overlay Button */}
            {!isAnalyzing && (
              <button
                type="button"
                onClick={() => setIsCropperOpen(true)}
                className="absolute top-3 right-3 flex items-center gap-1.5 rounded-xl bg-black/70 hover:bg-black/90 text-white px-3 py-1.5 text-xs font-semibold backdrop-blur-sm transition border border-white/20 active:scale-95"
              >
                <Crop className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.cropImage}</span>
              </button>
            )}

            {/* Inspection Animation */}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-stone-900/65 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-7 py-5 shadow-xl border border-stone-100 max-w-sm text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
                  <div>
                    <p className="text-base font-bold text-stone-900">{t.analyzingLeaf}</p>
                    <p className="text-xs text-stone-600 mt-1">{t.runningVision}</p>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden mt-2">
                    <div className="bg-emerald-600 h-2 rounded-full w-3/4 animate-pulse" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
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
                onClick={() => setIsCropperOpen(true)}
                className="rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Crop className="w-3.5 h-3.5" />
                <span>{t.cropImage}</span>
              </button>
            </div>

            <button
              type="button"
              disabled={isAnalyzing}
              onClick={triggerAnalyze}
              className="group flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-7 py-3.5 text-base font-bold text-white shadow-md transition-all hover:bg-emerald-800 active:scale-[0.98] disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                  <span>{t.analyzingLeaf}</span>
                </>
              ) : (
                <>
                  <span>{lang === "hi" ? "रोग पहचानें (जांच शुरू करें)" : "Begin Diagnosis"}</span>
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
