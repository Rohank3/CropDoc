from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "CropDoc Agricultural Pathology & Advisory API"
    
    # Weather & Agro-Meteorology (OpenWeatherMap)
    OPENWEATHER_API_KEY: str = Field(default="", description="OpenWeatherMap API Key")
    
    # Optional dynamic AI reasoning enrichment
    GEMINI_API_KEY: str = Field(default="", description="Google Gemini API Key for dynamic advisory")
    
    # ML Model Config
    MODEL_WEIGHTS_PATH: Optional[str] = Field(default=None, description="Path to custom fine-tuned PyTorch checkpoint (.pth)")
    DEVICE: str = Field(default="auto", description="Compute device: 'cuda', 'mps', 'cpu', or 'auto'")
    CONFIDENCE_THRESHOLD: float = Field(default=0.35, description="Minimum top-1 confidence score to accept diagnosis")
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000", "*"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
