export interface LeafValidationResult {
  is_valid: boolean;
  is_blurry: boolean;
  has_foliage: boolean;
  blur_score: number;
  foliage_ratio: number;
  issue_type?: "blurry" | "non_leaf" | "corrupted" | "low_resolution" | null;
  message: string;
  message_hi: string;
}

export interface CropDiagnosis {
  raw_label: string;
  crop: string;
  condition: string;
  is_healthy: boolean;
  display_name: string;
  confidence_score: number;
  crop_hi?: string;
  condition_hi?: string;
  visual_reasoning?: string;
}

export interface Candidate {
  raw_label: string;
  crop: string;
  condition: string;
  is_healthy: boolean;
  display_name: string;
  confidence_score: number;
  crop_hi?: string;
  condition_hi?: string;
}

export interface WeatherTriggers {
  ideal_temp_range?: string;
  humidity_threshold?: string;
  leaf_wetness_hours?: string;
}

export interface CIBRCFormulation {
  name: string;
  dose_per_tank_15l: string;
  dose_per_acre: string;
  est_cost_inr: string;
  phi_days: number;
  application_notes: string;
}

export interface AdvisoryData {
  pathogen: string;
  severity: "Low" | "Medium" | "High" | "Critical" | string;
  severity_gauge: "green" | "yellow" | "red";
  symptoms: string;
  symptoms_hi?: string;
  tanki_quick_dose?: string;
  cibrc_chemical: CIBRCFormulation[];
  cibrc_organic: CIBRCFormulation[];
  organic_remedies: string[];
  chemical_remedies: string[];
  preventive_practices: string[];
  weather_triggers?: WeatherTriggers;
  ai_insights?: string | null;
}

export interface AgroRiskAdvisory {
  fungal_outbreak_risk: "Low" | "Moderate" | "High" | "Critical" | string;
  fungal_gauge?: "green" | "yellow" | "red";
  risk_factors: string[];
  risk_factors_hi?: string[];
  spraying_advisory: string;
  spraying_advisory_hi?: string;
  is_spraying_favorable: boolean;
  recommended_hours?: string;
}

export interface WeatherTelemetry {
  temperature_c: number;
  feels_like_c: number;
  temp_min_c?: number;
  temp_max_c?: number;
  humidity_percent: number;
  pressure_hpa: number;
  wind_speed_kmh: number;
  condition: string;
  condition_hi?: string;
  description: string;
  icon: string;
  rain_1h_mm: number;
}

export interface WeatherData {
  status?: string;
  is_fallback?: boolean;
  field_offline_mode?: boolean;
  source?: string;
  location: {
    city?: string;
    country?: string;
    coordinates?: {
      latitude?: number;
      longitude?: number;
    };
  };
  weather: WeatherTelemetry;
  agro_risk_assessment?: AgroRiskAdvisory;
  agro_advisory?: AgroRiskAdvisory;
}

export interface DiagnosisResponse {
  status: "success" | "rejected";
  stage_applied: "stage1_rejected" | "stage2_cv" | "stage3_multimodal" | "stage3_gemini_multimodal_live" | string;
  validation: LeafValidationResult;
  diagnosis: CropDiagnosis | null;
  is_confident: boolean;
  top_candidates: Candidate[];
  advisory: AdvisoryData | null;
  weather_context?: WeatherData | null;
  is_live_ai?: boolean;
}

export interface SavedScan {
  id: string;
  timestamp: number;
  imageThumbnail: string;
  imageUrl?: string;
  diagnosis: CropDiagnosis;
  severity: string;
  severity_gauge?: "green" | "yellow" | "red";
  tanki_quick_dose?: string;
  advisory: AdvisoryData;
  weatherSnapshot?: WeatherTelemetry | null;
  synced_to_cloud?: boolean;
}

export interface KisanProfile {
  id: string;
  email?: string;
  full_name: string;
  avatar_url?: string;
  state: string;
  district: string;
  preferred_crops: string[];
  updated_at?: string;
}

export type SyncStatus = "idle" | "syncing" | "synced" | "error" | "offline";

export interface MandiNearbyMarket {
  market: string;
  modal_price: number;
  distance_km: number;
}

export interface MandiPriceRecord {
  id: string;
  state: string;
  state_hi: string;
  district: string;
  district_hi: string;
  market: string;
  crop: string;
  crop_hi: string;
  variety: string;
  arrival_tonnes: number;
  min_price: number;
  max_price: number;
  modal_price: number;
  price_unit: string;
  msp_benchmark?: number | null;
  trend: "up" | "down" | "stable";
  trend_pct: number;
  last_updated: string;
  nearby_mandis: MandiNearbyMarket[];
}

export interface MandiMetaResponse {
  states: string[];
  districts_by_state: Record<string, string[]>;
  crops: string[];
  total_markets_tracked: number;
}

export interface MandiPricesResponse {
  status: string;
  count: number;
  query: {
    state?: string | null;
    district?: string | null;
    crop?: string | null;
  };
  prices: MandiPriceRecord[];
}

export type Language = "en" | "hi";
