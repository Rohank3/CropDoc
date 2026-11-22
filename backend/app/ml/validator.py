"""Stage 1: Fast Computer Vision Pre-Filter for leaf presence and blur validation (<50ms)."""

import cv2
import numpy as np
from typing import Dict, Any

BLUR_THRESHOLD = 30.0  # Laplacian variance threshold for motion blur
MIN_FOLIAGE_RATIO = 0.08  # Minimum 8% foliar / necrotic plant pigment in frame

def validate_leaf_image(image_bytes: bytes) -> Dict[str, Any]:
    """
    Validates that an uploaded photo is a clear crop leaf.
    Rejects blurry shots, completely dark/blank frames, and non-crop objects (shoes, walls, faces, vehicles).
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img_bgr is None:
        return {
            "is_valid": False,
            "is_blurry": True,
            "has_foliage": False,
            "blur_score": 0.0,
            "foliage_ratio": 0.0,
            "issue_type": "corrupted",
            "message": "Unable to read image file. Please capture or upload a valid photo.",
            "message_hi": "फोटो फाइल पढ़ी नहीं जा सकी। कृपया दोबारा फोटो खींचें।"
        }

    h, w = img_bgr.shape[:2]
    if h < 80 or w < 80:
        return {
            "is_valid": False,
            "is_blurry": False,
            "has_foliage": False,
            "blur_score": 0.0,
            "foliage_ratio": 0.0,
            "issue_type": "low_resolution",
            "message": "Image resolution is too low for accurate leaf diagnosis.",
            "message_hi": "फोटो का रिज़ॉल्यूशन बहुत कम है। कृपया साफ़ फोटो खींचें।"
        }

    # Resize to standardized dimension for uniform metric calculation (<15ms)
    scale_w = 400
    scale_h = int(h * (400.0 / w)) if w > 0 else 400
    resized_bgr = cv2.resize(img_bgr, (scale_w, scale_h), interpolation=cv2.INTER_AREA)

    # 1. Blur Detection using Laplacian Variance
    gray = cv2.cvtColor(resized_bgr, cv2.COLOR_BGR2GRAY)
    blur_score = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    is_blurry = blur_score < BLUR_THRESHOLD

    # 2. Foliage Chroma Ratio Detection in HSV
    hsv = cv2.cvtColor(resized_bgr, cv2.COLOR_BGR2HSV)
    
    # Healthy & chlorotic green/yellow foliar range: H: 22-95, S: 25-255, V: 20-255
    lower_green = np.array([22, 25, 20])
    upper_green = np.array([95, 255, 255])
    mask_green = cv2.inRange(hsv, lower_green, upper_green)

    # Necrotic / blight / brown lesion foliar range: H: 8-22, S: 35-255, V: 25-220
    lower_brown = np.array([8, 35, 25])
    upper_brown = np.array([22, 255, 220])
    mask_brown = cv2.inRange(hsv, lower_brown, upper_brown)

    total_foliage_pixels = cv2.countNonZero(cv2.bitwise_or(mask_green, mask_brown))
    total_pixels = scale_w * scale_h
    foliage_ratio = float(total_foliage_pixels) / float(total_pixels) if total_pixels > 0 else 0.0
    has_foliage = foliage_ratio >= MIN_FOLIAGE_RATIO

    # Final verdict
    if is_blurry:
        return {
            "is_valid": False,
            "is_blurry": True,
            "has_foliage": has_foliage,
            "blur_score": round(blur_score, 1),
            "foliage_ratio": round(foliage_ratio * 100, 1),
            "issue_type": "blurry",
            "message": "Photo is blurry. Please hold the phone steady and tap the screen to focus on the leaf.",
            "message_hi": "फोटो धुंधली है। कृपया फोन को स्थिर रखें और पत्ती पर टैप करके फोकस करें।"
        }

    if not has_foliage:
        return {
            "is_valid": False,
            "is_blurry": False,
            "has_foliage": False,
            "blur_score": round(blur_score, 1),
            "foliage_ratio": round(foliage_ratio * 100, 1),
            "issue_type": "non_leaf",
            "message": "No crop leaf detected in this photo. Please capture a clear view of the plant leaf.",
            "message_hi": "इस फोटो में कोई पत्ती नहीं दिखाई दे रही। कृपया फसल की पत्ती की साफ़ फोटो लें।"
        }

    return {
        "is_valid": True,
        "is_blurry": False,
        "has_foliage": True,
        "blur_score": round(blur_score, 1),
        "foliage_ratio": round(foliage_ratio * 100, 1),
        "issue_type": None,
        "message": "Valid crop leaf confirmed.",
        "message_hi": "फसल की पत्ती सत्यापित हुई।"
    }
