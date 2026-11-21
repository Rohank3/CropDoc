import httpx
from typing import Optional, Dict, Any, List
from fastapi import HTTPException
from app.core.config import settings

class WeatherService:
    BASE_URL = "https://api.openweathermap.org/data/2.5"

    @classmethod
    def calculate_agro_risks(cls, temp_c: float, humidity: int, rain_mm: float, wind_kmh: float) -> Dict[str, Any]:
        """Calculates real-world plant pathology risks based on agro-meteorological metrics."""
        fungal_risk = "Low"
        fungal_reasons = []
        spray_advisory = "Favorable for spraying."
        spray_favorable = True
        
        # Fungal & Blight risk analysis
        if humidity >= 85 and 16 <= temp_c <= 29:
            fungal_risk = "Critical"
            fungal_reasons.append("Prolonged high humidity (>85%) and warm temperatures are optimal for Blight, Rust, and Anthracnose sporulation.")
        elif humidity >= 70 and 15 <= temp_c <= 32:
            fungal_risk = "Moderate"
            fungal_reasons.append("Moderate humidity promotes mildew and spot progression. Monitor lower leaves closely.")
        elif humidity < 45 and temp_c >= 28:
            fungal_risk = "Low (High Pest Risk)"
            fungal_reasons.append("Dry, hot conditions suppress fungal pathogens but accelerate Spider Mite and Whitefly infestations.")
        else:
            fungal_reasons.append("Environmental parameters are currently within normal baseline tolerances.")

        # Spraying window advisory
        if rain_mm > 0.5:
            spray_favorable = False
            spray_advisory = "Do NOT spray chemicals or biopesticides now: active precipitation will wash off active ingredients."
        elif wind_kmh > 15:
            spray_favorable = False
            spray_advisory = f"High drift danger ({wind_kmh:.1f} km/h wind): delay application to avoid chemical drift and worker exposure."
        elif temp_c > 33:
            spray_favorable = False
            spray_advisory = "High heat caution: foliar spraying during intense sun (>33°C) may cause phytotoxic leaf burn."
        else:
            spray_advisory = "Conditions are ideal for foliar nutrition or preventive bio-fungicide sprays (calm wind, no rain)."

        return {
            "fungal_outbreak_risk": fungal_risk,
            "risk_factors": fungal_reasons,
            "spraying_advisory": spray_advisory,
            "is_spraying_favorable": spray_favorable
        }

    @classmethod
    async def get_current_weather(
        cls, 
        lat: Optional[float] = None, 
        lon: Optional[float] = None, 
        city: Optional[str] = None
    ) -> Dict[str, Any]:
        """Fetches live weather telemetry from OpenWeatherMap."""
        api_key = settings.OPENWEATHER_API_KEY.strip()
        if not api_key:
            raise HTTPException(
                status_code=503,
                detail="OpenWeatherMap API key is not configured. Please add OPENWEATHER_API_KEY in backend/.env to access real-time agro-meteorological telemetry."
            )

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
            raise HTTPException(status_code=400, detail="Either (lat, lon) coordinates or city name must be provided.")

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(f"{cls.BASE_URL}/weather", params=params)
                if response.status_code == 401:
                    raise HTTPException(status_code=401, detail="Invalid OpenWeatherMap API key. Please check your credentials in .env.")
                elif response.status_code == 404:
                    raise HTTPException(status_code=404, detail="Location not found by weather service.")
                response.raise_for_status()
                data = response.json()
            except httpx.RequestError as exc:
                raise HTTPException(status_code=502, detail=f"Failed to communicate with OpenWeatherMap: {str(exc)}")

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
            "location": {
                "name": data.get("name"),
                "country": data.get("sys", {}).get("country"),
                "coordinates": {
                    "lat": data.get("coord", {}).get("lat"),
                    "lon": data.get("coord", {}).get("lon")
                }
            },
            "weather": {
                "temperature_c": temp_c,
                "feels_like_c": data["main"]["feels_like"],
                "temp_min_c": data["main"]["temp_min"],
                "temp_max_c": data["main"]["temp_max"],
                "humidity_percent": humidity,
                "pressure_hpa": data["main"]["pressure"],
                "wind_speed_kmh": round(wind_speed_kmh, 1),
                "condition": data["weather"][0]["main"] if data.get("weather") else "Clear",
                "description": data["weather"][0]["description"].capitalize() if data.get("weather") else "",
                "icon": data["weather"][0]["icon"] if data.get("weather") else "01d",
                "rain_1h_mm": rain_mm
            },
            "agro_advisory": agro_risk
        }
