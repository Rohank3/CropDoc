"""
CropDoc - Dynamic Multimodal Gemini Agronomist Service
Sends leaf image directly to Gemini 2.5 Flash Vision to diagnose pathology and generate complete live prescriptions.
"""

import json
import re
from typing import Dict, Any, Optional
from app.core.config import settings

def analyze_leaf_with_gemini(
    image_bytes: bytes, 
    weather_context: Optional[Dict[str, Any]] = None
) -> Optional[Dict[str, Any]]:
    """
    Sends leaf image directly to Gemini 2.5 Flash to diagnose crop pathology and generate complete,
    un-canned dynamic prescriptions (chemicals, 15L tank dosages, organic bio-control, costs, PHI days).
    """
    gemini_key = settings.GEMINI_API_KEY.strip()
    if not gemini_key:
        return None

    try:
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=gemini_key)

        weather_desc = ""
        if weather_context:
            w = weather_context.get("weather", {})
            weather_desc = (
                f"Field weather: Temperature {w.get('temperature_c', 'N/A')}°C, "
                f"Humidity {w.get('humidity_percent', 'N/A')}%, "
                f"Wind {w.get('wind_speed_kmh', 'N/A')} km/h, "
                f"Rain {w.get('rain_1h_mm', 0)} mm."
            )

        prompt = (
            "You are an expert Indian Chief Plant Pathologist and Agricultural Extension Specialist (ICAR / KVK).\n"
            "Analyze this crop leaf image directly. Do NOT rely on generic pre-canned text. Diagnose what you observe in the picture.\n"
            f"{weather_desc}\n\n"
            "Diagnose the exact crop species, the exact disease or healthy condition, observed leaf symptoms, "
            "and formulate a complete, practical prescription calibrated for an Indian farmer using a standard 15-litre backpack sprayer (dholki).\n\n"
            "Respond ONLY with a valid, clean JSON object matching this EXACT structure (no markdown fences, no explanatory pre-amble):\n"
            "{\n"
            '  "diagnosis": {\n'
            '    "crop": "Crop name in English (e.g. Rice, Wheat, Cotton, Chilli, Tomato, etc.)",\n'
            '    "crop_hi": "फसल का नाम हिंदी में (जैसे धान, गेहूँ, कपास, हरी मिर्च, टमाटर)",\n'
            '    "condition": "Condition name in English (e.g. Leaf Blast, Yellow Rust, Healthy Leaf)",\n'
            '    "condition_hi": "रोग या स्थिति का नाम हिंदी में",\n'
            '    "is_healthy": false,\n'
            '    "confidence_score": 92.0,\n'
            '    "visual_reasoning": "Detailed visual analysis of lesions, chlorosis, necrosis, curling, spots, or pest damage observed on this leaf."\n'
            '  },\n'
            '  "advisory": {\n'
            '    "pathogen": "Causal organism / pathogen (Fungus/Bacteria/Virus/Pest/Nutrient deficiency)",\n'
            '    "severity": "Low" | "Medium" | "High" | "Critical",\n'
            '    "severity_gauge": "green" | "yellow" | "red",\n'
            '    "symptoms": "Detailed visual symptoms",\n'
            '    "symptoms_hi": "लक्षण विवरण",\n'
            '    "tanki_quick_dose": "Concise dose for standard 15L backpack sprayer (e.g. Saaf 30g OR Tilt 15ml per 15L Tank)",\n'
            '    "cibrc_chemical": [\n'
            '      {\n'
            '        "name": "Commercial chemical formulation with trade name (e.g. Carbendazim 12% + Mancozeb 63% WP (Saaf))",\n'
            '        "dose_per_tank_15l": "Dose per 15L backpack tank (e.g. 30-35 g per 15L tank)",\n'
            '        "dose_per_acre": "Dose per acre (e.g. 500 g in 200L water)",\n'
            '        "est_cost_inr": "Estimated cost in ₹ (e.g. ₹45 - ₹65 per tank)",\n'
            '        "phi_days": 14,\n'
            '        "application_notes": "Application timing and safety precautions"\n'
            '      }\n'
            '    ],\n'
            '    "cibrc_organic": [\n'
            '      {\n'
            '        "name": "Organic or bio-control alternative (e.g. Neem Oil 10,000 PPM, Trichoderma viride)",\n'
            '        "dose_per_tank_15l": "Dose per 15L backpack tank (e.g. 45 ml per 15L tank)",\n'
            '        "dose_per_acre": "Dose per acre (e.g. 500 ml in 200L water)",\n'
            '        "est_cost_inr": "Estimated cost in ₹",\n'
            '        "phi_days": 0,\n'
            '        "application_notes": "Preparation and spraying method"\n'
            '      }\n'
            '    ],\n'
            '    "organic_remedies": ["Specific organic remedy 1", "Specific organic remedy 2"],\n'
            '    "chemical_remedies": ["Specific chemical recommendation 1", "Specific chemical recommendation 2"],\n'
            '    "preventive_practices": ["Agronomic cultural prevention practice 1", "Prevention practice 2"],\n'
            '    "weather_triggers": {\n'
            '      "ideal_temp_range": "e.g. 20°C - 28°C",\n'
            '      "humidity_threshold": "> 80% RH",\n'
            '      "leaf_wetness_hours": "e.g. Morning dew or rainfall"\n'
            '    },\n'
            '    "ai_insights": "Direct farmer advisory explaining immediate emergency actions, weather cautions, and long-term field care."\n'
            '  }\n'
            "}"
        )

        mime = "image/jpeg"
        if image_bytes.startswith(b"\x89PNG"):
            mime = "image/png"
        elif image_bytes.startswith(b"RIFF") and b"WEBP" in image_bytes[:16]:
            mime = "image/webp"

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type=mime),
                prompt
            ]
        )

        if response and response.text:
            text = response.text.strip()
            match = re.search(r"\{.*\}", text, re.DOTALL)
            if match:
                data = json.loads(match.group(0))
                diag = data.get("diagnosis", {})
                advis = data.get("advisory", {})

                # Format diagnosis object
                crop = diag.get("crop", "Crop")
                cond = diag.get("condition", "Diagnosed Condition")
                formatted_diagnosis = {
                    "raw_label": f"{crop}___{cond.replace(' ', '_')}",
                    "crop": crop,
                    "crop_hi": diag.get("crop_hi", crop),
                    "condition": cond,
                    "condition_hi": diag.get("condition_hi", cond),
                    "is_healthy": bool(diag.get("is_healthy", False)),
                    "display_name": f"{crop} - {cond}",
                    "confidence_score": round(float(diag.get("confidence_score", 92.0)), 1),
                    "visual_reasoning": diag.get("visual_reasoning", "Diagnosed with Gemini 2.5 Flash Multimodal Vision.")
                }

                # Ensure advisory structure is complete
                formatted_advisory = {
                    "pathogen": advis.get("pathogen", "Identified Pathogen"),
                    "severity": advis.get("severity", "Medium"),
                    "severity_gauge": advis.get("severity_gauge", "yellow"),
                    "symptoms": advis.get("symptoms", ""),
                    "symptoms_hi": advis.get("symptoms_hi", ""),
                    "tanki_quick_dose": advis.get("tanki_quick_dose", ""),
                    "cibrc_chemical": advis.get("cibrc_chemical", []),
                    "cibrc_organic": advis.get("cibrc_organic", []),
                    "organic_remedies": advis.get("organic_remedies", []),
                    "chemical_remedies": advis.get("chemical_remedies", []),
                    "preventive_practices": advis.get("preventive_practices", []),
                    "weather_triggers": advis.get("weather_triggers", {}),
                    "ai_insights": advis.get("ai_insights", "Dynamic AI advisory generated for this field photo.")
                }

                return {
                    "diagnosis": formatted_diagnosis,
                    "advisory": formatted_advisory,
                    "source": "gemini_2.5_flash_multimodal",
                    "is_live_ai": True
                }
    except Exception as e:
        print(f"[Gemini Agronomist Error]: {str(e)}. Falling back to local/cached knowledge.")
    return None
