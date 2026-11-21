"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, AlertTriangle, Sprout, FlaskConical, 
  Wind, CheckCircle2, Volume2, VolumeX, BookmarkPlus, 
  Sparkles
} from "lucide-react";
import confetti from "canvas-confetti";
import { DiagnosisResponse, Language } from "@/types";
import { translations } from "@/lib/i18n";
import { saveScan } from "@/lib/storage";

interface DiagnosisCardProps {
  data: DiagnosisResponse;
  imageThumbnail: string;
  lang: Language;
  onReset: () => void;
  onSaved: () => void;
}

export function DiagnosisCard({
  data,
  imageThumbnail,
  lang,
  onReset,
  onSaved
}: DiagnosisCardProps) {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<"organic" | "chemical" | "prevention" | "weather" | "ai">("organic");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const { diagnosis, advisory, is_confident, top_candidates, weather_context } = data;
  const isHealthy = diagnosis.is_healthy;

  // Trigger celebration confetti on healthy leaves or positive diagnoses
  useEffect(() => {
    if (isHealthy) {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#34d399", "#10b981", "#059669"]
      });
    }
  }, [isHealthy]);

  // Handle SpeechSynthesis audio reading
  const toggleSpeech = () => {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported on this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    let speechText = "";
    if (lang === "hi") {
      speechText = `फसल निदान परिणाम: ${diagnosis.crop}. स्थिति: ${diagnosis.condition}. रोग कारक: ${advisory.pathogen}. `;
      if (isHealthy) {
        speechText += "फसल पूर्णतः स्वस्थ है। किसी कीटनाशक की आवश्यकता नहीं है।";
      } else {
        speechText += "मुख्य जैविक उपाय: " + advisory.organic_remedies.join(". ") + ". ";
        if (advisory.chemical_remedies.length > 0) {
          speechText += "रासायनिक उपचार: " + advisory.chemical_remedies.join(". ") + ". ";
        }
      }
    } else {
      speechText = `Crop diagnosis report for ${diagnosis.crop}. Identified condition: ${diagnosis.condition}. Pathogen: ${advisory.pathogen}. Severity: ${advisory.severity}. `;
      if (isHealthy) {
        speechText += "The leaf is completely healthy! No chemical fungicides or treatments required.";
      } else {
        speechText += "Recommended organic treatments: " + advisory.organic_remedies.join(". ") + ". ";
        if (advisory.chemical_remedies.length > 0) {
          speechText += "Chemical control guidelines: " + advisory.chemical_remedies.join(". ") + ". ";
        }
      }
    }

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = lang === "hi" ? "hi-IN" : "en-US";
    utterance.rate = 0.95;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleSaveToDevice = () => {
    saveScan(
      diagnosis,
      advisory,
      imageThumbnail,
      weather_context?.weather
    );
    setIsSaved(true);
    onSaved();
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return {
          bg: "bg-red-500/20 text-red-300 ring-red-500/30",
          dot: "bg-red-400 animate-pulse",
          text: "Critical Threat"
        };
      case "high":
        return {
          bg: "bg-orange-500/20 text-orange-300 ring-orange-500/30",
          dot: "bg-orange-400",
          text: "High Severity"
        };
      case "medium":
        return {
          bg: "bg-amber-500/20 text-amber-300 ring-amber-500/30",
          dot: "bg-amber-400",
          text: "Moderate Severity"
        };
      case "none":
        return {
          bg: "bg-emerald-500/20 text-emerald-300 ring-emerald-500/30",
          dot: "bg-emerald-400",
          text: "Healthy Foliage"
        };
      default:
        return {
          bg: "bg-blue-500/20 text-blue-300 ring-blue-500/30",
          dot: "bg-blue-400",
          text: severity
        };
    }
  };

  const severityStyle = getSeverityBadge(advisory.severity);

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Top Banner Card */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-700/60 bg-emerald-950/90 p-5 sm:p-7 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          {/* Diagnostic Details */}
          <div className="flex items-start gap-4">
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border border-emerald-600/40 bg-black/40 shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageThumbnail}
                alt={diagnosis.display_name}
                className="h-full w-full object-cover"
              />
              {isHealthy && (
                <div className="absolute bottom-1 right-1 rounded-full bg-emerald-500 p-0.5 text-emerald-950 shadow">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
                  {diagnosis.crop}
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${severityStyle.bg}`}>
                  <span className={`h-2 w-2 rounded-full ${severityStyle.dot}`} />
                  <span>{severityStyle.text}</span>
                </span>
              </div>

              <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                {diagnosis.condition}
              </h2>

              <p className="text-xs text-emerald-200/70 sm:text-sm">
                <span className="font-semibold text-emerald-300">{t.pathogen}:</span>{" "}
                {advisory.pathogen}
              </p>
            </div>
          </div>

          {/* Confidence Meter */}
          <div className="flex flex-row items-center justify-between gap-3 rounded-2xl border border-emerald-800/80 bg-emerald-900/40 p-3 sm:flex-col sm:items-end sm:p-3.5">
            <span className="text-xs text-emerald-300/80">{t.confidence}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-emerald-300">
                {diagnosis.confidence_score}%
              </span>
            </div>
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-emerald-950">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                style={{ width: `${diagnosis.confidence_score}%` }}
              />
            </div>
          </div>
        </div>

        {/* Low Confidence Advisory Notice */}
        {!is_confident && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-400" />
            <span>{t.lowConfidenceWarn}</span>
          </div>
        )}

        {/* Symptoms Overview */}
        {advisory.symptoms && (
          <div className="mt-4 rounded-2xl border border-emerald-800/60 bg-emerald-900/30 p-3.5 text-xs leading-relaxed text-emerald-100/90 sm:text-sm">
            <p className="font-medium text-emerald-300 pb-1">Visual Symptoms Recorded:</p>
            <p>{advisory.symptoms}</p>
          </div>
        )}

        {/* Audio Prescription & Save Action Row */}
        <div className="mt-5 flex flex-wrap items-center gap-2.5 pt-2 border-t border-emerald-800/50">
          <button
            onClick={toggleSpeech}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold shadow-md transition-all active:scale-95 ${
              isSpeaking
                ? "bg-amber-500 text-amber-950 ring-2 ring-amber-400"
                : "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-500/30 hover:bg-emerald-500/30"
            }`}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="h-4 w-4 text-amber-950 animate-pulse" />
                <span>{t.stopAudio}</span>
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4 text-emerald-400" />
                <span>{t.listenRemedies}</span>
              </>
            )}
          </button>

          <button
            onClick={handleSaveToDevice}
            disabled={isSaved}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold ring-1 transition-all active:scale-95 ${
              isSaved
                ? "bg-emerald-800/60 text-emerald-300 ring-emerald-700/60 cursor-default"
                : "bg-emerald-900/40 text-emerald-200 ring-emerald-700/60 hover:bg-emerald-900/80"
            }`}
          >
            <BookmarkPlus className="h-4 w-4 text-emerald-400" />
            <span>{isSaved ? t.savedLocally : t.saveDiagnosis}</span>
          </button>

          <button
            onClick={onReset}
            className="ml-auto rounded-xl border border-emerald-700/60 bg-emerald-950/60 px-4 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-900"
          >
            {t.retakePhoto}
          </button>
        </div>
      </div>

      {/* Prescription & Advisory Tabs */}
      <div className="overflow-hidden rounded-3xl border border-emerald-700/60 bg-emerald-950/80 p-5 sm:p-7 shadow-xl">
        {/* Tab Headers */}
        <div className="flex border-b border-emerald-800/60 pb-3 gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("organic")}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === "organic"
                ? "bg-emerald-500 text-emerald-950 shadow-md shadow-emerald-500/20"
                : "text-emerald-300 hover:bg-emerald-900/50"
            }`}
          >
            <Sprout className="h-4 w-4" />
            <span>{t.organicTab}</span>
          </button>

          <button
            onClick={() => setActiveTab("chemical")}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === "chemical"
                ? "bg-emerald-500 text-emerald-950 shadow-md shadow-emerald-500/20"
                : "text-emerald-300 hover:bg-emerald-900/50"
            }`}
          >
            <FlaskConical className="h-4 w-4" />
            <span>{t.chemicalTab}</span>
          </button>

          <button
            onClick={() => setActiveTab("prevention")}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === "prevention"
                ? "bg-emerald-500 text-emerald-950 shadow-md shadow-emerald-500/20"
                : "text-emerald-300 hover:bg-emerald-900/50"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>{t.preventiveTab}</span>
          </button>

          <button
            onClick={() => setActiveTab("weather")}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === "weather"
                ? "bg-emerald-500 text-emerald-950 shadow-md shadow-emerald-500/20"
                : "text-emerald-300 hover:bg-emerald-900/50"
            }`}
          >
            <Wind className="h-4 w-4" />
            <span>{t.weatherTab}</span>
          </button>

          {advisory.ai_insights && (
            <button
              onClick={() => setActiveTab("ai")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === "ai"
                  ? "bg-gradient-to-r from-teal-400 to-emerald-400 text-emerald-950 font-bold shadow-md shadow-emerald-500/20"
                  : "text-teal-300 hover:bg-emerald-900/50"
              }`}
            >
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span>{t.aiAdvisoryTab}</span>
            </button>
          )}
        </div>

        {/* Tab Body Content */}
        <div className="pt-5">
          {/* Organic Tab */}
          {activeTab === "organic" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-300 text-sm font-bold">
                <Sprout className="h-4 w-4 text-emerald-400" />
                <span>Certified Biological & Organic Interventions:</span>
              </div>
              <ul className="space-y-2.5">
                {advisory.organic_remedies.map((remedy, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 rounded-2xl border border-emerald-800/40 bg-emerald-900/30 p-3.5 text-xs leading-relaxed text-emerald-100 sm:text-sm"
                  >
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[11px] font-bold text-emerald-400 ring-1 ring-emerald-500/30">
                      {idx + 1}
                    </span>
                    <span>{remedy}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Chemical Tab */}
          {activeTab === "chemical" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-300 text-sm font-bold">
                <FlaskConical className="h-4 w-4 text-emerald-400" />
                <span>Targeted Fungicide & Bactericide Regimen:</span>
              </div>
              {isHealthy ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center text-xs text-emerald-200 sm:text-sm">
                  {t.noChemicalsNeeded}
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {advisory.chemical_remedies.map((chem, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 rounded-2xl border border-emerald-800/40 bg-emerald-900/30 p-3.5 text-xs leading-relaxed text-emerald-100 sm:text-sm"
                    >
                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-[11px] font-bold text-teal-300 ring-1 ring-teal-500/30">
                        {idx + 1}
                      </span>
                      <span>{chem}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Prevention Tab */}
          {activeTab === "prevention" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-300 text-sm font-bold">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Agronomic & Cultural Practices to Prevent Recurrence:</span>
              </div>
              <ul className="space-y-2.5">
                {advisory.preventive_practices.map((practice, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 rounded-2xl border border-emerald-800/40 bg-emerald-900/30 p-3.5 text-xs leading-relaxed text-emerald-100 sm:text-sm"
                  >
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-400 mt-0.5" />
                    <span>{practice}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Weather Risk Factors Tab */}
          {activeTab === "weather" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-300 text-sm font-bold">
                <Wind className="h-4 w-4 text-emerald-400" />
                <span>Micro-Climate Conditions Favoring This Pathogen:</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-emerald-800/60 bg-emerald-900/30 p-4 text-center">
                  <span className="text-[11px] text-emerald-300/70 uppercase tracking-wider block pb-1">
                    Ideal Temperature
                  </span>
                  <span className="text-base font-bold text-white">
                    {advisory.weather_triggers?.ideal_temp_range || "20°C - 28°C"}
                  </span>
                </div>

                <div className="rounded-2xl border border-emerald-800/60 bg-emerald-900/30 p-4 text-center">
                  <span className="text-[11px] text-emerald-300/70 uppercase tracking-wider block pb-1">
                    Humidity Threshold
                  </span>
                  <span className="text-base font-bold text-white">
                    {advisory.weather_triggers?.humidity_threshold || "> 80% RH"}
                  </span>
                </div>

                <div className="rounded-2xl border border-emerald-800/60 bg-emerald-900/30 p-4 text-center">
                  <span className="text-[11px] text-emerald-300/70 uppercase tracking-wider block pb-1">
                    Leaf Wetness Factor
                  </span>
                  <span className="text-xs font-semibold text-emerald-200">
                    {advisory.weather_triggers?.leaf_wetness_hours || "Prolonged surface water"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Dynamic AI Plan Tab */}
          {activeTab === "ai" && advisory.ai_insights && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-teal-300 text-sm font-bold">
                <Sparkles className="h-4 w-4 text-teal-400" />
                <span>Context-Aware AI Agricultural Action Plan:</span>
              </div>
              <div className="rounded-2xl border border-teal-600/40 bg-teal-950/40 p-4 text-xs leading-relaxed text-teal-100 sm:text-sm whitespace-pre-line">
                {advisory.ai_insights}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Differential Top Candidates Card */}
      {top_candidates && top_candidates.length > 1 && (
        <div className="rounded-3xl border border-emerald-800/60 bg-emerald-950/60 p-5 shadow-lg">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300/80 mb-3">
            {t.topCandidates}
          </h4>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {top_candidates.slice(1).map((cand, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl border border-emerald-800/40 bg-emerald-900/20 px-3.5 py-2.5 text-xs"
              >
                <div className="space-y-0.5">
                  <p className="font-semibold text-white">{cand.condition}</p>
                  <p className="text-[10px] text-emerald-300/60">{cand.crop}</p>
                </div>
                <span className="font-mono font-bold text-emerald-400">
                  {cand.confidence_score}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
