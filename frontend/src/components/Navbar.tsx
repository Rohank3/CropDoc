"use client";

import React, { useState, useEffect } from "react";
import { Leaf, Download, Globe, Clock, CloudSun, Shield, Store, User } from "lucide-react";
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
  activeTab: "scan" | "mandi" | "weather" | "history" | "account";
  onTabChange: (tab: "scan" | "mandi" | "weather" | "history" | "account") => void;
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
    <header className="sticky top-0 z-40 w-full border-b border-stone-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <div 
          onClick={() => onTabChange("scan")}
          className="group flex cursor-pointer items-center gap-2.5 transition-transform active:scale-[0.98]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-800 text-white shadow-sm">
            <Leaf className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold tracking-tight text-stone-900 sm:text-lg">
                {t.appName}
              </span>
              <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
                भारत KISAN
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
          <div className="hidden items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs text-stone-600 md:flex">
            <span
              className={`h-2 w-2 rounded-full ${
                backendStatus.online ? "bg-emerald-600 animate-pulse" : "bg-amber-500"
              }`}
            />
            <span className="text-[11px] font-medium text-stone-700">
              {backendStatus.online ? backendStatus.device : "Offline"}
            </span>
          </div>

          {/* Language Toggle */}
          <button
            type="button"
            onClick={() => onLanguageChange(lang === "en" ? "hi" : "en")}
            className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-bold text-stone-800 transition-colors hover:bg-stone-50 hover:border-stone-300 active:scale-95 shadow-2xs"
            aria-label="Toggle Language"
          >
            <Globe className="h-3.5 w-3.5 text-stone-500" />
            <span>{lang === "en" ? "हिन्दी" : "English"}</span>
          </button>

          {/* PWA Install Button */}
          {isInstallable && (
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-800 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-900 active:scale-95"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.installApp}</span>
            </button>
          )}
        </div>
      </div>

      {/* Segmented Navigation Tabs */}
      <nav className="flex border-t border-stone-100 bg-stone-50/70 px-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-5xl justify-around sm:justify-start sm:gap-6 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => onTabChange("scan")}
            className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs font-bold whitespace-nowrap transition-colors sm:text-sm ${
              activeTab === "scan"
                ? "border-emerald-800 text-emerald-900"
                : "border-transparent text-stone-600 hover:text-stone-900"
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>{t.scanCrop}</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange("mandi")}
            className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs font-bold whitespace-nowrap transition-colors sm:text-sm ${
              activeTab === "mandi"
                ? "border-emerald-800 text-emerald-900"
                : "border-transparent text-stone-600 hover:text-stone-900"
            }`}
          >
            <Store className="h-4 w-4" />
            <span>{t.mandiTab}</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange("weather")}
            className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs font-bold whitespace-nowrap transition-colors sm:text-sm ${
              activeTab === "weather"
                ? "border-emerald-800 text-emerald-900"
                : "border-transparent text-stone-600 hover:text-stone-900"
            }`}
          >
            <CloudSun className="h-4 w-4" />
            <span>{t.weatherAdvisory}</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange("history")}
            className={`relative flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs font-bold whitespace-nowrap transition-colors sm:text-sm ${
              activeTab === "history"
                ? "border-emerald-800 text-emerald-900"
                : "border-transparent text-stone-600 hover:text-stone-900"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>{t.scanHistory}</span>
            {savedScansCount > 0 && (
              <span className="ml-1 rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-900 border border-emerald-200">
                {savedScansCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onTabChange("account")}
            className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs font-bold whitespace-nowrap transition-colors sm:text-sm ${
              activeTab === "account"
                ? "border-emerald-800 text-emerald-900"
                : "border-transparent text-stone-600 hover:text-stone-900"
            }`}
          >
            <User className="h-4 w-4" />
            <span>{t.accountTab}</span>
          </button>
        </div>
      </nav>
    </header>
  );
}
