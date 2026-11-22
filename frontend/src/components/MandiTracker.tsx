"use client";

import React, { useState, useEffect } from "react";
import { 
  TrendingUp, TrendingDown, Minus, MapPin, 
  Store, Scale, ArrowUpDown, Filter, Loader2, 
  Search, ShieldAlert
} from "lucide-react";
import { Language, MandiPriceRecord, MandiMetaResponse } from "@/types";
import { translations } from "@/lib/i18n";
import { fetchMandiMetadata, fetchMandiPrices } from "@/lib/api";

interface MandiTrackerProps {
  lang: Language;
}

export function MandiTracker({ lang }: MandiTrackerProps) {
  const t = translations[lang];

  const [metadata, setMetadata] = useState<MandiMetaResponse | null>(null);
  const [selectedState, setSelectedState] = useState<string>("All");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("All");
  const [selectedCrop, setSelectedCrop] = useState<string>("All");

  const [prices, setPrices] = useState<MandiPriceRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load Metadata (States, Districts, Crops)
  useEffect(() => {
    async function loadMeta() {
      try {
        const meta = await fetchMandiMetadata();
        setMetadata(meta);
      } catch (err: any) {
        console.warn("Failed loading Mandi metadata:", err);
      }
    }
    loadMeta();
  }, []);

  // Fetch prices on filter changes
  useEffect(() => {
    async function loadPrices() {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const data = await fetchMandiPrices({
          state: selectedState,
          district: selectedDistrict,
          crop: selectedCrop
        });
        setPrices(data.prices || []);
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to retrieve Mandi prices");
      } finally {
        setIsLoading(false);
      }
    }
    loadPrices();
  }, [selectedState, selectedDistrict, selectedCrop]);

  // Handle State Change -> Reset District
  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setSelectedDistrict("All");
  };

  const availableDistricts = selectedState !== "All" && metadata?.districts_by_state[selectedState]
    ? metadata.districts_by_state[selectedState]
    : [];

  return (
    <div className="w-full space-y-6">
      {/* Header Banner */}
      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-200">
              <Store className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                {t.mandiHeading}
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
                {t.mandiSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-900">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
            <span>APMC Live Session</span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5">
          {/* State Selector */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              {t.selectState}
            </label>
            <select
              value={selectedState}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm font-medium text-stone-800 shadow-2xs focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value="All">{lang === "hi" ? "सभी राज्य (All States)" : "All States"}</option>
              {metadata?.states.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* District Selector */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              {t.selectDistrict}
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={selectedState === "All"}
              className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm font-medium text-stone-800 shadow-2xs focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 disabled:opacity-50 disabled:bg-stone-50"
            >
              <option value="All">{lang === "hi" ? "सभी ज़िले (All Districts)" : "All Districts"}</option>
              {availableDistricts.map((dst) => (
                <option key={dst} value={dst}>
                  {dst}
                </option>
              ))}
            </select>
          </div>

          {/* Crop Selector */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              {t.selectCrop}
            </label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm font-medium text-stone-800 shadow-2xs focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value="All">{lang === "hi" ? "सभी फसलें (All Crops)" : "All Crops"}</option>
              {metadata?.crops.map((cr) => (
                <option key={cr} value={cr}>
                  {cr}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 rounded-3xl bg-white border border-stone-200">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-700 mb-2" />
          <p className="text-sm font-bold text-stone-700">Loading APMC Mandi rates...</p>
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && !isLoading && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Mandi Cards List */}
      {!isLoading && !errorMsg && prices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prices.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-3xl border border-stone-200 bg-white p-5 shadow-xs hover:border-emerald-400 transition-all hover:shadow-md"
            >
              {/* Card Header: Crop & Market */}
              <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-3.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-900">
                      {lang === "hi" ? item.crop_hi : item.crop}
                    </span>
                    <span className="text-xs text-stone-500 font-medium">
                      {item.variety}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-stone-900 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>{item.market}</span>
                  </h3>
                  <p className="text-xs text-stone-500 ml-5">
                    {lang === "hi" ? `${item.district_hi}, ${item.state_hi}` : `${item.district}, ${item.state}`}
                  </p>
                </div>

                {/* Trend Badge */}
                <div className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 ${
                  item.trend === "up" 
                    ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                    : item.trend === "down"
                    ? "bg-rose-100 text-rose-900 border border-rose-300"
                    : "bg-slate-100 text-slate-800 border border-slate-300"
                }`}>
                  {item.trend === "up" ? (
                    <>
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                      <span>+{item.trend_pct}%</span>
                    </>
                  ) : item.trend === "down" ? (
                    <>
                      <TrendingDown className="w-3.5 h-3.5 text-rose-700" />
                      <span>{item.trend_pct}%</span>
                    </>
                  ) : (
                    <>
                      <Minus className="w-3.5 h-3.5 text-slate-600" />
                      <span>{t.allOption}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Price Hero Section */}
              <div className="py-4 flex items-baseline justify-between border-b border-stone-100">
                <div>
                  <span className="text-xs text-stone-500 font-medium block">
                    {t.modalPrice}
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                      ₹{item.modal_price.toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs text-stone-500 font-medium">
                      / {item.price_unit.split("/")[1] || "Qtl"}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-stone-500 font-medium block">
                    {t.priceRange}
                  </span>
                  <span className="text-sm font-bold text-stone-800 mt-0.5 block">
                    ₹{item.min_price} - ₹{item.max_price}
                  </span>
                </div>
              </div>

              {/* Secondary Details: Arrivals & MSP */}
              <div className="pt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  <span className="text-stone-500 block">{t.arrivals}</span>
                  <strong className="text-stone-800 font-bold mt-0.5 block">
                    {item.arrival_tonnes} Tonnes
                  </strong>
                </div>

                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  <span className="text-stone-500 block">Govt MSP Rate</span>
                  <strong className="text-stone-800 font-bold mt-0.5 block">
                    {item.msp_benchmark ? `₹${item.msp_benchmark} / Qtl` : "Open Market"}
                  </strong>
                </div>
              </div>

              {/* Nearby Mandis comparison tags */}
              {item.nearby_mandis && item.nearby_mandis.length > 0 && (
                <div className="mt-3 pt-3 border-t border-stone-100">
                  <span className="text-[11px] font-bold text-stone-500 block mb-1.5">
                    {t.nearbyMandis}:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {item.nearby_mandis.map((nb, i) => (
                      <span
                        key={i}
                        className="rounded-lg bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-700 border border-stone-200 flex items-center gap-1"
                      >
                        <span>{nb.market}:</span>
                        <strong className="text-emerald-800">₹{nb.modal_price}</strong>
                        <span className="text-stone-400">({nb.distance_km}km)</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !errorMsg && prices.length === 0 && (
        <div className="p-12 text-center rounded-3xl bg-white border border-stone-200">
          <Search className="w-10 h-10 text-stone-300 mx-auto mb-2" />
          <p className="text-base font-bold text-stone-800">{t.noMandiResults}</p>
          <p className="text-xs text-stone-500 mt-1">Try selecting &apos;All&apos; states or a different crop filter.</p>
        </div>
      )}
    </div>
  );
}
