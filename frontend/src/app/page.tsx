"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { ImageUploader } from "@/components/ImageUploader";
import { DiagnosisCard } from "@/components/DiagnosisCard";
import { MandiTracker } from "@/components/MandiTracker";
import { WeatherCard } from "@/components/WeatherCard";
import { ScanHistoryView } from "@/components/ScanHistoryView";
import { InstallBanner } from "@/components/InstallBanner";
import { Language, DiagnosisResponse, SavedScan, LeafValidationResult } from "@/types";
import { diagnoseCrop } from "@/lib/api";
import { getSavedScans } from "@/lib/storage";
import { Sprout, AlertTriangle } from "lucide-react";

export default function Home() {
  const [lang, setLang] = useState<Language>("en");
  const [activeTab, setActiveTab] = useState<"scan" | "mandi" | "weather" | "history">("scan");
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResponse | null>(null);
  const [validationError, setValidationError] = useState<LeafValidationResult | null>(null);
  const [activeThumbnail, setActiveThumbnail] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [savedScansCount, setSavedScansCount] = useState<number>(() => {
    return typeof window !== "undefined" ? getSavedScans().length : 0;
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshSavedCount = () => {
    const list = getSavedScans();
    setSavedScansCount(list.length);
  };

  const handleAnalyze = async (
    imageBlob: Blob,
    previewUrl: string,
    location?: { lat: number; lon: number }
  ) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    setValidationError(null);

    try {
      const response = await diagnoseCrop(imageBlob, location);
      if (response.status === "rejected") {
        setValidationError(response.validation);
        setDiagnosisResult(null);
      } else {
        setDiagnosisResult(response);
        setActiveThumbnail(previewUrl);
        setValidationError(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to analyze leaf image. Ensure the backend server is running.";
      setErrorMessage(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleResetScan = () => {
    setDiagnosisResult(null);
    setActiveThumbnail(null);
    setErrorMessage(null);
    setValidationError(null);
  };

  const handleSelectHistoricalScan = (scan: SavedScan) => {
    setDiagnosisResult({
      status: "success",
      stage_applied: "stage2_cv",
      validation: {
        is_valid: true,
        is_blurry: false,
        has_foliage: true,
        blur_score: 100,
        foliage_ratio: 90,
        message: "Historical scan",
        message_hi: "सहेजा गया स्कैन"
      },
      diagnosis: scan.diagnosis,
      is_confident: true,
      top_candidates: [scan.diagnosis],
      advisory: scan.advisory,
      weather_context: scan.weatherSnapshot
        ? {
            location: { city: "Saved Location", country: "India" },
            weather: scan.weatherSnapshot,
            agro_risk_assessment: {
              fungal_outbreak_risk: "Historical",
              risk_factors: ["Snapshot from original diagnostic scan."],
              spraying_advisory: "Review current live weather before field application.",
              is_spraying_favorable: true
            }
          }
        : null
    });
    setActiveThumbnail(scan.imageThumbnail);
    setActiveTab("scan");
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-stone-900 flex flex-col font-sans">
      {/* Navigation Header */}
      <Navbar
        lang={lang}
        onLanguageChange={setLang}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        savedScansCount={savedScansCount}
      />

      {/* Main Content Container */}
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <InstallBanner lang={lang} />

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900 sm:text-sm">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-rose-600 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-rose-950">Diagnostic Service Notice</p>
              <p>{errorMessage}</p>
              <p className="text-[11px] text-rose-700">
                Tip: Run <code className="bg-rose-100 px-1 py-0.5 rounded font-mono">python -m uvicorn app.main:app --reload</code> inside <code className="bg-rose-100 px-1 py-0.5 rounded font-mono">backend/</code> to start the local model service.
              </p>
            </div>
          </div>
        )}

        {/* Tab 1: Diagnostic Scanner */}
        {activeTab === "scan" && (
          <div className="space-y-6">
            {!diagnosisResult ? (
              <ImageUploader
                lang={lang}
                onAnalyze={handleAnalyze}
                isAnalyzing={isAnalyzing}
                validationError={validationError}
                onClearValidation={() => setValidationError(null)}
              />
            ) : (
              <DiagnosisCard
                data={diagnosisResult}
                imageThumbnail={activeThumbnail || ""}
                lang={lang}
                onReset={handleResetScan}
                onSaved={refreshSavedCount}
              />
            )}
          </div>
        )}

        {/* Tab 2: APMC Mandi Market Prices */}
        {activeTab === "mandi" && (
          <MandiTracker lang={lang} />
        )}

        {/* Tab 3: Agro-Weather & Spraying Advisory */}
        {activeTab === "weather" && (
          <WeatherCard
            lang={lang}
            initialData={diagnosisResult?.weather_context}
          />
        )}

        {/* Tab 4: Offline Scan History */}
        {activeTab === "history" && (
          <ScanHistoryView
            lang={lang}
            onSelectScan={handleSelectHistoricalScan}
            onScansUpdated={refreshSavedCount}
          />
        )}
      </main>

      {/* Modern Clean Footer */}
      <footer className="mt-auto border-t border-stone-200/80 bg-white py-6 text-xs text-stone-500">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-800 text-white">
              <Sprout className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold text-stone-900">CropDoc</span>
            <span>— Indian Agricultural Pathology, Mandi &amp; Weather System</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/Rohank3/CropDoc"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-stone-600 hover:text-stone-900 transition-colors"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>GitHub</span>
            </a>
            <span>•</span>
            <span>CIBRC Standards &amp; APMC Mandi Intelligence</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
