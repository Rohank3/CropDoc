"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, AlertTriangle, Sprout, FlaskConical, 
  Wind, CheckCircle2, Volume2, VolumeX, BookmarkPlus, 
  Share2, Droplet, Clock, Sparkles, Check
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
  const [activeTab, setActiveTab] = useState<"cibrc" | "organic" | "prevention" | "weather" | "ai">("cibrc");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const { diagnosis, advisory, top_candidates, weather_context, stage_applied } = data;
  const isHealthy = diagnosis?.is_healthy ?? false;

  // Gentle celebration confetti for healthy crop findings (Hook called at top level)
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

  if (!diagnosis || !advisory) return null;

  const severityGauge = advisory.severity_gauge || (isHealthy ? "green" : advisory.severity.toLowerCase().includes("high") || advisory.severity.toLowerCase().includes("critical") ? "red" : "yellow");

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
      speechText = `किसान जांच रिपोर्ट: फसल ${diagnosis.crop_hi || diagnosis.crop}. रोग की पहचान: ${diagnosis.condition_hi || diagnosis.condition}. `;
      if (isHealthy) {
        speechText += "फसल पूर्णतः स्वस्थ है। किसी भी रासायनिक कीटनाशक की आवश्यकता नहीं है।";
      } else {
        speechText += `गंभीरता: ${advisory.severity}. `;
        if (advisory.tanki_quick_dose) {
          speechText += `15 लीटर ढोलकी स्प्रे की अनुशंसित मात्रा: ${advisory.tanki_quick_dose}. `;
        }
        if (advisory.cibrc_chemical && advisory.cibrc_chemical.length > 0) {
          speechText += `सरकारी प्रमाणित दवा: ${advisory.cibrc_chemical[0].name}, मात्रा ${advisory.cibrc_chemical[0].dose_per_tank_15l}. `;
        }
        if (advisory.cibrc_organic && advisory.cibrc_organic.length > 0) {
          speechText += `जैविक देसी उपाय: ${advisory.cibrc_organic[0].name}, मात्रा ${advisory.cibrc_organic[0].dose_per_tank_15l}.`;
        }
      }
    } else {
      speechText = `Diagnostic report for ${diagnosis.crop}. Diagnosis: ${diagnosis.condition}. Pathogen: ${advisory.pathogen}. Severity: ${advisory.severity}. `;
      if (isHealthy) {
        speechText += "The leaf is completely healthy! No chemical fungicides or treatments required.";
      } else {
        if (advisory.tanki_quick_dose) {
          speechText += `Immediate 15-litre tank dosage: ${advisory.tanki_quick_dose}. `;
        }
        if (advisory.cibrc_chemical && advisory.cibrc_chemical.length > 0) {
          speechText += `Recommended chemical control: ${advisory.cibrc_chemical[0].name} at ${advisory.cibrc_chemical[0].dose_per_tank_15l}. `;
        }
        if (advisory.cibrc_organic && advisory.cibrc_organic.length > 0) {
          speechText += `Organic bio alternative: ${advisory.cibrc_organic[0].name} at ${advisory.cibrc_organic[0].dose_per_tank_15l}.`;
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
    setTimeout(() => setIsSaved(false), 3000);
  };

  // WhatsApp Share Prescription Slip
  const shareViaWhatsApp = () => {
    const cropName = lang === "hi" ? (diagnosis.crop_hi || diagnosis.crop) : diagnosis.crop;
    const condName = lang === "hi" ? (diagnosis.condition_hi || diagnosis.condition) : diagnosis.condition;
    const primaryChem = advisory.cibrc_chemical?.[0];
    const primaryOrg = advisory.cibrc_organic?.[0];

    const lines = [
      `🌾 *CropDoc किसान दवा पर्चा / Prescription Slip*`,
      `🌱 *${lang === "hi" ? "फसल" : "Crop"}:* ${cropName}`,
      `🔬 *${lang === "hi" ? "रोग पहचान" : "Diagnosis"}:* ${condName}`,
      `⚠️ *${lang === "hi" ? "गंभीरता" : "Severity"}:* ${advisory.severity}`,
      advisory.tanki_quick_dose ? `🎯 *15L ${lang === "hi" ? "ढोलकी मात्रा" : "Tank Dose"}:* ${advisory.tanki_quick_dose}` : "",
      primaryChem ? `🧪 *${lang === "hi" ? "प्रमाणित दवा" : "Chemical"}:* ${primaryChem.name} (${primaryChem.dose_per_tank_15l})` : "",
      primaryChem ? `💰 *${lang === "hi" ? "अनुमानित खर्च" : "Est. Cost"}:* ${primaryChem.est_cost_inr}` : "",
      primaryChem ? `⏳ *${lang === "hi" ? "कटाई प्रतीक्षा (PHI)" : "Harvest Wait"}:* ${primaryChem.phi_days} ${lang === "hi" ? "दिन" : "days"}` : "",
      primaryOrg ? `🌿 *${lang === "hi" ? "जैविक उपाय" : "Bio/Organic"}:* ${primaryOrg.name} (${primaryOrg.dose_per_tank_15l})` : "",
      `\n📍 _${lang === "hi" ? "नजदीकी कृषि सेवा केंद्र या खाद-बीज दुकान पर दिखाएं।" : "Show this slip at your local Krishi Seva Kendra"}_`
    ].filter(Boolean);

    const message = encodeURIComponent(lines.join("\n"));
    window.open(`https://api.whatsapp.com/send?text=${message}`, "_blank");
  };

  return (
    <div className="w-full space-y-6">
      {/* Main Diagnosis Card */}
      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-md">
        
        {/* Severity Header Banner */}
        <div className={`px-6 py-4 flex flex-wrap items-center justify-between gap-3 ${
          severityGauge === "green" 
            ? "bg-emerald-700 text-white" 
            : severityGauge === "red"
            ? "bg-rose-700 text-white"
            : "bg-amber-600 text-white"
        }`}>
          <div className="flex items-center gap-3">
            {severityGauge === "green" ? (
              <ShieldCheck className="w-7 h-7 shrink-0 text-emerald-200" />
            ) : severityGauge === "red" ? (
              <AlertTriangle className="w-7 h-7 shrink-0 text-rose-200 animate-bounce" />
            ) : (
              <AlertTriangle className="w-7 h-7 shrink-0 text-amber-200" />
            )}
            <div>
              <span className="text-xs font-semibold tracking-wide uppercase opacity-90">
                {lang === "hi" ? "फसल स्वास्थ्य स्थिति" : "Pathology Severity Gauge"}
              </span>
              <p className="text-lg font-black tracking-tight">
                {severityGauge === "green" 
                  ? (lang === "hi" ? "🟢 स्वस्थ पत्ती (फसल सुरक्षित)" : "🟢 Healthy Leaf (Safe)")
                  : severityGauge === "red"
                  ? (lang === "hi" ? "🔴 गंभीर प्रकोप (तुरंत छिड़काव आवश्यक)" : "🔴 Severe Outbreak (Urgent Spray Required)")
                  : (lang === "hi" ? "🟡 मध्यम प्रकोप (निगरानी व रोकथाम)" : "🟡 Moderate Infection (Monitor & Treat)")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Reader Button */}
            <button
              type="button"
              onClick={toggleSpeech}
              className="flex items-center gap-1.5 rounded-xl bg-white/20 hover:bg-white/30 px-3.5 py-2 text-xs font-bold text-white backdrop-blur-sm transition active:scale-95"
              aria-label="Read prescription aloud"
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-4 h-4 text-rose-200" />
                  <span>{t.stopAudio}</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-100" />
                  <span>{t.listenRemedies}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Diagnosis Identity & Thumbnail Row */}
        <div className="p-6 border-b border-stone-200">
          <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageThumbnail}
                alt="Diagnosed leaf specimen"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-stone-200 shadow-sm shrink-0"
              />
              <div>
                <span className="inline-block rounded-md bg-stone-100 px-2.5 py-0.5 text-xs font-bold text-stone-700 uppercase tracking-wider">
                  {lang === "hi" ? (diagnosis.crop_hi || diagnosis.crop) : diagnosis.crop}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 mt-1">
                  {lang === "hi" ? (diagnosis.condition_hi || diagnosis.condition) : diagnosis.condition}
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 font-mono mt-0.5">
                  {advisory.pathogen}
                </p>
              </div>
            </div>

            {/* Certainty Gauge */}
            <div className="flex flex-col sm:items-end gap-1">
              <span className="text-xs text-stone-500 font-medium">
                {t.confidence}: <strong className="text-stone-900">{diagnosis.confidence_score}%</strong>
              </span>
              <div className="w-36 bg-stone-200 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-2 rounded-full ${
                    diagnosis.confidence_score >= 80 ? "bg-emerald-600" : diagnosis.confidence_score >= 50 ? "bg-amber-500" : "bg-rose-500"
                  }`}
                  style={{ width: `${Math.min(100, diagnosis.confidence_score)}%` }}
                />
              </div>
              {(stage_applied === "stage3_multimodal" || stage_applied === "stage3_gemini_multimodal_live" || data.is_live_ai) && (
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 flex items-center gap-1 mt-1">
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  Live Gemini Multimodal AI
                </span>
              )}
            </div>
          </div>

          {/* Quick Symptoms Callout */}
          {advisory.symptoms && (
            <div className="mt-4 rounded-xl bg-stone-50 p-3.5 border border-stone-200 text-xs text-stone-700 leading-relaxed">
              <strong className="text-stone-900 block font-semibold mb-0.5">
                {lang === "hi" ? "लक्षण पहचान (Symptoms):" : "Visual Symptoms:"}
              </strong>
              {lang === "hi" && advisory.symptoms_hi ? advisory.symptoms_hi : advisory.symptoms}
            </div>
          )}
        </div>

        {/* 15L Knapsack Sprayer Highlight Card (ढोलकी मात्रा) */}
        {!isHealthy && (
          <div className="m-6 rounded-2xl bg-gradient-to-r from-emerald-950 to-stone-900 text-white p-5 shadow-lg border border-emerald-800/40">
            <div className="flex items-center justify-between gap-3 border-b border-emerald-800/40 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-600/30 text-emerald-400">
                  <Droplet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {lang === "hi" ? "15 लीटर स्प्रे पंप (ढोलकी) में अनुशंसित मात्रा" : "Standard 15L Backpack Sprayer Dosage"}
                  </h3>
                  <p className="text-xs text-emerald-300 font-medium">
                    {advisory.tanki_quick_dose || "Refer to CIBRC dosage guidelines below"}
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-1 bg-emerald-900/60 px-3 py-1 rounded-xl border border-emerald-700/50 text-xs text-emerald-200">
                <Clock className="w-3.5 h-3.5" />
                <span>Morning 7:00-10:00 AM</span>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3">
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <span className="text-[11px] text-slate-300 block">{t.acreDosage}</span>
                <span className="text-sm font-bold text-emerald-300 mt-0.5 block">
                  {advisory.cibrc_chemical?.[0]?.dose_per_acre || "500g in 200L water"}
                </span>
              </div>

              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <span className="text-[11px] text-slate-300 block">{t.estCost}</span>
                <span className="text-sm font-bold text-amber-300 mt-0.5 flex items-center gap-0.5">
                  {advisory.cibrc_chemical?.[0]?.est_cost_inr || "₹60 - ₹85 / tank"}
                </span>
              </div>

              <div className="col-span-2 sm:col-span-1 bg-white/5 rounded-xl p-3 border border-white/10">
                <span className="text-[11px] text-slate-300 block">{t.phiDays}</span>
                <span className="text-sm font-bold text-sky-300 mt-0.5 block">
                  {advisory.cibrc_chemical?.[0]?.phi_days ? `${advisory.cibrc_chemical[0].phi_days} Days (दिन)` : "Safe / Organic"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 bg-stone-50 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("cibrc")}
            className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === "cibrc"
                ? "border-emerald-700 text-emerald-800 bg-white"
                : "border-transparent text-stone-600 hover:text-stone-900"
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            <span>{t.chemicalTab}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("organic")}
            className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === "organic"
                ? "border-emerald-700 text-emerald-800 bg-white"
                : "border-transparent text-stone-600 hover:text-stone-900"
            }`}
          >
            <Sprout className="w-4 h-4" />
            <span>{t.organicTab}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("prevention")}
            className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === "prevention"
                ? "border-emerald-700 text-emerald-800 bg-white"
                : "border-transparent text-stone-600 hover:text-stone-900"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{t.preventiveTab}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("weather")}
            className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === "weather"
                ? "border-emerald-700 text-emerald-800 bg-white"
                : "border-transparent text-stone-600 hover:text-stone-900"
            }`}
          >
            <Wind className="w-4 h-4" />
            <span>{t.weatherTab}</span>
          </button>

          {advisory.ai_insights && (
            <button
              type="button"
              onClick={() => setActiveTab("ai")}
              className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === "ai"
                  ? "border-emerald-700 text-emerald-800 bg-white"
                  : "border-transparent text-stone-600 hover:text-stone-900"
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>{t.aiAdvisoryTab}</span>
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* CIBRC Chemical Control Tab */}
          {activeTab === "cibrc" && (
            <div className="space-y-4">
              {isHealthy ? (
                <div className="rounded-2xl bg-emerald-50 p-6 text-center border border-emerald-200">
                  <CheckCircle2 className="w-10 h-10 text-emerald-700 mx-auto mb-2" />
                  <p className="text-base font-bold text-emerald-950">{t.noChemicalsNeeded}</p>
                </div>
              ) : advisory.cibrc_chemical && advisory.cibrc_chemical.length > 0 ? (
                advisory.cibrc_chemical.map((chem, idx) => (
                  <div key={idx} className="rounded-2xl border border-stone-200 bg-stone-50 p-4.5 hover:border-emerald-300 transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-2.5">
                      <h4 className="text-base font-black text-stone-900">{chem.name}</h4>
                      <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-900">
                        {chem.dose_per_tank_15l}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 text-xs">
                      <div>
                        <span className="text-stone-500 font-medium block">{t.acreDosage}:</span>
                        <strong className="text-stone-800">{chem.dose_per_acre}</strong>
                      </div>
                      <div>
                        <span className="text-stone-500 font-medium block">{t.estCost}:</span>
                        <strong className="text-emerald-800">{chem.est_cost_inr}</strong>
                      </div>
                      <div>
                        <span className="text-stone-500 font-medium block">{t.phiDays}:</span>
                        <strong className="text-sky-800">{chem.phi_days} Days / दिन</strong>
                      </div>
                    </div>

                    <p className="mt-2.5 text-xs text-stone-600 bg-white p-2.5 rounded-xl border border-stone-200">
                      <strong>नोट / Note:</strong> {chem.application_notes}
                    </p>
                  </div>
                ))
              ) : (
                <ul className="space-y-2">
                  {advisory.chemical_remedies.map((r, i) => (
                    <li key={i} className="text-sm text-stone-700 flex items-start gap-2">
                      <span className="text-emerald-700 font-bold">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Organic / Bio-control Tab */}
          {activeTab === "organic" && (
            <div className="space-y-4">
              {advisory.cibrc_organic && advisory.cibrc_organic.length > 0 ? (
                advisory.cibrc_organic.map((org, idx) => (
                  <div key={idx} className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/80 pb-2.5">
                      <h4 className="text-base font-black text-emerald-950 flex items-center gap-2">
                        <Sprout className="w-5 h-5 text-emerald-700" />
                        {org.name}
                      </h4>
                      <span className="rounded-lg bg-emerald-200/80 px-2.5 py-1 text-xs font-bold text-emerald-950">
                        {org.dose_per_tank_15l}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 text-xs">
                      <div>
                        <span className="text-stone-500 font-medium block">{t.acreDosage}:</span>
                        <strong className="text-stone-800">{org.dose_per_acre}</strong>
                      </div>
                      <div>
                        <span className="text-stone-500 font-medium block">{t.estCost}:</span>
                        <strong className="text-emerald-800">{org.est_cost_inr}</strong>
                      </div>
                      <div>
                        <span className="text-stone-500 font-medium block">{t.phiDays}:</span>
                        <strong className="text-emerald-800">0 Days (Safe to harvest)</strong>
                      </div>
                    </div>

                    <p className="mt-2.5 text-xs text-stone-700 bg-white p-2.5 rounded-xl border border-emerald-200">
                      <strong>प्रयोग विधि:</strong> {org.application_notes}
                    </p>
                  </div>
                ))
              ) : (
                <ul className="space-y-2">
                  {advisory.organic_remedies.map((r, i) => (
                    <li key={i} className="text-sm text-stone-700 flex items-start gap-2">
                      <span className="text-emerald-700 font-bold">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Cultural Prevention Tab */}
          {activeTab === "prevention" && (
            <div className="space-y-3">
              {advisory.preventive_practices.map((p, idx) => (
                <div key={idx} className="flex items-start gap-3 rounded-xl bg-stone-50 p-3.5 border border-stone-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <p className="text-sm text-stone-800 font-medium leading-relaxed">{p}</p>
                </div>
              ))}
            </div>
          )}

          {/* Environmental Triggers Tab */}
          {activeTab === "weather" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl bg-stone-50 p-4 border border-stone-200">
                <span className="text-xs text-stone-500 font-medium block">Optimal Temperature</span>
                <span className="text-sm font-bold text-stone-900 mt-1 block">
                  {advisory.weather_triggers?.ideal_temp_range || "22°C - 30°C"}
                </span>
              </div>
              <div className="rounded-2xl bg-stone-50 p-4 border border-stone-200">
                <span className="text-xs text-stone-500 font-medium block">Humidity Trigger</span>
                <span className="text-sm font-bold text-stone-900 mt-1 block">
                  {advisory.weather_triggers?.humidity_threshold || "> 75% RH"}
                </span>
              </div>
              <div className="rounded-2xl bg-stone-50 p-4 border border-stone-200">
                <span className="text-xs text-stone-500 font-medium block">Foliar Wetness</span>
                <span className="text-sm font-bold text-stone-900 mt-1 block">
                  {advisory.weather_triggers?.leaf_wetness_hours || "Prolonged dew or mist"}
                </span>
              </div>
            </div>
          )}

          {/* AI Insights Tab */}
          {activeTab === "ai" && advisory.ai_insights && (
            <div className="rounded-2xl bg-indigo-50/70 p-5 border border-indigo-200 text-stone-800">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-indigo-700" />
                <h4 className="text-base font-bold text-indigo-950">KVK Agronomist Action Plan</h4>
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-line">
                {advisory.ai_insights}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions: WhatsApp Prescription Slip & Save & Reset */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-6 bg-stone-50 border-t border-stone-200">
          <button
            type="button"
            onClick={shareViaWhatsApp}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            <span>{t.shareWhatsApp}</span>
          </button>

          <div className="flex w-full sm:w-auto items-center gap-2.5">
            <button
              type="button"
              onClick={handleSaveToDevice}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-xs font-bold transition border ${
                isSaved 
                  ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                  : "bg-white text-stone-800 border-stone-300 hover:bg-stone-50"
              }`}
            >
              {isSaved ? <Check className="w-4 h-4 text-emerald-700" /> : <BookmarkPlus className="w-4 h-4" />}
              <span>{isSaved ? t.savedLocally : t.saveDiagnosis}</span>
            </button>

            <button
              type="button"
              onClick={onReset}
              className="flex-1 sm:flex-initial rounded-2xl bg-stone-900 px-5 py-3.5 text-xs font-bold text-white hover:bg-stone-800 transition active:scale-95"
            >
              {t.retakePhoto}
            </button>
          </div>
        </div>
      </div>

      {/* Differential Candidates for low confidence */}
      {top_candidates && top_candidates.length > 1 && (
        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-xs">
          <h4 className="text-sm font-bold text-stone-900 mb-3">
            {t.topCandidates}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {top_candidates.slice(1).map((cand, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-xs font-medium text-stone-800">{cand.display_name}</span>
                <span className="text-xs font-bold font-mono text-stone-500">{cand.confidence_score}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
