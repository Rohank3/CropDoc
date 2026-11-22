import io
import os
import json
import re
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
from typing import Dict, Any, List, Optional
from app.ml.labels import ALL_CROP_CLASSES, PLANT_VILLAGE_CLASSES, parse_class_name
from app.ml.validator import validate_leaf_image
from app.core.config import settings

class PlantDiseaseModel:
    def __init__(self):
        self.device = self._get_device()
        self.classes = ALL_CROP_CLASSES
        self.num_classes = len(self.classes)
        self.pv_classes = PLANT_VILLAGE_CLASSES
        self.model = None
        self.hf_model = None
        self.hf_processor = None
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])
        self._load_model()

    def _get_device(self) -> torch.device:
        dev_cfg = settings.DEVICE.lower()
        if dev_cfg == "cuda" and torch.cuda.is_available():
            return torch.device("cuda")
        elif dev_cfg == "mps" and hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            return torch.device("mps")
        elif dev_cfg == "cpu":
            return torch.device("cpu")
        
        # Auto detect
        if torch.cuda.is_available():
            return torch.device("cuda")
        elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            return torch.device("mps")
        return torch.device("cpu")

    def _load_model(self):
        """Initializes model with priority: 1) Local custom weights, 2) Pre-trained HF model, 3) Torchvision MobileNetV2."""
        custom_weights = settings.MODEL_WEIGHTS_PATH or os.path.join(
            os.path.dirname(__file__), "..", "..", "models", "cropdoc_mobilenetv2.pth"
        )
        if custom_weights and os.path.exists(custom_weights):
            try:
                print(f"Loading custom fine-tuned weights from {custom_weights} onto {self.device}...")
                net = models.mobilenet_v2(weights=None)
                net.classifier[1] = nn.Linear(net.classifier[1].in_features, self.num_classes)
                checkpoint = torch.load(custom_weights, map_location=self.device)
                state_dict = checkpoint["model_state_dict"] if "model_state_dict" in checkpoint else checkpoint
                net.load_state_dict(state_dict)
                net.to(self.device)
                net.eval()
                self.model = net
                return
            except Exception as e:
                print(f"Failed loading custom weights ({e}), falling back...")

        # 2. Try Hugging Face pretrained PlantVillage model
        try:
            from transformers import AutoImageProcessor, AutoModelForImageClassification
            hf_repo = "neghani/plantvillage-mobilenetv2"
            print(f"Attempting to load pre-trained vision weights from Hugging Face ({hf_repo})...")
            self.hf_processor = AutoImageProcessor.from_pretrained(hf_repo)
            self.hf_model = AutoModelForImageClassification.from_pretrained(hf_repo)
            self.hf_model.to(self.device)
            self.hf_model.eval()
            print("Successfully loaded Hugging Face PlantVillage MobileNetV2.")
            return
        except Exception as e:
            print(f"Hugging Face pre-trained loading deferred ({e}). Initializing standard PyTorch MobileNetV2 backbone...")

        # 3. Standard MobileNetV2 with transfer learning architecture
        net = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT)
        net.classifier[1] = nn.Linear(net.classifier[1].in_features, self.num_classes)
        net.to(self.device)
        net.eval()
        self.model = net
        print(f"Torchvision MobileNetV2 initialized on {self.device}.")

    def _predict_stage2(self, image: Image.Image) -> List[Dict[str, Any]]:
        """Executes Stage 2 deep computer vision classification."""
        if self.hf_model is not None and self.hf_processor is not None:
            inputs = self.hf_processor(images=image, return_tensors="pt").to(self.device)
            with torch.no_grad():
                outputs = self.hf_model(**inputs)
                logits = outputs.logits
                probs = torch.softmax(logits, dim=1)[0]
            
            top_k = min(3, len(probs))
            top_probs, top_indices = torch.topk(probs, top_k)
            id2label = getattr(self.hf_model.config, "id2label", {})
            top_candidates = []
            for p, idx in zip(top_probs, top_indices):
                label_str = id2label.get(idx.item(), self.pv_classes[idx.item()] if idx.item() < len(self.pv_classes) else f"Class_{idx.item()}")
                parsed = parse_class_name(label_str)
                top_candidates.append({
                    "raw_label": label_str,
                    "crop": parsed["crop"],
                    "condition": parsed["condition"],
                    "is_healthy": parsed["is_healthy"],
                    "display_name": parsed["display_name"],
                    "crop_hi": parsed.get("crop_hi", parsed["crop"]),
                    "condition_hi": parsed.get("condition_hi", parsed["condition"]),
                    "confidence_score": round(float(p) * 100, 2)
                })
            return top_candidates

        # PyTorch Native path
        tensor = self.transform(image).unsqueeze(0).to(self.device)
        with torch.no_grad():
            outputs = self.model(tensor)
            probs = torch.softmax(outputs, dim=1)[0]

        top_k = min(3, len(self.classes))
        top_probs, top_indices = torch.topk(probs, top_k)
        top_candidates = []
        for p, idx in zip(top_probs, top_indices):
            raw_label = self.classes[idx.item()]
            parsed = parse_class_name(raw_label)
            top_candidates.append({
                "raw_label": raw_label,
                "crop": parsed["crop"],
                "condition": parsed["condition"],
                "is_healthy": parsed["is_healthy"],
                "display_name": parsed["display_name"],
                "crop_hi": parsed.get("crop_hi", parsed["crop"]),
                "condition_hi": parsed.get("condition_hi", parsed["condition"]),
                "confidence_score": round(float(p) * 100, 2)
            })
        return top_candidates

    def _diagnose_stage3_multimodal(self, image_bytes: bytes, stage2_candidates: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Stage 3: Multimodal Agronomic Vision (Gemini 2.5 Flash) for field photos or ambiguous confidence."""
        gemini_key = settings.GEMINI_API_KEY.strip()
        if not gemini_key:
            return None

        try:
            from google import genai
            from google.genai import types
            client = genai.Client(api_key=gemini_key)

            candidate_summary = ", ".join([f"{c['raw_label']} ({c['confidence_score']}%)" for c in stage2_candidates])
            classes_str = ", ".join(self.classes)

            prompt = (
                "You are an expert plant pathologist and field agronomist specializing in Indian agriculture.\n"
                "Analyze this field photo of a crop leaf carefully.\n"
                f"Candidate classes considered by Stage 2 CV: [{candidate_summary}].\n"
                f"Available taxonomy: [{classes_str}].\n\n"
                "Determine the EXACT crop and disease. Note whether there are human hands, soil, or mixed lesions.\n"
                "Respond ONLY with a JSON object in the following format with no markdown wrappers:\n"
                "{\n"
                '  "raw_label": "One exact label from available taxonomy (e.g. Rice___Leaf_Blast)",\n'
                '  "crop": "Crop name in English",\n'
                '  "condition": "Condition/disease name",\n'
                '  "is_healthy": true/false,\n'
                '  "confidence_score": 88.5,\n'
                '  "visual_reasoning": "Brief 1-2 sentence visual description of the leaf lesion and symptoms observed."\n'
                "}"
            )

            # Determine mime type
            mime = "image/jpeg"
            if image_bytes.startswith(b"\x89PNG"):
                mime = "image/png"
            elif image_bytes.startswith(b"RIFF") and b"WEBP" in image_bytes[:16]:
                mime = "image/webp"

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type=mime),
                    prompt
                ]
            )

            if response and response.text:
                cleaned_text = response.text.strip()
                # Remove code blocks if present
                match = re.search(r"\{.*\}", cleaned_text, re.DOTALL)
                if match:
                    data = json.loads(match.group(0))
                    raw_label = data.get("raw_label", "")
                    if raw_label not in self.classes:
                        # Find closest match if needed
                        for c in self.classes:
                            if data.get("crop", "").lower() in c.lower() and data.get("condition", "").lower() in c.lower():
                                raw_label = c
                                break
                        if not raw_label:
                            raw_label = stage2_candidates[0]["raw_label"] if stage2_candidates else self.classes[0]

                    parsed = parse_class_name(raw_label)
                    return {
                        "raw_label": raw_label,
                        "crop": parsed["crop"],
                        "condition": parsed["condition"],
                        "is_healthy": parsed["is_healthy"],
                        "display_name": parsed["display_name"],
                        "crop_hi": parsed.get("crop_hi", parsed["crop"]),
                        "condition_hi": parsed.get("condition_hi", parsed["condition"]),
                        "confidence_score": float(data.get("confidence_score", 90.0)),
                        "visual_reasoning": data.get("visual_reasoning", "Diagnosed with multimodal agronomic vision.")
                    }
        except Exception as e:
            print(f"Stage 3 Multimodal fallback error ({e}). Using Stage 2 results.")
        return None

    def predict(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Runs the Hierarchical 3-Stage Field Pipeline:
        - Stage 1: Fast CV Pre-filter (<50ms) for blur and foliage validation.
        - Stage 2: Deep Computer Vision classification on 62-class taxonomy.
        - Stage 3: Multimodal Gemini 2.5 Flash Vision fallback for complex/borderline field photos.
        """
        # --- Stage 1: Validation Pre-Filter ---
        validation = validate_leaf_image(image_bytes)
        if not validation["is_valid"]:
            return {
                "stage_applied": "stage1_rejected",
                "validation": validation,
                "diagnosis": None,
                "top_candidates": [],
                "is_confident": False
            }

        # Decode PIL Image for Stage 2
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        except Exception as e:
            raise ValueError(f"Invalid image format: {str(e)}")

        # --- Stage 2: Deep Computer Vision ---
        top_candidates = self._predict_stage2(image)
        top_pred = top_candidates[0] if top_candidates else None
        stage_applied = "stage2_cv"

        # --- Stage 3: Multimodal Fallback Check ---
        # Activate Stage 3 if:
        # a) Top confidence is below threshold (< 65%), OR
        # b) Gemini API key is configured and top prediction confidence is < 85%
        needs_multimodal = (
            top_pred is None or 
            top_pred["confidence_score"] < 65.0 or 
            (bool(settings.GEMINI_API_KEY.strip()) and top_pred["confidence_score"] < 80.0)
        )

        if needs_multimodal:
            multimodal_result = self._diagnose_stage3_multimodal(image_bytes, top_candidates)
            if multimodal_result:
                top_pred = multimodal_result
                stage_applied = "stage3_multimodal"

        is_confident = (top_pred["confidence_score"] >= (settings.CONFIDENCE_THRESHOLD * 100)) if top_pred else False

        return {
            "stage_applied": stage_applied,
            "validation": validation,
            "diagnosis": top_pred,
            "top_candidates": top_candidates,
            "is_confident": is_confident
        }

# Global singleton model instance
plant_disease_model = PlantDiseaseModel()
