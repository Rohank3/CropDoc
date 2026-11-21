"use client";

import React, { useState, useEffect } from "react";
import { 
  CloudSun, Droplets, Wind, CloudRain, Thermometer, 
  MapPin, Search, AlertTriangle, CheckCircle2, ShieldAlert,
  Loader2
} from "lucide-react";
import { WeatherData, Language } from "@/types";
import { translations } from "@/lib/i18n";
import { fetchAgroWeather } from "@/lib/api";

interface WeatherCardProps {
  lang: Language;
  initialData?: WeatherData | null;
}

export function WeatherCard({ lang, initialData }: WeatherCardProps) {
  const t = translations[lang];
  const [weatherData, setWeatherData] = useState<WeatherData | null>(initialData || null);
  const [loading, setLoading] = useState<boolean>(!initialData);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cityInput, setCityInput] = useState<string>("");
  const [activeLocationName, setActiveLocationName] = useState<string>(
    initialData?.location.name ? `${initialData.location.name}, ${initialData.location.country}` : "Farm Location"
  );

  const loadWeatherByCoords = (lat: number, lon: number) => {
    setLoading(true);
    setErrorMsg(null);
    fetchAgroWeather({ lat, lon })
      .then((data) => {
        setWeatherData(data);
        setActiveLocationName(data.location.name ? `${data.location.name}, ${data.location.country}` : "Farm Location");
      })
      .catch((err) => {
        setErrorMsg(err.message);
      })
      .finally(() => setLoading(false));
  };

  const loadWeatherByCity = (city: string) => {
    if (!city.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    fetchAgroWeather({ city: city.trim() })
      .then((data) => {
        setWeatherData(data);
        setActiveLocationName(`${data.location.name}, ${data.location.country}`);
      })
      .catch((err) => {
        setErrorMsg(err.message);
      })
      .finally(() => setLoading(false));
  };

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        loadWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setErrorMsg(t.locationDenied);
        setLoading(false);
      },
      { timeout: 8000 }
    );
  };

  useEffect(() => {
    if (initialData) return;

    let isMounted = true;
    const fetchDefault = async () => {
      try {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              if (isMounted) loadWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
            },
            () => {
              if (isMounted) loadWeatherByCity("New Delhi");
            },
            { timeout: 5000 }
          );
        } else {
          if (isMounted) loadWeatherByCity("New Delhi");
        }
      } catch {
        if (isMounted) loadWeatherByCity("New Delhi");
      }
    };

    fetchDefault();
    return () => {
      isMounted = false;
    };
  }, [initialData]);

  const getFungalBadge = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "critical":
      case "high":
        return {
          bg: "bg-red-500/20 text-red-300 ring-red-500/30",
          icon: ShieldAlert
        };
      case "moderate":
        return {
          bg: "bg-amber-500/20 text-amber-300 ring-amber-500/30",
          icon: AlertTriangle
        };
      default:
        return {
          bg: "bg-emerald-500/20 text-emerald-300 ring-emerald-500/30",
          icon: CheckCircle2
        };
    }
  };

  return (
    <div className="w-full space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Search & Location Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadWeatherByCity(cityInput);
          }}
          className="flex w-full sm:max-w-md items-center gap-2 rounded-2xl border border-emerald-700/60 bg-emerald-950/80 p-1.5 shadow-lg"
        >
          <div className="flex flex-1 items-center gap-2 px-3 text-emerald-300">
            <Search className="h-4 w-4 opacity-70" />
            <input
              type="text"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              placeholder={t.searchCity}
              className="w-full bg-transparent text-xs text-white placeholder-emerald-400/50 focus:outline-none sm:text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-emerald-950 shadow transition-transform hover:brightness-110 active:scale-95 disabled:opacity-50"
          >
            {t.searchBtn}
          </button>
        </form>

        <button
          onClick={handleUseGps}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-700/60 bg-emerald-900/40 px-4 py-2.5 text-xs font-semibold text-emerald-200 transition-all hover:bg-emerald-800/60 active:scale-95 disabled:opacity-50"
        >
          <MapPin className="h-4 w-4 text-emerald-400" />
          <span>{t.useMyLocation}</span>
        </button>
      </div>

      {/* Error Notice */}
      {errorMsg && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-500/40 bg-amber-950/40 p-4 text-xs text-amber-200 sm:text-sm">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-400" />
          <div className="space-y-0.5">
            <p className="font-semibold text-amber-300">Weather Telemetry Notice:</p>
            <p>{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="flex h-64 w-full flex-col items-center justify-center gap-3 rounded-3xl border border-emerald-800/60 bg-emerald-950/80 p-8 shadow-xl">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          <p className="text-sm font-medium text-emerald-200">{t.fetchingWeather}</p>
        </div>
      )}

      {/* Weather Dashboard Card */}
      {!loading && weatherData && (
        <div className="space-y-4">
          {/* Main Weather Metric Box */}
          <div className="relative overflow-hidden rounded-3xl border border-emerald-700/60 bg-gradient-to-br from-emerald-950/90 via-emerald-900/60 to-emerald-950/90 p-5 sm:p-7 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs text-emerald-300">
                  <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="font-semibold">{activeLocationName}</span>
                </div>

                <div className="mt-2 flex items-baseline gap-3">
                  <span className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                    {Math.round(weatherData.weather.temperature_c)}°C
                  </span>
                  <span className="text-sm text-emerald-200/80">
                    Feels like {Math.round(weatherData.weather.feels_like_c)}°C
                  </span>
                </div>

                <p className="mt-1 text-sm font-semibold capitalize text-emerald-300">
                  {weatherData.weather.description}
                </p>
              </div>

              {/* Weather Graphic / Icon */}
              <div className="flex items-center gap-3">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/30">
                  <CloudSun className="h-10 w-10 text-emerald-400" />
                </div>
              </div>
            </div>

            {/* Quick Meteorological Grid */}
            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-emerald-800/50 pt-5 sm:grid-cols-4">
              <div className="rounded-2xl border border-emerald-800/60 bg-emerald-900/30 p-3 text-center">
                <Droplets className="mx-auto h-4 w-4 text-emerald-400 mb-1" />
                <span className="text-[11px] text-emerald-300/70 uppercase block">{t.humidity}</span>
                <span className="text-base font-bold text-white">{weatherData.weather.humidity_percent}%</span>
              </div>

              <div className="rounded-2xl border border-emerald-800/60 bg-emerald-900/30 p-3 text-center">
                <Wind className="mx-auto h-4 w-4 text-emerald-400 mb-1" />
                <span className="text-[11px] text-emerald-300/70 uppercase block">{t.windSpeed}</span>
                <span className="text-base font-bold text-white">{weatherData.weather.wind_speed_kmh} km/h</span>
              </div>

              <div className="rounded-2xl border border-emerald-800/60 bg-emerald-900/30 p-3 text-center">
                <CloudRain className="mx-auto h-4 w-4 text-emerald-400 mb-1" />
                <span className="text-[11px] text-emerald-300/70 uppercase block">{t.rainfall}</span>
                <span className="text-base font-bold text-white">{weatherData.weather.rain_1h_mm} mm</span>
              </div>

              <div className="rounded-2xl border border-emerald-800/60 bg-emerald-900/30 p-3 text-center">
                <Thermometer className="mx-auto h-4 w-4 text-emerald-400 mb-1" />
                <span className="text-[11px] text-emerald-300/70 uppercase block">Min / Max</span>
                <span className="text-sm font-bold text-white">
                  {Math.round(weatherData.weather.temp_min_c)}° / {Math.round(weatherData.weather.temp_max_c)}°
                </span>
              </div>
            </div>
          </div>

          {/* Agro-Risk & Spraying Advisory Banner */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Spraying Window Box */}
            <div className={`overflow-hidden rounded-3xl border p-5 shadow-xl ${
              weatherData.agro_advisory.is_spraying_favorable
                ? "border-emerald-600/60 bg-emerald-950/80"
                : "border-amber-600/60 bg-amber-950/40"
            }`}>
              <div className="flex items-center gap-2.5">
                {weatherData.agro_advisory.is_spraying_favorable ? (
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-white">{t.sprayingWindow}</h4>
                  <span className={`text-xs font-semibold ${
                    weatherData.agro_advisory.is_spraying_favorable ? "text-emerald-400" : "text-amber-400"
                  }`}>
                    {weatherData.agro_advisory.is_spraying_favorable ? t.safeToSpray : t.dangerToSpray}
                  </span>
                </div>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-emerald-100/90 sm:text-sm">
                {weatherData.agro_advisory.spraying_advisory}
              </p>
            </div>

            {/* Fungal Outbreak Risk Box */}
            <div className="overflow-hidden rounded-3xl border border-emerald-700/60 bg-emerald-950/80 p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-emerald-400" />
                  <h4 className="text-sm font-bold text-white">{t.weatherRisk}</h4>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${
                  getFungalBadge(weatherData.agro_advisory.fungal_outbreak_risk).bg
                }`}>
                  {weatherData.agro_advisory.fungal_outbreak_risk}
                </span>
              </div>

              <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-emerald-200/80">
                {weatherData.agro_advisory.risk_factors.map((factor, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
