from fastapi import APIRouter, Query
from typing import Optional
from app.services.mandi import MandiService

router = APIRouter(prefix="/mandi", tags=["Mandi Prices"])

@router.get("/meta")
async def get_mandi_metadata():
    """Returns available Indian states, districts mapping, and tracked crops for Mandi search."""
    return MandiService.get_metadata()

@router.get("/prices")
async def get_mandi_prices(
    state: Optional[str] = Query(None, description="State name (e.g. Maharashtra, Punjab)"),
    district: Optional[str] = Query(None, description="District name (e.g. Nashik, Ludhiana)"),
    crop: Optional[str] = Query(None, description="Crop name (e.g. Onion, Wheat, Cotton)")
):
    """Retrieves real-time/cached APMC market arrivals, modal prices (₹/Quintal), and nearby mandi comparison."""
    prices = MandiService.search_prices(state=state, district=district, crop=crop)
    return {
        "status": "success",
        "count": len(prices),
        "query": {
            "state": state,
            "district": district,
            "crop": crop
        },
        "prices": prices
    }
