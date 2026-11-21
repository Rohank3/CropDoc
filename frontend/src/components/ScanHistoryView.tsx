"use client";

import React, { useState } from "react";
import { Clock, Trash2, ChevronRight, Sprout } from "lucide-react";
import { SavedScan, Language } from "@/types";
import { translations } from "@/lib/i18n";
import { getSavedScans, deleteSavedScan, clearAllSavedScans } from "@/lib/storage";

interface ScanHistoryViewProps {
  lang: Language;
  onSelectScan: (scan: SavedScan) => void;
  onScansUpdated: () => void;
}

export function ScanHistoryView({ lang, onSelectScan, onScansUpdated }: ScanHistoryViewProps) {
  const t = translations[lang];
  const [scans, setScans] = useState<SavedScan[]>(() => {
    return typeof window !== "undefined" ? getSavedScans() : [];
  });

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = deleteSavedScan(id);
    setScans(updated);
    onScansUpdated();
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear all offline scan history?")) {
      clearAllSavedScans();
      setScans([]);
      onScansUpdated();
    }
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString(lang === "hi" ? "hi-IN" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between pb-2 border-b border-emerald-800/60">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-emerald-400" />
          <h3 className="text-base font-bold text-white sm:text-lg">
            {t.scanHistory} ({scans.length})
          </h3>
        </div>

        {scans.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/20 active:scale-95"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{t.clearHistory}</span>
          </button>
        )}
      </div>

      {scans.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-emerald-800/80 bg-emerald-950/40 p-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30 mb-3">
            <Sprout className="h-8 w-8" />
          </div>
          <p className="text-sm font-semibold text-emerald-200">{t.noSavedScans}</p>
          <p className="text-xs text-emerald-400/60 mt-1 max-w-xs">
            Leaf diagnostic prescriptions saved on this device will appear here and can be referenced offline in fields.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {scans.map((scan) => (
            <div
              key={scan.id}
              onClick={() => onSelectScan(scan)}
              className="group flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-emerald-800/60 bg-emerald-950/70 p-3.5 shadow-md transition-all hover:border-emerald-500/80 hover:bg-emerald-900/50 active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border border-emerald-700/50 bg-black/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={scan.imageThumbnail}
                    alt={scan.diagnosis.display_name}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      {scan.diagnosis.crop}
                    </span>
                    <span className="text-[10px] text-emerald-400/60">•</span>
                    <span className="text-[10px] text-emerald-300/60">
                      {formatDate(scan.timestamp)}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-white line-clamp-1">
                    {scan.diagnosis.condition}
                  </p>

                  <p className="text-[11px] text-emerald-300/80">
                    Severity: <span className="font-semibold text-white">{scan.severity}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, scan.id)}
                  className="rounded-lg p-2 text-emerald-400/60 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                  aria-label="Delete scan"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <ChevronRight className="h-4 w-4 text-emerald-400 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
