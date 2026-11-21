"use client";

import React, { useState, useEffect } from "react";
import { Leaf, Download, Globe, Clock, CloudSun, Shield } from "lucide-react";
import { Language } from "@/types";
import { translations } from "@/lib/i18n";
import { checkBackendHealth } from "@/lib/api";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface NavbarProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  activeTab: "scan" | "weather" | "history";
  onTabChange: (tab: "scan" | "weather" | "history") => void;
  savedScansCount: number;
}

export function Navbar({
  lang,
  onLanguageChange,
  activeTab,
  onTabChange,
  savedScansCount
}: NavbarProps) {
  const t = translations[lang];
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [backendStatus, setBackendStatus] = useState<{
    online: boolean;
    cuda: boolean;
    device: string;
  }>({ online: false, cuda: false, device: "Connecting..." });

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.log("SW registration notice:", err));
    }

    checkBackendHealth()
      .then((health) => {
        setBackendStatus({
          online: true,
          cuda: health.cuda_available,
          device: health.device_name
        });
      })
      .catch(() => {
        setBackendStatus({
          online: false,
          cuda: false,
          device: "Offline"
        });
      });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <div 
          onClick={() => onTabChange("scan")}
          className="group flex cursor-pointer items-center gap-2.5 transition-transform active:scale-[0.98]"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-800 text-white shadow-xs">
            <Leaf className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-stone-900 sm:text-lg">
                {t.appName}
              </span>
              <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold text-stone-600 uppercase">
                PWA
              </span>
            </div>
            <p className="hidden text-xs text-stone-500 sm:block">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Subtle System Status Pill */}
          <div className="hidden items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs text-stone-600 md:flex">
            <span
              className={`h-2 w-2 rounded-full ${
                backendStatus.online ? "bg-emerald-600" : "bg-amber-500"
              }`}
            />
            <span className="text-[11px] font-medium text-stone-700">
              {backendStatus.online ? backendStatus.device : "Offline"}
            </span>
          </div>

          {/* Language Toggle */}
          <button
            onClick={() => onLanguageChange(lang === "en" ? "hi" : "en")}
            className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-50 hover:border-stone-300 active:scale-95 shadow-2xs"
            aria-label="Toggle Language"
          >
            <Globe className="h-3.5 w-3.5 text-stone-500" />
            <span>{lang === "en" ? "हिन्दी" : "English"}</span>
          </button>

          {/* PWA Install Button */}
          {isInstallable && (
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-emerald-900 active:scale-95"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.installApp}</span>
            </button>
          )}
        </div>
      </div>

      {/* Modern Clean Segmented Navigation Tabs */}
      <nav className="flex border-t border-stone-100 bg-stone-50/60 px-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-5xl justify-around sm:justify-start sm:gap-6">
          <button
            onClick={() => onTabChange("scan")}
            className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors sm:text-sm ${
              activeTab === "scan"
                ? "border-emerald-800 text-emerald-900 font-semibold"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>{t.scanCrop}</span>
          </button>

          <button
            onClick={() => onTabChange("weather")}
            className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors sm:text-sm ${
              activeTab === "weather"
                ? "border-emerald-800 text-emerald-900 font-semibold"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <CloudSun className="h-4 w-4" />
            <span>{t.weatherAdvisory}</span>
          </button>

          <button
            onClick={() => onTabChange("history")}
            className={`relative flex items-center gap-2 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors sm:text-sm ${
              activeTab === "history"
                ? "border-emerald-800 text-emerald-900 font-semibold"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>{t.scanHistory}</span>
            {savedScansCount > 0 && (
              <span className="ml-1 rounded-full bg-stone-200 px-1.5 py-0.2 text-[10px] font-bold text-stone-700">
                {savedScansCount}
              </span>
            )}
          </button>
        </div>
      </nav>
    </header>
  );
}
