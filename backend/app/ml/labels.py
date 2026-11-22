"""CropDoc pathology taxonomy with comprehensive Indian staple & cash crops and PlantVillage classes."""

# Classical PlantVillage 38 benchmark classes
PLANT_VILLAGE_CLASSES = [
    "Apple___Apple_scab",
    "Apple___Black_rot",
    "Apple___Cedar_apple_rust",
    "Apple___healthy",
    "Blueberry___healthy",
    "Cherry_(including_sour)___Powdery_mildew",
    "Cherry_(including_sour)___healthy",
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
    "Corn_(maize)___Common_rust_",
    "Corn_(maize)___Northern_Leaf_Blight",
    "Corn_(maize)___healthy",
    "Grape___Black_rot",
    "Grape___Esca_(Black_Measles)",
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
    "Grape___healthy",
    "Orange___Haunglongbing_(Citrus_greening)",
    "Peach___Bacterial_spot",
    "Peach___healthy",
    "Pepper,_bell___Bacterial_spot",
    "Pepper,_bell___healthy",
    "Potato___Early_blight",
    "Potato___Late_blight",
    "Potato___healthy",
    "Raspberry___healthy",
    "Soybean___healthy",
    "Squash___Powdery_mildew",
    "Strawberry___Leaf_scorch",
    "Strawberry___healthy",
    "Tomato___Bacterial_spot",
    "Tomato___Early_blight",
    "Tomato___Late_blight",
    "Tomato___Leaf_Mold",
    "Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites Two-spotted_spider_mite",
    "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato___Tomato_mosaic_virus",
    "Tomato___healthy"
]

# Major Indian agricultural staple & cash crop classes
INDIAN_CROP_CLASSES = [
    "Rice___Leaf_Blast",
    "Rice___Bacterial_Blight",
    "Rice___Brown_Spot",
    "Rice___healthy",
    "Wheat___Yellow_Rust",
    "Wheat___Brown_Rust",
    "Wheat___Powdery_Mildew",
    "Wheat___healthy",
    "Cotton___Bacterial_Blight",
    "Cotton___Leaf_Curl_Virus",
    "Cotton___Bollworm_Damage",
    "Cotton___healthy",
    "Sugarcane___Red_Rot",
    "Sugarcane___Rust",
    "Sugarcane___healthy",
    "Mustard___White_Rust",
    "Mustard___Alternaria_Blight",
    "Mustard___healthy",
    "Chilli___Leaf_Curl",
    "Chilli___Anthracnose_Dieback",
    "Chilli___healthy",
    "Onion___Purple_Blotch",
    "Onion___Stemphylium_Blight",
    "Onion___healthy"
]

ALL_CROP_CLASSES = PLANT_VILLAGE_CLASSES + INDIAN_CROP_CLASSES

# Human-friendly vernacular names dictionary
INDIAN_CROP_NAMES_HI = {
    "Rice": "धान (चावल)",
    "Wheat": "गेहूँ",
    "Cotton": "कपास",
    "Sugarcane": "गन्ना",
    "Mustard": "सरसों",
    "Chilli": "हरी मिर्च",
    "Onion": "प्याज़",
    "Potato": "आलू",
    "Tomato": "टमाटर",
    "Corn": "मक्का",
    "Apple": "सेब",
    "Grape": "अंगूर",
    "Pepper, bell": "शिमला मिर्च",
    "Orange": "संतरा / किन्नू"
}

def parse_class_name(class_name: str) -> dict:
    """Parses raw class name into formatted crop, condition, and status metadata."""
    if "___" not in class_name:
        clean = class_name.replace("_", " ")
        return {
            "crop": "Unknown",
            "condition": clean,
            "is_healthy": False,
            "display_name": clean,
            "crop_hi": "फसल",
            "condition_hi": clean
        }
    
    crop_raw, condition_raw = class_name.split("___", 1)
    crop = crop_raw.replace("_", " ").replace("(maize)", "").replace("(including sour)", "").strip()
    is_healthy = condition_raw.lower() == "healthy"
    condition = "Healthy Leaf" if is_healthy else condition_raw.replace("_", " ").strip()
    crop_hi = INDIAN_CROP_NAMES_HI.get(crop, crop)
    
    return {
        "crop": crop,
        "condition": condition,
        "is_healthy": is_healthy,
        "display_name": f"{crop} - {condition}",
        "crop_hi": crop_hi,
        "condition_hi": "स्वस्थ पत्ती" if is_healthy else condition
    }
