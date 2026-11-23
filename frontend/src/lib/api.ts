import { DiagnosisResponse, WeatherData, MandiMetaResponse, MandiPricesResponse } from "@/types";

// Resolves API Base URL:
// 1. Server-side: uses Vercel's injected BACKEND_SERVICE_URL binding if present
// 2. Client-side: uses NEXT_PUBLIC_API_URL if configured, or empty string "" for same-domain Vercel /api rewrites
export function getApiBaseUrl(): string {
  if (typeof window === "undefined") {
    if (process.env.BACKEND_SERVICE_URL) {
      return process.env.BACKEND_SERVICE_URL.replace(/\/$/, "");
    }
    return (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }
  return "";
}

const API_BASE_URL = getApiBaseUrl();

/**
 * Compresses an image client-side using an HTML Canvas
 * to conserve bandwidth for farmers on rural mobile connections.
 */
export async function compressImage(file: File | Blob, maxDimension = 1024, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height && width > maxDimension) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else if (height > maxDimension) {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            resolve(file);
          }
        },
        "image/jpeg",
        quality
      );
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Submits leaf image to the FastAPI Hierarchical Field Pipeline.
 */
export async function diagnoseCrop(
  imageBlob: Blob | File,
  location?: { lat?: number; lon?: number; city?: string }
): Promise<DiagnosisResponse> {
  const formData = new FormData();
  formData.append("image", imageBlob, "crop_leaf.jpg");

  if (location?.lat !== undefined && location?.lon !== undefined) {
    formData.append("latitude", location.lat.toString());
    formData.append("longitude", location.lon.toString());
  } else if (location?.city) {
    formData.append("city", location.city);
  }

  const response = await fetch(`${API_BASE_URL}/api/diagnose`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    let errorDetail = "Diagnostic service error";
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {
      errorDetail = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

/**
 * Retrieves live or offline-cached agro-meteorological telemetry and spraying advisory.
 */
export async function fetchAgroWeather(location: {
  lat?: number;
  lon?: number;
  city?: string;
}): Promise<WeatherData> {
  const params = new URLSearchParams();
  if (location.lat !== undefined && location.lon !== undefined) {
    params.append("lat", location.lat.toString());
    params.append("lon", location.lon.toString());
  } else if (location.city) {
    params.append("city", location.city);
  } else {
    params.append("city", "Central India");
  }

  const response = await fetch(`${API_BASE_URL}/api/weather?${params.toString()}`);
  if (!response.ok) {
    let errorDetail = "Weather service unavailable";
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {
      errorDetail = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

/**
 * Retrieves Mandi search metadata (states, districts mapping, and crops list).
 */
export async function fetchMandiMetadata(): Promise<MandiMetaResponse> {
  const response = await fetch(`${API_BASE_URL}/api/mandi/meta`);
  if (!response.ok) {
    throw new Error("Unable to load Mandi market metadata");
  }
  return response.json();
}

/**
 * Retrieves APMC Mandi prices, arrivals, and price trends.
 */
export async function fetchMandiPrices(filters?: {
  state?: string;
  district?: string;
  crop?: string;
}): Promise<MandiPricesResponse> {
  const params = new URLSearchParams();
  if (filters?.state && filters.state !== "All") params.append("state", filters.state);
  if (filters?.district && filters.district !== "All") params.append("district", filters.district);
  if (filters?.crop && filters.crop !== "All") params.append("crop", filters.crop);

  const url = `${API_BASE_URL}/api/mandi/prices${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Unable to retrieve APMC Mandi prices");
  }
  return response.json();
}

/**
 * Checks FastAPI backend status and hardware capabilities (GPU vs CPU).
 */
export async function checkBackendHealth(): Promise<{
  status: string;
  version: string;
  cuda_available: boolean;
  device_name: string;
  supported_classes_count: number;
  weather_service_configured: boolean;
  ai_advisory_configured: boolean;
  mandi_service_active: boolean;
}> {
  const response = await fetch(`${API_BASE_URL}/api/health`);
  if (!response.ok) {
    throw new Error("Backend offline");
  }
  return response.json();
}
