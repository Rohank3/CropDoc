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
        """Combines botanical database remedies with optional dynamic Gemini AI contextual advisory."""
        raw_label = diagnosis.get("raw_label", "")
        remedy = self.get_remedy(raw_label)
        
        # Baseline response from scientifically verified database
        base_advisory = {
            "pathogen": remedy.get("pathogen", "N/A") if remedy else "Unknown",
            "severity": remedy.get("severity", "Medium") if remedy else "Medium",
            "symptoms": remedy.get("symptoms", "") if remedy else "",
            "organic_remedies": remedy.get("organic_remedies", []) if remedy else [],
            "chemical_remedies": remedy.get("chemical_remedies", []) if remedy else [],
            "preventive_practices": remedy.get("preventive_practices", []) if remedy else [],
            "weather_triggers": remedy.get("weather_triggers", {}) if remedy else {},
            "ai_insights": None
        }

        # If Gemini API key is configured, enrich with dynamic AI guidance
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
                    f"You are an expert agricultural plant pathologist and farm extension officer.\n"
                    f"A farmer just diagnosed their crop: {diagnosis.get('display_name')} (Pathogen: {base_advisory['pathogen']}).\n"
                    f"{weather_info}\n"
                    f"Provide a concise, practical 2-3 paragraph action plan directly to the farmer:\n"
                    f"1. Immediate emergency action to take within 24 hours.\n"
                    f"2. How the current weather impacts the spread or treatment timing.\n"
                    f"3. Long-term field recovery advice.\n"
                    f"Keep it empathetic, clear, and actionable without complex jargon."
                )

                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt
                )
                if response and response.text:
                    base_advisory["ai_insights"] = response.text.strip()
            except Exception as e:
                # Log and continue cleanly with the knowledge base
                base_advisory["ai_insights"] = f"Dynamic AI enrichment unavailable ({str(e)}). Using verified agronomic database."

        return base_advisory

advisory_service = AdvisoryService()
