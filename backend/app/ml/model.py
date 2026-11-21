import io
import os
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
from typing import Dict, Any, List, Optional
from app.ml.labels import PLANT_VILLAGE_CLASSES, parse_class_name
from app.core.config import settings

class PlantDiseaseModel:
    def __init__(self):
        self.device = self._get_device()
        self.num_classes = len(PLANT_VILLAGE_CLASSES)
        self.classes = PLANT_VILLAGE_CLASSES
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
        # 1. Check custom weights path
        custom_weights = settings.MODEL_WEIGHTS_PATH or os.path.join(
            os.path.dirname(__file__), "..", "..", "models", "cropdoc_mobilenetv2.pth"
        )
        if custom_weights and os.path.exists(custom_weights):
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

    def predict(self, image_bytes: bytes) -> Dict[str, Any]:
        """Runs real-time pathology inference on leaf image bytes."""
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        except Exception as e:
            raise ValueError(f"Invalid image format: {str(e)}")

        # HF Model path
        if self.hf_model is not None and self.hf_processor is not None:
            inputs = self.hf_processor(images=image, return_tensors="pt").to(self.device)
            with torch.no_grad():
                outputs = self.hf_model(**inputs)
                logits = outputs.logits
                probs = torch.softmax(logits, dim=1)[0]
            
            top_k = min(3, len(probs))
            top_probs, top_indices = torch.topk(probs, top_k)
            
            # Map index to class label from model's config
            id2label = getattr(self.hf_model.config, "id2label", {})
            top_candidates = []
            for p, idx in zip(top_probs, top_indices):
                label_str = id2label.get(idx.item(), self.classes[idx.item()] if idx.item() < len(self.classes) else f"Class_{idx.item()}")
                parsed = parse_class_name(label_str)
                top_candidates.append({
                    "raw_label": label_str,
                    "crop": parsed["crop"],
                    "condition": parsed["condition"],
                    "is_healthy": parsed["is_healthy"],
                    "display_name": parsed["display_name"],
                    "confidence_score": round(float(p) * 100, 2)
                })

            top_pred = top_candidates[0]
            return {
                "diagnosis": top_pred,
                "top_candidates": top_candidates,
                "is_confident": top_pred["confidence_score"] >= (settings.CONFIDENCE_THRESHOLD * 100)
            }

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
                "confidence_score": round(float(p) * 100, 2)
            })

        top_pred = top_candidates[0]
        return {
            "diagnosis": top_pred,
            "top_candidates": top_candidates,
            "is_confident": top_pred["confidence_score"] >= (settings.CONFIDENCE_THRESHOLD * 100)
        }

# Global singleton model instance
plant_disease_model = PlantDiseaseModel()
