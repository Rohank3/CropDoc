import { DiagnosisResponse, WeatherData } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

/**
 * Compresses an image client-side using an HTML Canvas
 * to conserve bandwidth for farmers on rural mobile connections.
 */
export async function compressImage(file: File, maxDimension = 1024, quality = 0.85): Promise<Blob> {
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
 * Submits leaf image to the FastAPI PyTorch vision model.
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
      // Fallback to response status text
      errorDetail = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

/**
 * Retrieves live agro-meteorological telemetry and disease outbreak indicators.
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
    throw new Error("Location coordinates or city required");
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
 * Checks FastAPI backend status and hardware capabilities (GPU vs CPU).
 */
export async function checkBackendHealth(): Promise<{
  status: string;
  cuda_available: boolean;
  device_name: string;
  supported_classes_count: number;
  weather_service_configured: boolean;
  ai_advisory_configured: boolean;
}> {
  const response = await fetch(`${API_BASE_URL}/api/health`);
  if (!response.ok) {
    throw new Error("Backend offline");
  }
  return response.json();
}
