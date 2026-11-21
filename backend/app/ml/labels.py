"""PlantVillage 38-class pathology taxonomy with metadata."""

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

def parse_class_name(class_name: str) -> dict:
    """Parses raw class name into formatted crop, condition, and status metadata."""
    if "___" not in class_name:
        return {
            "crop": "Unknown",
            "condition": class_name.replace("_", " "),
            "is_healthy": False,
            "display_name": class_name.replace("_", " ")
        }
    
    crop_raw, condition_raw = class_name.split("___", 1)
    crop = crop_raw.replace("_", " ").replace("(maize)", "").replace("(including sour)", "").strip()
    is_healthy = condition_raw.lower() == "healthy"
    condition = "Healthy Leaf" if is_healthy else condition_raw.replace("_", " ").strip()
    
    return {
        "crop": crop,
        "condition": condition,
        "is_healthy": is_healthy,
        "display_name": f"{crop} - {condition}"
    }
