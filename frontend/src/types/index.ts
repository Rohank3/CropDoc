export interface CropDiagnosis {
  raw_label: string;
  crop: string;
  condition: string;
  is_healthy: boolean;
  display_name: string;
  confidence_score: number;
}

export interface Candidate {
  raw_label: string;
  crop: string;
  condition: string;
  is_healthy: boolean;
  display_name: string;
  confidence_score: number;
}

export interface WeatherTriggers {
  ideal_temp_range?: string;
  humidity_threshold?: string;
  leaf_wetness_hours?: string;
}

export interface AdvisoryData {
  pathogen: string;
  severity: "Low" | "Medium" | "High" | "Critical" | "None" | string;
  symptoms: string;
  organic_remedies: string[];
  chemical_remedies: string[];
  preventive_practices: string[];
  weather_triggers?: WeatherTriggers;
  ai_insights?: string | null;
}

export interface AgroRiskAdvisory {
  fungal_outbreak_risk: "Low" | "Moderate" | "High" | "Critical" | string;
  risk_factors: string[];
  spraying_advisory: string;
  is_spraying_favorable: boolean;
}

export interface WeatherTelemetry {
  temperature_c: number;
  feels_like_c: number;
  temp_min_c: number;
  temp_max_c: number;
  humidity_percent: number;
  pressure_hpa: number;
  wind_speed_kmh: number;
  condition: string;
  description: string;
  icon: string;
  rain_1h_mm: number;
}

export interface WeatherData {
  location: {
    name?: string;
    country?: string;
    coordinates?: {
      lat?: number;
      lon?: number;
    };
  };
  weather: WeatherTelemetry;
  agro_advisory: AgroRiskAdvisory;
}

export interface DiagnosisResponse {
  status: string;
  diagnosis: CropDiagnosis;
  is_confident: boolean;
  top_candidates: Candidate[];
  advisory: AdvisoryData;
  weather_context?: WeatherData | null;
}

export interface SavedScan {
  id: string;
  timestamp: number;
  imageThumbnail: string;
  diagnosis: CropDiagnosis;
  severity: string;
  advisory: AdvisoryData;
  weatherSnapshot?: WeatherTelemetry | null;
}

export type Language = "en" | "hi";
