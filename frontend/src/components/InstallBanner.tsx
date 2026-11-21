"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";
import { Language } from "@/types";
import { translations } from "@/lib/i18n";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallBannerProps {
  lang: Language;
}

export function InstallBanner({ lang }: InstallBannerProps) {
  const t = translations[lang];
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    return typeof window !== "undefined" ? sessionStorage.getItem("cropdoc_install_dismissed") === "true" : false;
  });

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    sessionStorage.setItem("cropdoc_install_dismissed", "true");
  };

  if (!isVisible || isDismissed) return null;

  return (
    <aside aria-label="Install App" className="w-full rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 p-4 shadow-xl mb-5 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-white sm:text-sm">
              {t.installApp}
            </p>
            <p className="text-[11px] text-emerald-300/80">
              Works offline in fields with instant camera capture and zero lag.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleInstall}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500 px-3.5 py-1.5 text-xs font-bold text-emerald-950 shadow-md shadow-emerald-500/20 hover:brightness-110 active:scale-95"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Install</span>
          </button>
          <button
            onClick={handleDismiss}
            className="rounded-lg p-1.5 text-emerald-400/60 hover:text-emerald-200"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
