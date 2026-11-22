import json
import os
from typing import Dict, Any, Optional
from app.core.config import settings

class AdvisoryService:
    def __init__(self):
        self.remedies_path = os.path.join(
            os.path.dirname(__file__), "..", "data", "remedies.json"
        )
        self.remedies_db: Dict[str, Any] = {}
        self._load_database()

    def _load_database(self):
        if os.path.exists(self.remedies_path):
            with open(self.remedies_path, "r", encoding="utf-8") as f:
                self.remedies_db = json.load(f)
        else:
            self.remedies_db = {}

    def get_remedy(self, raw_label: str) -> Optional[Dict[str, Any]]:
        """Retrieves verified agronomic treatment guidelines for a specific plant pathology class."""
        return self.remedies_db.get(raw_label)

    async def get_enhanced_advisory(
        self, 
        diagnosis: Dict[str, Any], 
        weather_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Combines CIBRC verified database remedies with optional dynamic Gemini AI contextual advisory."""
        raw_label = diagnosis.get("raw_label", "")
        remedy = self.get_remedy(raw_label)
        
        # Baseline response from scientifically verified Indian CIBRC database
        base_advisory = {
            "pathogen": remedy.get("pathogen", "N/A") if remedy else "Unknown",
            "severity": remedy.get("severity", "Medium") if remedy else "Medium",
            "severity_gauge": remedy.get("severity_gauge", "yellow") if remedy else "yellow",
            "symptoms": remedy.get("symptoms", "") if remedy else "",
            "symptoms_hi": remedy.get("symptoms_hi", "") if remedy else "",
            "tanki_quick_dose": remedy.get("tanki_quick_dose", "") if remedy else "",
            "cibrc_chemical": remedy.get("cibrc_chemical", []) if remedy else [],
            "cibrc_organic": remedy.get("cibrc_organic", []) if remedy else [],
            "organic_remedies": remedy.get("organic_remedies", []) if remedy else [],
            "chemical_remedies": remedy.get("chemical_remedies", []) if remedy else [],
            "preventive_practices": remedy.get("preventive_practices", []) if remedy else [],
            "weather_triggers": remedy.get("weather_triggers", {}) if remedy else {},
            "ai_insights": None
        }

        # If Gemini API key is configured, enrich with dynamic AI guidance for Indian farmers
        gemini_key = settings.GEMINI_API_KEY.strip()
        if gemini_key:
            try:
                from google import genai
                client = genai.Client(api_key=gemini_key)
                
                weather_info = ""
                if weather_context:
                    w = weather_context.get("weather", {})
                    weather_info = (
                        f"Current weather at farm: Temp {w.get('temperature_c')}°C, "
                        f"Humidity {w.get('humidity_percent')}%, Condition {w.get('condition')}, "
                        f"Wind {w.get('wind_speed_kmh')} km/h, Rain {w.get('rain_1h_mm')} mm."
                    )

                prompt = (
                    f"You are an expert Indian agricultural extension officer and plant pathologist (KVK / ICAR specialist).\n"
                    f"A farmer just diagnosed their crop: {diagnosis.get('display_name')} (Pathogen: {base_advisory['pathogen']}).\n"
                    f"{weather_info}\n"
                    f"Provide a clear, practical prescription for an Indian farmer using a standard 15-litre backpack sprayer (dholki):\n"
                    f"1. Emergency Spray (state dose per 15L tank and safe morning/evening timing).\n"
                    f"2. Weather caution (whether current wind/humidity permits spraying now or warns against it).\n"
                    f"3. Practical cost-saving or organic alternative advice.\n"
                    f"Keep it respectful, clear, and direct without complicated laboratory jargon."
                )

                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt
                )
                if response and response.text:
                    base_advisory["ai_insights"] = response.text.strip()
            except Exception as e:
                # Log and continue cleanly with the knowledge base
                base_advisory["ai_insights"] = f"Dynamic AI enrichment unavailable ({str(e)}). Using verified CIBRC agronomic database."

        return base_advisory

advisory_service = AdvisoryService()
