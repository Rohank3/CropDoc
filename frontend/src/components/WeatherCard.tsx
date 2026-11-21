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
          bg: "bg-rose-50 text-rose-800 ring-1 ring-rose-600/20",
          icon: ShieldAlert
        };
      case "moderate":
        return {
          bg: "bg-amber-50 text-amber-800 ring-1 ring-amber-600/20",
          icon: AlertTriangle
        };
      default:
        return {
          bg: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/20",
          icon: CheckCircle2
        };
    }
  };

  return (
    <div className="w-full space-y-5">
      {/* Search & Location Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadWeatherByCity(cityInput);
          }}
          className="flex w-full sm:max-w-md items-center gap-2 rounded-2xl border border-stone-200 bg-white p-1.5 shadow-xs"
        >
          <div className="flex flex-1 items-center gap-2 px-3 text-stone-600">
            <Search className="h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              placeholder={t.searchCity}
              className="w-full bg-transparent text-xs text-stone-900 placeholder-stone-400 focus:outline-none sm:text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-emerald-800 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-900 transition-colors disabled:opacity-50 active:scale-95"
          >
            {t.searchBtn}
          </button>
        </form>

        <button
          onClick={handleUseGps}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-50 active:scale-95 disabled:opacity-50 shadow-2xs"
        >
          <MapPin className="h-4 w-4 text-emerald-800" />
          <span>{t.useMyLocation}</span>
        </button>
      </div>

      {/* Error Notice */}
      {errorMsg && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 sm:text-sm">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-700" />
          <div className="space-y-0.5">
            <p className="font-semibold text-amber-950">Weather Telemetry Notice:</p>
            <p>{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="flex h-64 w-full flex-col items-center justify-center gap-3 rounded-3xl border border-stone-200 bg-white p-8 shadow-xs">
          <Loader2 className="h-7 w-7 animate-spin text-emerald-800" />
          <p className="text-sm font-medium text-stone-600">{t.fetchingWeather}</p>
        </div>
      )}

      {/* Weather Dashboard Card */}
      {!loading && weatherData && (
        <div className="space-y-4">
          {/* Main Weather Card */}
          <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white p-5 sm:p-7 shadow-sm">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
                  <MapPin className="h-3.5 w-3.5 text-emerald-800" />
                  <span>{activeLocationName}</span>
                </div>

                <div className="mt-2 flex items-baseline gap-3">
                  <span className="text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl">
                    {Math.round(weatherData.weather.temperature_c)}°C
                  </span>
                  <span className="text-sm text-stone-500 font-medium">
                    Feels like {Math.round(weatherData.weather.feels_like_c)}°C
                  </span>
                </div>

                <p className="mt-1 text-sm font-semibold capitalize text-emerald-800">
                  {weatherData.weather.description}
                </p>
              </div>

              {/* Weather Graphic / Icon */}
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 text-stone-700">
                  <CloudSun className="h-8 w-8 text-emerald-800" />
                </div>
              </div>
            </div>

            {/* Meteorological Grid */}
            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-stone-100 pt-5 sm:grid-cols-4">
              <div className="rounded-2xl border border-stone-100 bg-stone-50/80 p-3 text-center">
                <Droplets className="mx-auto h-4 w-4 text-emerald-800 mb-1" />
                <span className="text-[11px] text-stone-500 uppercase block font-semibold">{t.humidity}</span>
                <span className="text-base font-bold text-stone-900">{weatherData.weather.humidity_percent}%</span>
              </div>

              <div className="rounded-2xl border border-stone-100 bg-stone-50/80 p-3 text-center">
                <Wind className="mx-auto h-4 w-4 text-emerald-800 mb-1" />
                <span className="text-[11px] text-stone-500 uppercase block font-semibold">{t.windSpeed}</span>
                <span className="text-base font-bold text-stone-900">{weatherData.weather.wind_speed_kmh} km/h</span>
              </div>

              <div className="rounded-2xl border border-stone-100 bg-stone-50/80 p-3 text-center">
                <CloudRain className="mx-auto h-4 w-4 text-emerald-800 mb-1" />
                <span className="text-[11px] text-stone-500 uppercase block font-semibold">{t.rainfall}</span>
                <span className="text-base font-bold text-stone-900">{weatherData.weather.rain_1h_mm} mm</span>
              </div>

              <div className="rounded-2xl border border-stone-100 bg-stone-50/80 p-3 text-center">
                <Thermometer className="mx-auto h-4 w-4 text-emerald-800 mb-1" />
                <span className="text-[11px] text-stone-500 uppercase block font-semibold">Min / Max</span>
                <span className="text-sm font-bold text-stone-900">
                  {Math.round(weatherData.weather.temp_min_c)}° / {Math.round(weatherData.weather.temp_max_c)}°
                </span>
              </div>
            </div>
          </div>

          {/* Spraying Window & Agro-Risk Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Spraying Window Box */}
            <div className={`overflow-hidden rounded-3xl border p-5 shadow-xs ${
              weatherData.agro_advisory.is_spraying_favorable
                ? "border-emerald-200 bg-emerald-50/80"
                : "border-amber-200 bg-amber-50/80"
            }`}>
              <div className="flex items-center gap-2.5">
                {weatherData.agro_advisory.is_spraying_favorable ? (
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="h-4.5 w-4.5" />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                    <AlertTriangle className="h-4.5 w-4.5" />
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-stone-900">{t.sprayingWindow}</h4>
                  <span className={`text-xs font-semibold ${
                    weatherData.agro_advisory.is_spraying_favorable ? "text-emerald-800" : "text-amber-800"
                  }`}>
                    {weatherData.agro_advisory.is_spraying_favorable ? t.safeToSpray : t.dangerToSpray}
                  </span>
                </div>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-stone-700 sm:text-sm">
                {weatherData.agro_advisory.spraying_advisory}
              </p>
            </div>

            {/* Fungal Outbreak Risk Box */}
            <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4.5 w-4.5 text-stone-600" />
                  <h4 className="text-sm font-bold text-stone-900">{t.weatherRisk}</h4>
                </div>
                <span className={`rounded-md px-2.5 py-0.5 text-xs font-bold ${
                  getFungalBadge(weatherData.agro_advisory.fungal_outbreak_risk).bg
                }`}>
                  {weatherData.agro_advisory.fungal_outbreak_risk}
                </span>
              </div>

              <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-stone-600">
                {weatherData.agro_advisory.risk_factors.map((factor, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-stone-400 font-bold">•</span>
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
