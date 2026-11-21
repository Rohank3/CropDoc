from fastapi import APIRouter, Query
from typing import Optional
from app.services.weather import WeatherService

router = APIRouter(prefix="/weather", tags=["Agro-Meteorology"])

@router.get("")
async def get_crop_weather(
    lat: Optional[float] = Query(None, description="GPS Latitude"),
    lon: Optional[float] = Query(None, description="GPS Longitude"),
    city: Optional[str] = Query(None, description="City or District name")
):
    """
    Retrieves real-time agro-meteorological metrics and disease outbreak indicators from OpenWeatherMap.
    """
    return await WeatherService.get_current_weather(lat=lat, lon=lon, city=city)
