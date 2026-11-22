import httpx
from typing import Optional, Dict, Any, List
from fastapi import HTTPException
from app.core.config import settings

class WeatherService:
    BASE_URL = "https://api.openweathermap.org/data/2.5"

    @classmethod
    def calculate_agro_risks(cls, temp_c: float, humidity: int, rain_mm: float, wind_kmh: float) -> Dict[str, Any]:
        """Calculates real-world plant pathology risks and knapsack spraying windows."""
        fungal_risk = "Low"
        fungal_gauge = "green"
        fungal_reasons = []
        fungal_reasons_hi = []
        spray_advisory = "Favorable for spraying."
        spray_advisory_hi = "दवा छिड़काव के लिए मौसम अनुकूल है।"
        spray_favorable = True
        recommended_hours = "7:00 AM - 10:30 AM"
        
        # Fungal & Blight risk analysis
        if humidity >= 85 and 16 <= temp_c <= 29:
            fungal_risk = "Critical"
            fungal_gauge = "red"
            fungal_reasons.append("Prolonged high humidity (>85%) and warm temperatures are optimal for Blight, Rust, and Anthracnose sporulation.")
            fungal_reasons_hi.append("अत्यधिक नमी (>85%) और मध्यम तापमान के कारण झुलसा, रतुआ और फफूंद तेजी से फैलने का भारी खतरा है।")
        elif humidity >= 70 and 15 <= temp_c <= 32:
            fungal_risk = "Moderate"
            fungal_gauge = "yellow"
            fungal_reasons.append("Moderate humidity promotes mildew and spot progression. Monitor lower leaves closely.")
            fungal_reasons_hi.append("मध्यम आर्द्रता के कारण पत्तियों पर धब्बे और फफूंद पनप सकते हैं। निचली पत्तियों की निगरानी करें।")
        elif humidity < 45 and temp_c >= 28:
            fungal_risk = "Low (High Pest Risk)"
            fungal_gauge = "yellow"
            fungal_reasons.append("Dry, hot conditions suppress fungal pathogens but accelerate Spider Mite, Aphid, and Thrips infestations.")
            fungal_reasons_hi.append("सूखा और गर्म मौसम फफूंद को रोकता है लेकिन माहू, थ्रिप्स और मकड़ी कीटों को तेजी से बढ़ाता है।")
        else:
            fungal_reasons.append("Environmental parameters are currently within normal baseline tolerances.")
            fungal_reasons_hi.append("मौसम सामान्य सीमा में है, रोग का कोई गंभीर खतरा नहीं है।")

        # Spraying window advisory
        if rain_mm > 0.5:
            spray_favorable = False
            spray_advisory = "Do NOT spray chemicals now: rain will wash off pesticides within 2-4 hours."
            spray_advisory_hi = "अभी कीटनाशक/फफूंदनाशक न छिड़कें: बारिश से दवा धुल जाएगी।"
            recommended_hours = "Wait until rain ceases and leaves dry"
        elif wind_kmh > 14:
            spray_favorable = False
            spray_advisory = f"High drift danger ({wind_kmh:.1f} km/h wind): delay application to avoid pesticide drift."
            spray_advisory_hi = f"तेज़ हवा ({wind_kmh:.1f} किमी/घंटा): दवा उड़ने का खतरा है, हवा रुकने का इंतज़ार करें।"
            recommended_hours = "Early Morning (6:00 AM - 8:30 AM) when wind is calm"
        elif temp_c > 33:
            spray_favorable = False
            spray_advisory = "High heat caution: spraying in bright sun (>33°C) can scorch tender foliage."
            spray_advisory_hi = "तेज़ धूप (>33°C): दोपहर में छिड़काव से पत्तियां झुलस सकती हैं।"
            recommended_hours = "Late Afternoon (4:30 PM - 6:30 PM)"
        else:
            spray_advisory = "Optimal spraying conditions: low drift, no rain, safe leaf absorption."
            spray_advisory_hi = "छिड़काव के लिए उत्तम समय: हवा शांत है, बारिश का खतरा नहीं।"
            recommended_hours = "Morning 7:00 AM - 10:30 AM or Evening 4:30 PM - 6:30 PM"

        return {
            "fungal_outbreak_risk": fungal_risk,
            "fungal_gauge": fungal_gauge,
            "risk_factors": fungal_reasons,
            "risk_factors_hi": fungal_reasons_hi,
            "spraying_advisory": spray_advisory,
            "spraying_advisory_hi": spray_advisory_hi,
            "is_spraying_favorable": spray_favorable,
            "recommended_hours": recommended_hours
        }

    @classmethod
    def get_fallback_weather(
        cls, 
        lat: Optional[float] = None, 
        lon: Optional[float] = None, 
        city: Optional[str] = None
    ) -> Dict[str, Any]:
        """Provides realistic seasonal agro-meteorological parameters for Indian farming regions when offline."""
        loc_name = city or ("GPS Field Location" if lat and lon else "Central Indian Agro-Zone")
        # Typical seasonal averages
        temp_c = 26.5
        humidity = 68
        wind_speed_kmh = 8.5
        rain_mm = 0.0

        agro_risk = cls.calculate_agro_risks(
            temp_c=temp_c,
            humidity=humidity,
            rain_mm=rain_mm,
            wind_kmh=wind_speed_kmh
        )

        return {
            "status": "success",
            "is_fallback": True,
            "field_offline_mode": True,
            "source": "Regional Agro-Climatic Seasonal Baseline",
            "location": {
                "city": loc_name,
                "country": "India (Regional Norms)",
                "coordinates": {
                    "latitude": lat or 22.5,
                    "longitude": lon or 78.5
                }
            },
            "weather": {
                "temperature_c": temp_c,
                "feels_like_c": 27.0,
                "humidity_percent": humidity,
                "condition": "Partly Cloudy",
                "condition_hi": "हल्के बादल",
                "description": "Seasonal agro-climatic norms for regional cropping belt",
                "wind_speed_kmh": wind_speed_kmh,
                "rain_1h_mm": rain_mm,
                "pressure_hpa": 1012,
                "visibility_km": 8.0,
                "clouds_percent": 30,
                "icon": "02d"
            },
            "agro_risk_assessment": agro_risk
        }

    @classmethod
    async def get_current_weather(
        cls, 
        lat: Optional[float] = None, 
        lon: Optional[float] = None, 
        city: Optional[str] = None
    ) -> Dict[str, Any]:
        """Fetches live weather telemetry from OpenWeatherMap, with graceful fallback to regional agro norms."""
        api_key = settings.OPENWEATHER_API_KEY.strip()
        if not api_key:
            return cls.get_fallback_weather(lat=lat, lon=lon, city=city)

        params: Dict[str, Any] = {
            "appid": api_key,
            "units": "metric"
        }

        if lat is not None and lon is not None:
            params["lat"] = lat
            params["lon"] = lon
        elif city:
            params["q"] = city
        else:
            return cls.get_fallback_weather(lat=lat, lon=lon, city=city)

        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                response = await client.get(f"{cls.BASE_URL}/weather", params=params)
                if response.status_code != 200:
                    return cls.get_fallback_weather(lat=lat, lon=lon, city=city)
                data = response.json()
        except Exception:
            return cls.get_fallback_weather(lat=lat, lon=lon, city=city)

        temp_c = data["main"]["temp"]
        humidity = data["main"]["humidity"]
        wind_speed_kmh = data.get("wind", {}).get("speed", 0.0) * 3.6  # m/s to km/h
        rain_mm = data.get("rain", {}).get("1h", 0.0)
        
        agro_risk = cls.calculate_agro_risks(
            temp_c=temp_c, 
            humidity=humidity, 
            rain_mm=rain_mm, 
            wind_kmh=wind_speed_kmh
        )

        return {
            "status": "success",
            "is_fallback": False,
            "field_offline_mode": False,
            "source": "OpenWeatherMap Live Telemetry",
            "location": {
                "city": data.get("name", "Field Coordinates"),
                "country": data.get("sys", {}).get("country", ""),
                "coordinates": {
                    "latitude": data.get("coord", {}).get("lat", lat),
                    "longitude": data.get("coord", {}).get("lon", lon)
                }
            },
            "weather": {
                "temperature_c": round(temp_c, 1),
                "feels_like_c": round(data["main"].get("feels_like", temp_c), 1),
                "humidity_percent": humidity,
                "condition": data["weather"][0]["main"] if data.get("weather") else "Clear",
                "condition_hi": data["weather"][0]["main"] if data.get("weather") else "साफ़",
                "description": data["weather"][0]["description"].capitalize() if data.get("weather") else "",
                "wind_speed_kmh": round(wind_speed_kmh, 1),
                "rain_1h_mm": rain_mm,
                "pressure_hpa": data["main"].get("pressure", 1013),
                "visibility_km": round(data.get("visibility", 10000) / 1000, 1),
                "clouds_percent": data.get("clouds", {}).get("all", 0),
                "icon": data["weather"][0]["icon"] if data.get("weather") else "01d"
            },
            "agro_risk_assessment": agro_risk
        }
