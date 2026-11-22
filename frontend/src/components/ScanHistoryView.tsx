"use client";

import React, { useState } from "react";
import { Clock, Trash2, ChevronRight, Sprout, Cloud } from "lucide-react";
import { SavedScan, Language } from "@/types";
import { translations } from "@/lib/i18n";
import { getSavedScans, deleteSavedScan, clearAllSavedScans } from "@/lib/storage";

interface ScanHistoryViewProps {
  lang: Language;
  onSelectScan: (scan: SavedScan) => void;
  onScansUpdated: () => void;
  onNavigateToAccount?: () => void;
}

export function ScanHistoryView({ lang, onSelectScan, onScansUpdated, onNavigateToAccount }: ScanHistoryViewProps) {
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
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <Clock className="h-4.5 w-4.5 text-stone-600" />
          <h3 className="text-base font-bold text-stone-900 sm:text-lg">
            {t.scanHistory} ({scans.length})
          </h3>
        </div>

        {scans.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 hover:border-rose-200 active:scale-95 shadow-2xs transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{t.clearHistory}</span>
          </button>
        )}
      </div>

      {onNavigateToAccount && (
        <div
          onClick={onNavigateToAccount}
          className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 cursor-pointer hover:bg-emerald-100/70 transition-all active:scale-[0.99] shadow-2xs"
        >
          <div className="flex items-center gap-2.5">
            <Cloud className="h-4.5 w-4.5 text-emerald-700 shrink-0" />
            <p className="text-xs font-medium text-emerald-950">
              {t.cloudBackupBanner}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-emerald-700 shrink-0" />
        </div>
      )}

      {scans.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-stone-300 bg-white p-10 text-center shadow-xs">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-500 mb-3">
            <Sprout className="h-7 w-7" />
          </div>
          <p className="text-sm font-semibold text-stone-800">{t.noSavedScans}</p>
          <p className="text-xs text-stone-500 mt-1 max-w-xs">
            Leaf diagnostic records saved on this device will be stored here and remain accessible in rural fields without internet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {scans.map((scan) => (
            <div
              key={scan.id}
              onClick={() => onSelectScan(scan)}
              className="group flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-3.5 shadow-xs transition-all hover:border-stone-300 hover:shadow-sm active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={scan.imageThumbnail}
                    alt={scan.diagnosis.display_name}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider">
                      {scan.diagnosis.crop}
                    </span>
                    <span className="text-[10px] text-stone-300">•</span>
                    <span className="text-[10px] text-stone-500">
                      {formatDate(scan.timestamp)}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-stone-900 line-clamp-1">
                    {scan.diagnosis.condition}
                  </p>

                  <p className="text-[11px] text-stone-500">
                    Severity: <span className="font-semibold text-stone-800">{scan.severity}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, scan.id)}
                  className="rounded-lg p-2 text-stone-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                  aria-label="Delete scan"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <ChevronRight className="h-4 w-4 text-stone-400 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
