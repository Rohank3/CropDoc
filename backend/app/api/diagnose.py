from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from app.ml.model import plant_disease_model
from app.core.advisory import advisory_service
from app.services.weather import WeatherService
from app.core.config import settings

router = APIRouter(prefix="/diagnose", tags=["Diagnostics"])

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15 MB

@router.post("")
async def diagnose_crop(
    image: UploadFile = File(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    city: Optional[str] = Form(None)
):
    """
    Analyzes an uploaded leaf image, identifies plant disease using PyTorch computer vision,
    and returns verified organic & chemical remedies and optional agro-weather risk analysis.
    """
    if image.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{image.content_type}'. Please upload a valid image (JPEG, PNG, or WebP)."
        )

    image_bytes = await image.read()
    if len(image_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds the 15MB limit. Please provide a compressed image."
        )

    if len(image_bytes) == 0:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty. Please capture or upload a valid leaf photo."
        )

    # 1. Run Computer Vision Diagnostics
    try:
        prediction_result = plant_disease_model.predict(image_bytes)
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Diagnostic model failed: {str(exc)}")

    # 2. Fetch Weather Telemetry if location provided & API key available
    weather_data = None
    if settings.OPENWEATHER_API_KEY.strip() and ((latitude is not None and longitude is not None) or city):
        try:
            weather_data = await WeatherService.get_current_weather(
                lat=latitude, lon=longitude, city=city
            )
        except Exception:
            weather_data = None  # Proceed gracefully if weather endpoint fails or is unconfigured

    # 3. Retrieve Verified Agronomic Remedies & Optional AI Insight
    advisory = await advisory_service.get_enhanced_advisory(
        diagnosis=prediction_result["diagnosis"],
        weather_context=weather_data
    )

    return {
        "status": "success",
        "diagnosis": prediction_result["diagnosis"],
        "is_confident": prediction_result["is_confident"],
        "top_candidates": prediction_result["top_candidates"],
        "advisory": advisory,
        "weather_context": weather_data
    }
