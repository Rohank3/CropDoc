import { SavedScan, CropDiagnosis, AdvisoryData, WeatherTelemetry } from "@/types";
import { get, set, del } from "idb-keyval";

const STORAGE_KEY = "cropdoc_saved_scans";
const IDB_KEY = "cropdoc_scans_idb";

// Request persistent storage on mobile browsers (Safari ITP / Chrome storage cleaner defense)
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof window !== "undefined" && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      return isPersisted;
    } catch (e) {
      console.warn("Storage persistence request error:", e);
    }
  }
  return false;
}

// Synchronous read from localStorage with fallback
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

// Asynchronous read from IndexedDB (survives 7-day Safari purges and holds large capacity)
export async function getSavedScansFromIndexedDB(): Promise<SavedScan[]> {
  if (typeof window === "undefined") return [];
  try {
    const stored = await get<SavedScan[]>(IDB_KEY);
    if (stored && Array.isArray(stored)) {
      // Sync back into localStorage if localStorage was cleared
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored.slice(0, 30)));
      } catch (_) {}
      return stored;
    }
    // Fallback to localStorage if IDB was empty
    const local = getSavedScans();
    if (local.length > 0) {
      await set(IDB_KEY, local);
      return local;
    }
    return [];
  } catch (e) {
    console.error("Failed to read scans from IndexedDB:", e);
    return getSavedScans();
  }
}

// Compress base64 thumbnail to max 360px JPEG to prevent memory bloat
export async function compressThumbnail(base64Str: string): Promise<string> {
  if (typeof window === "undefined" || !base64Str.startsWith("data:image")) {
    return base64Str;
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const maxDim = 360;
      let width = img.width;
      let height = img.height;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(base64Str);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => resolve(base64Str);
    img.src = base64Str;
  });
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
    severity_gauge: advisory.severity_gauge,
    tanki_quick_dose: advisory.tanki_quick_dose,
    advisory,
    weatherSnapshot
  };

  const updatedScans = [newScan, ...scans];

  // Save up to 50 in localStorage
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedScans.slice(0, 50)));
  } catch (e) {
    console.warn("Failed to write scan to localStorage (quota exceeded), writing to IndexedDB:", e);
  }

  // Persist full history asynchronously to IndexedDB
  if (typeof window !== "undefined") {
    compressThumbnail(imageThumbnail).then((compressed) => {
      const scanWithCompressedImg = { ...newScan, imageThumbnail: compressed };
      getSavedScansFromIndexedDB().then((idbScans) => {
        const fullList = [scanWithCompressedImg, ...idbScans.filter((s) => s.id !== newScan.id)];
        set(IDB_KEY, fullList).catch((err) => console.error("IDB save error:", err));
      });
    });
  }

  return newScan;
}

export function deleteSavedScan(id: string): SavedScan[] {
  const scans = getSavedScans();
  const filtered = scans.filter((s) => s.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error("Failed to delete scan from localStorage:", e);
  }

  if (typeof window !== "undefined") {
    getSavedScansFromIndexedDB().then((idbScans) => {
      const updated = idbScans.filter((s) => s.id !== id);
      set(IDB_KEY, updated).catch((err) => console.error("IDB delete error:", err));
    });
  }

  return filtered;
}

export function clearAllSavedScans(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("Failed to clear scans from localStorage:", e);
  }

  if (typeof window !== "undefined") {
    del(IDB_KEY).catch((err) => console.error("IDB clear error:", err));
  }
}

// Replace/update all local scans (used after downloading cloud sync)
export async function replaceLocalScans(scans: SavedScan[]): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scans.slice(0, 50)));
  } catch (_) {}
  try {
    await set(IDB_KEY, scans);
  } catch (err) {
    console.error("Failed to save scans into IndexedDB:", err);
  }
}
