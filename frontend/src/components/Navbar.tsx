"use client";

import React, { useState, useEffect } from "react";
import { Leaf, Download, Globe, Clock, CloudSun, ShieldCheck, Cpu } from "lucide-react";
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
  }>({ online: false, cuda: false, device: "Checking..." });

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
    <header className="sticky top-0 z-40 w-full border-b border-emerald-900/40 bg-emerald-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <div 
          onClick={() => onTabChange("scan")}
          className="group flex cursor-pointer items-center gap-2.5 transition-transform active:scale-95"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-400/30">
            <Leaf className="h-5 w-5 text-emerald-950 transition-transform group-hover:rotate-12" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight text-white">
                {t.appName}
              </span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-emerald-300 uppercase ring-1 ring-emerald-500/30">
                PWA
              </span>
            </div>
            <p className="hidden text-xs text-emerald-300/80 sm:block">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Backend Hardware Pill */}
          <div className="hidden items-center gap-1.5 rounded-lg border border-emerald-800/60 bg-emerald-900/40 px-2.5 py-1 text-xs text-emerald-200 md:flex">
            <div
              className={`h-2 w-2 rounded-full ${
                backendStatus.online ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
            <Cpu className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-mono text-[11px]">
              {backendStatus.online ? backendStatus.device : "API Offline"}
            </span>
          </div>

          {/* Language Toggle */}
          <button
            onClick={() => onLanguageChange(lang === "en" ? "hi" : "en")}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-700/50 bg-emerald-900/60 px-2.5 py-1.5 text-xs font-semibold text-emerald-100 transition-all hover:border-emerald-500 hover:bg-emerald-800 focus-visible:ring-2 focus-visible:ring-emerald-400 active:scale-95"
            aria-label="Toggle Language"
          >
            <Globe className="h-3.5 w-3.5 text-emerald-400" />
            <span>{lang === "en" ? "हिन्दी" : "English"}</span>
          </button>

          {/* PWA Install Trigger */}
          {isInstallable && (
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-500/20 transition-all hover:brightness-110 active:scale-95"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.installApp}</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile-First Tab Bar */}
      <nav className="flex border-t border-emerald-900/30 bg-emerald-950/70 px-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-5xl justify-around sm:justify-start sm:gap-6">
          <button
            onClick={() => onTabChange("scan")}
            className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-xs font-medium transition-all sm:text-sm ${
              activeTab === "scan"
                ? "border-emerald-400 text-emerald-300 font-semibold"
                : "border-transparent text-emerald-200/60 hover:text-emerald-100"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>{t.scanCrop}</span>
          </button>

          <button
            onClick={() => onTabChange("weather")}
            className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-xs font-medium transition-all sm:text-sm ${
              activeTab === "weather"
                ? "border-emerald-400 text-emerald-300 font-semibold"
                : "border-transparent text-emerald-200/60 hover:text-emerald-100"
            }`}
          >
            <CloudSun className="h-4 w-4" />
            <span>{t.weatherAdvisory}</span>
          </button>

          <button
            onClick={() => onTabChange("history")}
            className={`relative flex items-center gap-2 border-b-2 px-3 py-2.5 text-xs font-medium transition-all sm:text-sm ${
              activeTab === "history"
                ? "border-emerald-400 text-emerald-300 font-semibold"
                : "border-transparent text-emerald-200/60 hover:text-emerald-100"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>{t.scanHistory}</span>
            {savedScansCount > 0 && (
              <span className="ml-1 rounded-full bg-emerald-500/30 px-1.5 py-0.2 text-[10px] font-bold text-emerald-200 ring-1 ring-emerald-500/40">
                {savedScansCount}
              </span>
            )}
          </button>
        </div>
      </nav>
    </header>
  );
}
