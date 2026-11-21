from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.diagnose import router as diagnose_router
from app.api.weather import router as weather_router
from app.ml.labels import PLANT_VILLAGE_CLASSES
import torch

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Crop disease detection, organic/chemical remediation, and agro-weather advisory for farmers.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Sub-routers
app.include_router(diagnose_router, prefix=settings.API_V1_STR)
app.include_router(weather_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "project": "CropDoc",
        "description": "Plant pathology classification & agro-meteorological advisory system",
        "docs": "/docs",
        "health": "/api/health"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "cuda_available": torch.cuda.is_available(),
        "device_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU",
        "supported_classes_count": len(PLANT_VILLAGE_CLASSES),
        "weather_service_configured": bool(settings.OPENWEATHER_API_KEY.strip()),
        "ai_advisory_configured": bool(settings.GEMINI_API_KEY.strip())
    }
