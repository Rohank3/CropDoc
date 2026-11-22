from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from app.ml.model import plant_disease_model
from app.core.advisory import advisory_service
from app.services.weather import WeatherService
from app.services.gemini_agronomist import analyze_leaf_with_gemini
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
    Analyzes an uploaded leaf image via a 3-Stage Hierarchical Field Pipeline:
    - Stage 1: Fast CV Pre-filter (<50ms) for blur and foliage validation.
    - Stage 2: Deep Computer Vision classification on local fine-tuned PyTorch model.
    - Stage 3: Multimodal Gemini 2.5 Flash Vision for low confidence / complex field photos.
    Returns dynamic AI prescriptions when available, with verified CIBRC database as fallback.
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

    # 1. Run Stage 1 Validation & Stage 2 Deep Vision
    try:
        prediction_result = plant_disease_model.predict(image_bytes)
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Diagnostic model failed: {str(exc)}")

    # Check if Stage 1 rejected the image
    if prediction_result.get("stage_applied") == "stage1_rejected":
        return {
            "status": "rejected",
            "stage_applied": "stage1_rejected",
            "validation": prediction_result["validation"],
            "diagnosis": None,
            "is_confident": False,
            "top_candidates": [],
            "advisory": None,
            "weather_context": None
        }

    # 2. Fetch Weather Telemetry if location provided & API key available
    weather_data = None
    if settings.OPENWEATHER_API_KEY.strip() and ((latitude is not None and longitude is not None) or city):
        try:
            weather_data = await WeatherService.get_current_weather(
                lat=latitude, lon=longitude, city=city
            )
        except Exception:
            weather_data = None

    # 3. Dynamic Gemini Multimodal Analysis Check
    # If local vision confidence is low (< 70%) OR if GEMINI_API_KEY is configured:
    # Send image to Gemini to diagnose everything dynamically from the leaf photo!
    top_pred = prediction_result.get("diagnosis")
    local_confidence = top_pred.get("confidence_score", 0.0) if top_pred else 0.0
    needs_dynamic_gemini = (
        bool(settings.GEMINI_API_KEY.strip()) and 
        (local_confidence < (settings.CONFIDENCE_THRESHOLD * 100) or not prediction_result.get("is_confident"))
    )

    if needs_dynamic_gemini:
        gemini_result = analyze_leaf_with_gemini(image_bytes, weather_context=weather_data)
        if gemini_result and gemini_result.get("diagnosis"):
            return {
                "status": "success",
                "stage_applied": "stage3_gemini_multimodal_live",
                "validation": prediction_result["validation"],
                "diagnosis": gemini_result["diagnosis"],
                "is_confident": True,
                "top_candidates": prediction_result.get("top_candidates", []),
                "advisory": gemini_result["advisory"],
                "weather_context": weather_data,
                "is_live_ai": True
            }

    # 4. Fallback to Verified CIBRC Knowledge Base
    advisory = await advisory_service.get_enhanced_advisory(
        diagnosis=prediction_result["diagnosis"],
        weather_context=weather_data
    )

    return {
        "status": "success",
        "stage_applied": prediction_result.get("stage_applied", "stage2_cv"),
        "validation": prediction_result["validation"],
        "diagnosis": prediction_result["diagnosis"],
        "is_confident": prediction_result["is_confident"],
        "top_candidates": prediction_result["top_candidates"],
        "advisory": advisory,
        "weather_context": weather_data,
        "is_live_ai": False
    }
