"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  ShieldCheck,
  Cloud,
  CloudUpload,
  CheckCircle2,
  RefreshCw,
  LogOut,
  MapPin,
  Sprout,
  AlertCircle,
  HardDrive
} from "lucide-react";
import { Language, KisanProfile, SyncStatus, SavedScan } from "@/types";
import { translations } from "@/lib/i18n";
import {
  signInWithGoogle,
  signOut,
  fetchKisanProfile,
  saveKisanProfile,
  syncScansWithCloud
} from "@/lib/syncService";
import { isSupabaseConfigured, getSupabaseClient } from "@/lib/supabase";
import { getSavedScans } from "@/lib/storage";

interface KisanProfileTabProps {
  lang: Language;
  onScansSynced?: (scans: SavedScan[]) => void;
  onProfileUpdated?: (profile: KisanProfile) => void;
}

const INDIAN_STATES = [
  "Punjab",
  "Maharashtra",
  "Uttar Pradesh",
  "Madhya Pradesh",
  "Gujarat",
  "Rajasthan",
  "Haryana",
  "Andhra Pradesh",
  "Telangana",
  "Karnataka",
  "West Bengal",
  "Bihar"
];

const COMMON_CROPS = [
  { en: "Wheat", hi: "गेहूँ" },
  { en: "Paddy / Rice", hi: "धान / चावल" },
  { en: "Cotton", hi: "कपास" },
  { en: "Sugarcane", hi: "गन्ना" },
  { en: "Mustard", hi: "सरसों" },
  { en: "Chilli", hi: "मिर्च" },
  { en: "Onion", hi: "प्याज़" },
  { en: "Tomato", hi: "टमाटर" },
  { en: "Potato", hi: "आलू" },
  { en: "Maize (Corn)", hi: "मक्का" },
  { en: "Soybean", hi: "सोयाबीन" },
  { en: "Apple", hi: "सेब" }
];

export function KisanProfileTab({
  lang,
  onScansSynced,
  onProfileUpdated
}: KisanProfileTabProps) {
  const t = translations[lang];
  const [profile, setProfile] = useState<KisanProfile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [localScansCount, setLocalScansCount] = useState<number>(0);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Form states for profile personalization
  const [selectedState, setSelectedState] = useState<string>("Punjab");
  const [district, setDistrict] = useState<string>("Ludhiana");
  const [selectedCrops, setSelectedCrops] = useState<string[]>(["Wheat", "Paddy / Rice"]);

  const isConfigured = isSupabaseConfigured();

  // Load auth state and profile on mount
  useEffect(() => {
    let isMounted = true;
    setLocalScansCount(getSavedScans().length);

    async function checkAuth() {
      if (!isConfigured) {
        setIsLoadingAuth(false);
        return;
      }

      const supabase = getSupabaseClient();
      if (!supabase) {
        setIsLoadingAuth(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && isMounted) {
          const userProfile = await fetchKisanProfile();
          if (userProfile && isMounted) {
            setProfile(userProfile);
            setSelectedState(userProfile.state || "Punjab");
            setDistrict(userProfile.district || "Ludhiana");
            setSelectedCrops(userProfile.preferred_crops || ["Wheat", "Paddy / Rice"]);
            if (onProfileUpdated) onProfileUpdated(userProfile);
          }
        }
      } catch (e) {
        console.error("Auth check failed:", e);
      } finally {
        if (isMounted) setIsLoadingAuth(false);
      }
    }

    checkAuth();

    // Listen for auth state changes (e.g. redirect from Google OAuth)
    const supabase = getSupabaseClient();
    const authListener = supabase?.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && isMounted) {
        const updated = await fetchKisanProfile();
        if (updated && isMounted) {
          setProfile(updated);
          setSelectedState(updated.state || "Punjab");
          setDistrict(updated.district || "Ludhiana");
          setSelectedCrops(updated.preferred_crops || ["Wheat", "Paddy / Rice"]);
          if (onProfileUpdated) onProfileUpdated(updated);
          // Trigger automatic auto-merge of guest scans
          triggerAutoSync();
        }
      } else if (event === "SIGNED_OUT" && isMounted) {
        setProfile(null);
      }
    });

    return () => {
      isMounted = false;
      authListener?.data?.subscription?.unsubscribe();
    };
  }, [isConfigured]);

  const triggerAutoSync = async () => {
    setSyncStatus("syncing");
    setSyncMessage(lang === "hi" ? "स्कैन रिपोर्ट सिंक हो रही हैं..." : "Syncing scans with cloud...");
    const result = await syncScansWithCloud();
    setSyncStatus(result.status);
    setSyncMessage(result.message || null);
    if (result.scans && onScansSynced) {
      onScansSynced(result.scans);
      setLocalScansCount(result.scans.length);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setLoginError(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setLoginError(error.message);
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setProfile(null);
    setSyncStatus("idle");
    setSyncMessage(null);
  };

  const handleToggleCrop = (cropName: string) => {
    setSelectedCrops((prev) =>
      prev.includes(cropName) ? prev.filter((c) => c !== cropName) : [...prev, cropName]
    );
  };

  const handleSaveProfileForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setSaveSuccess(false);

    const updatedProfile: Partial<KisanProfile> = {
      state: selectedState,
      district: district.trim(),
      preferred_crops: selectedCrops
    };

    if (profile) {
      const ok = await saveKisanProfile(updatedProfile);
      if (ok) {
        const fresh = { ...profile, ...updatedProfile } as KisanProfile;
        setProfile(fresh);
        if (onProfileUpdated) onProfileUpdated(fresh);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } else {
      // Guest mode local preference
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
    setIsSavingProfile(false);
  };

  if (isLoadingAuth) {
    return (
      <div className="w-full py-12 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-stone-500 font-medium">
          {lang === "hi" ? "किसान प्रोफ़ाइल लोड हो रही है..." : "Loading Kisan Profile..."}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 max-w-2xl mx-auto">
      {/* Configuration Helper Callout if Supabase keys not set */}
      {!isConfigured && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-900 text-sm flex gap-3 items-start shadow-xs">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-950">
              {lang === "hi" ? "क्लाउड सिंक सेटअप सूचना" : "Supabase Cloud Setup Active"}
            </p>
            <p className="text-xs text-amber-800 leading-relaxed">
              {lang === "hi"
                ? "ऐप वर्तमान में सुरक्षित ऑफलाइन मोड (IndexedDB) में चल रहा है। किसी भी समय .env.local में Supabase कुंजियां जोड़कर गूगल क्लाउड बैकअप शुरू किया जा सकता है।"
                : "CropDoc is operating in persistent Offline/Guest mode (IndexedDB). Add your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local to activate instant Google Cloud Sync."}
            </p>
          </div>
        </div>
      )}

      {/* Main Account Card */}
      {!profile ? (
        /* GUEST MODE CARD */
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <HardDrive className="h-3.5 w-3.5" />
                {t.guestModeTitle}
              </div>
              <h2 className="text-xl font-bold text-stone-900 pt-1">
                {lang === "hi" ? "नमस्ते किसान भाई!" : "Welcome, Kisan Brother!"}
              </h2>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <User className="h-6 w-6" />
            </div>
          </div>

          <p className="text-sm text-stone-600 leading-relaxed">
            {t.guestModeDesc}
          </p>

          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-between text-xs text-stone-600">
            <span className="flex items-center gap-2 font-medium">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              {lang === "hi" ? "इस फोन पर सुरक्षित पर्चे:" : "Scans saved on this phone:"}
            </span>
            <span className="font-bold text-stone-900 bg-white px-2.5 py-1 rounded-md border border-stone-200">
              {localScansCount}
            </span>
          </div>

          {loginError && (
            <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
              {loginError}
            </p>
          )}

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoggingIn || !isConfigured}
            className={`w-full py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-3 transition-all shadow-xs cursor-pointer ${
              !isConfigured
                ? "bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed"
                : "bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 hover:border-stone-400 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-emerald-500"
            }`}
          >
            {isLoggingIn ? (
              <RefreshCw className="h-4 w-4 animate-spin text-stone-600" />
            ) : (
              <svg className="h-4.5 w-4.5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.14 0 9.9 0 12s.45 3.86 1.24 5.42l4.04-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            )}
            <span>{t.signInWithGoogle}</span>
          </button>
        </div>
      ) : (
        /* LOGGED IN USER CARD */
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div className="flex items-center gap-3.5">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="w-12 h-12 rounded-full border-2 border-emerald-500 object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-lg">
                  {profile.full_name?.charAt(0) || "K"}
                </div>
              )}
              <div>
                <h2 className="text-base font-bold text-stone-900">{profile.full_name}</h2>
                <p className="text-xs text-stone-500">{profile.email}</p>
                <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <ShieldCheck className="h-3 w-3" />
                  {lang === "hi" ? "गूगल प्रमाणित किसान" : "Google Verified Kisan"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
              title={t.signOut}
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>

          {/* Cloud Sync Status Box */}
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Cloud className="h-4.5 w-4.5 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-950">
                  {syncStatus === "synced"
                    ? t.synced
                    : syncStatus === "syncing"
                    ? t.syncing
                    : lang === "hi"
                    ? "क्लाउड बैकअप सक्रिय"
                    : "Cloud Sync Ready"}
                </span>
              </div>
              <p className="text-xs text-emerald-800">
                {syncMessage || (lang === "hi" ? `${localScansCount} पर्चे सिंक हैं` : `${localScansCount} scans available`)}
              </p>
            </div>

            <button
              type="button"
              onClick={triggerAutoSync}
              disabled={syncStatus === "syncing"}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-medium transition-colors shadow-xs cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncStatus === "syncing" ? "animate-spin" : ""}`} />
              <span>{t.syncNow}</span>
            </button>
          </div>
        </div>
      )}

      {/* Farm Personalization & Preferred Crops Form */}
      <form
        onSubmit={handleSaveProfileForm}
        className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-5"
      >
        <div className="flex items-center gap-2.5 pb-2 border-b border-stone-100">
          <MapPin className="h-5 w-5 text-emerald-600" />
          <h3 className="text-base font-bold text-stone-900">{t.farmPreferences}</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700">
              {t.selectState}
            </label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full text-sm rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {INDIAN_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700">
              {t.selectDistrict}
            </label>
            <input
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="e.g. Ludhiana, Nashik, Karnal"
              className="w-full text-sm rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Crops Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
            <Sprout className="h-4 w-4 text-emerald-600" />
            <span>{lang === "hi" ? "मेरी मुख्य फसलें (टैप करके चुनें):" : "My Primary Crops (tap to select):"}</span>
          </label>
          <div className="flex flex-wrap gap-2 pt-1">
            {COMMON_CROPS.map((crop) => {
              const isSelected = selectedCrops.includes(crop.en);
              return (
                <button
                  type="button"
                  key={crop.en}
                  onClick={() => handleToggleCrop(crop.en)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-300 hover:bg-stone-100"
                  }`}
                >
                  {lang === "hi" ? crop.hi : crop.en}
                </button>
              );
            })}
          </div>
        </div>

        {saveSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{t.preferencesSaved}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSavingProfile}
          className="w-full py-2.5 px-4 rounded-xl font-medium text-sm bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {isSavingProfile ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          <span>{t.savePreferences}</span>
        </button>
      </form>
    </div>
  );
}
