"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { ImageUploader } from "@/components/ImageUploader";
import { DiagnosisCard } from "@/components/DiagnosisCard";
import { WeatherCard } from "@/components/WeatherCard";
import { ScanHistoryView } from "@/components/ScanHistoryView";
import { InstallBanner } from "@/components/InstallBanner";
import { Language, DiagnosisResponse, SavedScan } from "@/types";
import { diagnoseCrop } from "@/lib/api";
import { getSavedScans } from "@/lib/storage";
import { Sprout, AlertTriangle } from "lucide-react";

export default function Home() {
  const [lang, setLang] = useState<Language>("en");
  const [activeTab, setActiveTab] = useState<"scan" | "weather" | "history">("scan");
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResponse | null>(null);
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
    try {
      const response = await diagnoseCrop(imageBlob, location);
      setDiagnosisResult(response);
      setActiveThumbnail(previewUrl);
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
  };

  const handleSelectHistoricalScan = (scan: SavedScan) => {
    setDiagnosisResult({
      status: "success",
      diagnosis: scan.diagnosis,
      is_confident: true,
      top_candidates: [scan.diagnosis],
      advisory: scan.advisory,
      weather_context: scan.weatherSnapshot
        ? {
            location: { name: "Saved Location" },
            weather: scan.weatherSnapshot,
            agro_advisory: {
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
    <div className="min-h-screen bg-gradient-to-b from-emerald-950 via-slate-950 to-black text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-emerald-950">
      {/* Navigation Header */}
      <Navbar
        lang={lang}
        onLanguageChange={setLang}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        savedScansCount={savedScansCount}
      />

      {/* Main Content Container */}
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <InstallBanner lang={lang} />

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/40 bg-red-950/40 p-4 text-xs text-red-200 sm:text-sm animate-in fade-in">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-red-300">Diagnostic Service Error</p>
              <p>{errorMessage}</p>
              <p className="text-[11px] text-red-400/80">
                Tip: Run <code className="bg-red-900/60 px-1 py-0.5 rounded">python -m uvicorn app.main:app --reload</code> inside <code className="bg-red-900/60 px-1 py-0.5 rounded">backend/</code> to start the local AI server.
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

        {/* Tab 2: Agro-Weather Dashboard */}
        {activeTab === "weather" && (
          <WeatherCard
            lang={lang}
            initialData={diagnosisResult?.weather_context}
          />
        )}

        {/* Tab 3: Offline Scan History */}
        {activeTab === "history" && (
          <ScanHistoryView
            lang={lang}
            onSelectScan={handleSelectHistoricalScan}
            onScansUpdated={refreshSavedCount}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-emerald-950 bg-black/80 py-6 text-center text-xs text-emerald-300/60">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-3 px-4 sm:flex-row">
          <div className="flex items-center gap-1.5">
            <Sprout className="h-4 w-4 text-emerald-400" />
            <span className="font-bold text-emerald-200">CropDoc</span>
            <span>— AI Agricultural Pathology Platform</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/Rohank3/CropDoc"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-emerald-300/80 hover:text-emerald-300 transition-colors"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>GitHub</span>
            </a>
            <span>•</span>
            <span className="flex items-center gap-1">
              Built with genuine models &amp; zero mock data
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
