"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, AlertTriangle, Sprout, FlaskConical, 
  Wind, CheckCircle2, Volume2, VolumeX, BookmarkPlus, 
  FileText
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

  // Gentle celebration confetti for healthy crop findings
  useEffect(() => {
    if (isHealthy) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#15803d", "#22c55e", "#86efac"]
      });
    }
  }, [isHealthy]);

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
      speechText = `Diagnosis report for ${diagnosis.crop}. Condition: ${diagnosis.condition}. Pathogen: ${advisory.pathogen}. Severity: ${advisory.severity}. `;
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
          bg: "bg-rose-50 text-rose-800 ring-1 ring-rose-600/20",
          dot: "bg-rose-600",
          text: "Critical Threat"
        };
      case "high":
        return {
          bg: "bg-orange-50 text-orange-800 ring-1 ring-orange-600/20",
          dot: "bg-orange-600",
          text: "High Severity"
        };
      case "medium":
        return {
          bg: "bg-amber-50 text-amber-800 ring-1 ring-amber-600/20",
          dot: "bg-amber-600",
          text: "Moderate Severity"
        };
      case "none":
        return {
          bg: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/20",
          dot: "bg-emerald-600",
          text: "Healthy Foliage"
        };
      default:
        return {
          bg: "bg-stone-100 text-stone-800 ring-1 ring-stone-300",
          dot: "bg-stone-500",
          text: severity
        };
    }
  };

  const severityStyle = getSeverityBadge(advisory.severity);

  return (
    <div className="w-full space-y-6">
      {/* Top Prescription Card */}
      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          {/* Diagnostic Details */}
          <div className="flex items-start gap-4">
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageThumbnail}
                alt={diagnosis.display_name}
                className="h-full w-full object-cover"
              />
              {isHealthy && (
                <div className="absolute bottom-1 right-1 rounded-full bg-emerald-700 p-0.5 text-white shadow">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-800">
                  {diagnosis.crop}
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold ${severityStyle.bg}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${severityStyle.dot}`} />
                  <span>{severityStyle.text}</span>
                </span>
              </div>

              <h2 className="text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">
                {diagnosis.condition}
              </h2>

              <p className="text-xs text-stone-600 sm:text-sm">
                <span className="font-semibold text-stone-800">{t.pathogen}:</span>{" "}
                {advisory.pathogen}
              </p>
            </div>
          </div>

          {/* Diagnostic Certainty Bar */}
          <div className="flex flex-row items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-stone-50/80 p-3 sm:flex-col sm:items-end sm:p-3.5">
            <span className="text-xs font-medium text-stone-500">{t.confidence}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-stone-900">
                {diagnosis.confidence_score}%
              </span>
            </div>
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-stone-200">
              <div
                className="h-full rounded-full bg-emerald-800"
                style={{ width: `${diagnosis.confidence_score}%` }}
              />
            </div>
          </div>
        </div>

        {/* Low Confidence Warning */}
        {!is_confident && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-700" />
            <span>{t.lowConfidenceWarn}</span>
          </div>
        )}

        {/* Symptoms Overview */}
        {advisory.symptoms && (
          <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50/60 p-4 text-xs leading-relaxed text-stone-700 sm:text-sm">
            <p className="font-semibold text-stone-900 pb-1">Visual Symptoms:</p>
            <p>{advisory.symptoms}</p>
          </div>
        )}

        {/* Audio Prescription & Action Row */}
        <div className="mt-5 flex flex-wrap items-center gap-2.5 pt-3 border-t border-stone-100">
          <button
            onClick={toggleSpeech}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors active:scale-95 ${
              isSpeaking
                ? "bg-amber-100 text-amber-900 ring-1 ring-amber-300"
                : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="h-4 w-4 text-amber-800 animate-pulse" />
                <span>{t.stopAudio}</span>
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4 text-stone-600" />
                <span>{t.listenRemedies}</span>
              </>
            )}
          </button>

          <button
            onClick={handleSaveToDevice}
            disabled={isSaved}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors active:scale-95 ${
              isSaved
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-default"
                : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            <BookmarkPlus className="h-4 w-4 text-stone-600" />
            <span>{isSaved ? t.savedLocally : t.saveDiagnosis}</span>
          </button>

          <button
            onClick={onReset}
            className="ml-auto rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
          >
            {t.retakePhoto}
          </button>
        </div>
      </div>

      {/* Structured Prescription Tabs */}
      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white p-5 sm:p-7 shadow-sm">
        {/* Segmented Controls */}
        <div className="flex border-b border-stone-100 pb-3 gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("organic")}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === "organic"
                ? "bg-emerald-800 text-white shadow-2xs"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"
            }`}
          >
            <Sprout className="h-4 w-4" />
            <span>{t.organicTab}</span>
          </button>

          <button
            onClick={() => setActiveTab("chemical")}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === "chemical"
                ? "bg-emerald-800 text-white shadow-2xs"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"
            }`}
          >
            <FlaskConical className="h-4 w-4" />
            <span>{t.chemicalTab}</span>
          </button>

          <button
            onClick={() => setActiveTab("prevention")}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === "prevention"
                ? "bg-emerald-800 text-white shadow-2xs"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>{t.preventiveTab}</span>
          </button>

          <button
            onClick={() => setActiveTab("weather")}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === "weather"
                ? "bg-emerald-800 text-white shadow-2xs"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"
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
                  ? "bg-emerald-800 text-white shadow-2xs"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>{t.aiAdvisoryTab}</span>
            </button>
          )}
        </div>

        {/* Tab Body */}
        <div className="pt-5">
          {/* Biological & Organic Tab */}
          {activeTab === "organic" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-stone-900 text-sm font-bold">
                <Sprout className="h-4 w-4 text-emerald-800" />
                <span>Certified Biological & Organic Interventions:</span>
              </div>
              <ul className="space-y-2.5">
                {advisory.organic_remedies.map((remedy, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 rounded-2xl border border-stone-200/80 bg-stone-50/70 p-4 text-xs leading-relaxed text-stone-800 sm:text-sm"
                  >
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-800">
                      {idx + 1}
                    </span>
                    <span>{remedy}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Chemical Control Tab */}
          {activeTab === "chemical" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-stone-900 text-sm font-bold">
                <FlaskConical className="h-4 w-4 text-emerald-800" />
                <span>Targeted Fungicide & Chemical Protocol:</span>
              </div>
              {isHealthy ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center text-xs text-emerald-900 sm:text-sm">
                  {t.noChemicalsNeeded}
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {advisory.chemical_remedies.map((chem, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 rounded-2xl border border-stone-200/80 bg-stone-50/70 p-4 text-xs leading-relaxed text-stone-800 sm:text-sm"
                    >
                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-stone-200 text-[11px] font-bold text-stone-800">
                        {idx + 1}
                      </span>
                      <span>{chem}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Cultural Prevention Tab */}
          {activeTab === "prevention" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-stone-900 text-sm font-bold">
                <ShieldCheck className="h-4 w-4 text-emerald-800" />
                <span>Agronomic Practices to Prevent Spore Recurrence:</span>
              </div>
              <ul className="space-y-2.5">
                {advisory.preventive_practices.map((practice, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 rounded-2xl border border-stone-200/80 bg-stone-50/70 p-4 text-xs leading-relaxed text-stone-800 sm:text-sm"
                  >
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-700 mt-0.5" />
                    <span>{practice}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Environmental Triggers Tab */}
          {activeTab === "weather" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-stone-900 text-sm font-bold">
                <Wind className="h-4 w-4 text-emerald-800" />
                <span>Micro-Climate Conditions Favoring This Pathogen:</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4 text-center">
                  <span className="text-[11px] text-stone-500 uppercase tracking-wider block pb-1 font-semibold">
                    Optimal Temperature
                  </span>
                  <span className="text-base font-bold text-stone-900">
                    {advisory.weather_triggers?.ideal_temp_range || "20°C - 28°C"}
                  </span>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4 text-center">
                  <span className="text-[11px] text-stone-500 uppercase tracking-wider block pb-1 font-semibold">
                    Humidity Threshold
                  </span>
                  <span className="text-base font-bold text-stone-900">
                    {advisory.weather_triggers?.humidity_threshold || "> 80% RH"}
                  </span>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4 text-center">
                  <span className="text-[11px] text-stone-500 uppercase tracking-wider block pb-1 font-semibold">
                    Leaf Wetness Factor
                  </span>
                  <span className="text-xs font-semibold text-stone-800">
                    {advisory.weather_triggers?.leaf_wetness_hours || "Prolonged surface water"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Plan Tab */}
          {activeTab === "ai" && advisory.ai_insights && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-stone-900 text-sm font-bold">
                <FileText className="h-4 w-4 text-emerald-800" />
                <span>Contextual Agronomic Action Plan:</span>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50/90 p-5 text-xs leading-relaxed text-stone-800 sm:text-sm whitespace-pre-line">
                {advisory.ai_insights}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Differential Diagnosis Possibilities */}
      {top_candidates && top_candidates.length > 1 && (
        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
            {t.topCandidates}
          </h4>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {top_candidates.slice(1).map((cand, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl border border-stone-200/80 bg-stone-50/60 px-4 py-3 text-xs"
              >
                <div className="space-y-0.5">
                  <p className="font-semibold text-stone-900">{cand.condition}</p>
                  <p className="text-[10px] text-stone-500">{cand.crop}</p>
                </div>
                <span className="font-mono font-bold text-stone-700">
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
