import { SavedScan, CropDiagnosis, AdvisoryData, WeatherTelemetry } from "@/types";

const STORAGE_KEY = "cropdoc_saved_scans";

export function getSavedScans(): SavedScan[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to read scans from localStorage:", e);
    return [];
  }
}

export function saveScan(
  diagnosis: CropDiagnosis,
  advisory: AdvisoryData,
  imageThumbnail: string,
  weatherSnapshot?: WeatherTelemetry | null
): SavedScan {
  const scans = getSavedScans();
  const newScan: SavedScan = {
    id: `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    imageThumbnail,
    diagnosis,
    severity: advisory.severity,
    advisory,
    weatherSnapshot
  };

  // Limit stored scans to 30 to prevent localStorage exhaustion on mobile
  const updatedScans = [newScan, ...scans].slice(0, 30);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedScans));
  } catch (e) {
    console.error("Failed to write scan to localStorage:", e);
  }
  return newScan;
}

export function deleteSavedScan(id: string): SavedScan[] {
  const scans = getSavedScans();
  const filtered = scans.filter((s) => s.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error("Failed to delete scan:", e);
  }
  return filtered;
}

export function clearAllSavedScans(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("Failed to clear scans:", e);
  }
}
