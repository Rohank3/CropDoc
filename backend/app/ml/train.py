"""
CropDoc - Local PyTorch Model Training & Fine-Tuning Pipeline
Runs on local GPU (CUDA), Apple Silicon (MPS), or CPU with Cosine Annealing and ONNX export.
"""

import os
import sys
import argparse
import time
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, random_split
from torchvision import datasets, models, transforms

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from app.ml.labels import ALL_CROP_CLASSES

def parse_args():
    parser = argparse.ArgumentParser(description="Train CropDoc MobileNetV2 on Plant Pathology Dataset")
    parser.add_argument("--data-dir", type=str, default="./data/plantvillage", help="Root directory containing class image folders")
    parser.add_argument("--output-dir", type=str, default="./models", help="Directory where trained checkpoints will be saved")
    parser.add_argument("--epochs", type=int, default=5, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=32, help="Batch size for training")
    parser.add_argument("--lr", type=float, default=1e-3, help="Initial learning rate")
    parser.add_argument("--val-split", type=float, default=0.2, help="Fraction of data reserved for validation")
    parser.add_argument("--device", type=str, default="cuda", choices=["auto", "cuda", "mps", "cpu"], help="Training hardware accelerator")
    return parser.parse_args()

def get_device(device_arg: str) -> torch.device:
    if device_arg == "cuda" and torch.cuda.is_available():
        return torch.device("cuda")
    elif device_arg == "mps" and hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return torch.device("mps")
    elif device_arg == "cpu":
        return torch.device("cpu")
    
    if torch.cuda.is_available():
        return torch.device("cuda")
    elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")

def main():
    args = parse_args()
    device = get_device(args.device)
    print(f"[CropDoc ML] Using compute device: {device} ({torch.cuda.get_device_name(0) if device.type == 'cuda' else 'CPU'})")
    
    if not os.path.exists(args.data_dir):
        print(f"[Error] Dataset directory '{args.data_dir}' not found.")
        print("Please place PlantVillage dataset folders into './data/plantvillage' or run 'python download_data.py'.")
        return

    os.makedirs(args.output_dir, exist_ok=True)

    # 1. Image Augmentations
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.3),
        transforms.RandomRotation(degrees=15),
        transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.15),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    # 2. Dataset Loading
    full_dataset = datasets.ImageFolder(root=args.data_dir, transform=train_transform)
    total_samples = len(full_dataset)
    num_classes = len(full_dataset.classes)
    val_size = int(total_samples * args.val_split)
    train_size = total_samples - val_size

    print(f"[CropDoc ML] Loaded {total_samples} images across {num_classes} classes.")
    train_subset, val_subset = random_split(full_dataset, [train_size, val_size])

    train_loader = DataLoader(train_subset, batch_size=args.batch_size, shuffle=True, num_workers=0, pin_memory=True if device.type == "cuda" else False)
    val_loader = DataLoader(val_subset, batch_size=args.batch_size, shuffle=False, num_workers=0, pin_memory=True if device.type == "cuda" else False)

    # 3. Model Architecture (MobileNetV2 Transfer Learning)
    model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT)
    # Freeze backbone initially for fast warm-up
    for param in model.features.parameters():
        param.requires_grad = False
    
    # Replace classification head
    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Sequential(
        nn.Dropout(p=0.2),
        nn.Linear(in_features, num_classes)
    )
    model.to(device)

    criterion = nn.CrossEntropyLoss(label_smoothing=0.05)
    optimizer = torch.optim.AdamW(model.classifier.parameters(), lr=args.lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs)

    best_val_acc = 0.0
    checkpoint_path = os.path.join(args.output_dir, "cropdoc_mobilenetv2.pth")

    print("[CropDoc ML] Commencing training loop on GPU...")
    for epoch in range(1, args.epochs + 1):
        start_time = time.time()
        
        # Fine-tune entire backbone from epoch 2
        if epoch == 2:
            print("[CropDoc ML] Unfreezing full backbone for end-to-end fine-tuning...")
            for param in model.features.parameters():
                param.requires_grad = True
            optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr * 0.2, weight_decay=1e-4)

        # Training Phase
        model.train()
        train_loss = 0.0
        train_correct = 0
        total_train = 0

        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            train_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            train_correct += torch.sum(preds == labels.data).item()
            total_train += images.size(0)

        scheduler.step()
        epoch_train_loss = train_loss / total_train if total_train > 0 else 0
        epoch_train_acc = (train_correct / total_train) * 100 if total_train > 0 else 0

        # Validation Phase
        model.eval()
        val_loss = 0.0
        val_correct = 0
        total_val = 0

        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)
                val_loss += loss.item() * images.size(0)
                _, preds = torch.max(outputs, 1)
                val_correct += torch.sum(preds == labels.data).item()
                total_val += images.size(0)

        epoch_val_loss = val_loss / total_val if total_val > 0 else 0
        epoch_val_acc = (val_correct / total_val) * 100 if total_val > 0 else 0
        elapsed = time.time() - start_time

        print(
            f"Epoch {epoch:02d}/{args.epochs:02d} [{elapsed:.1f}s] - "
            f"Train Loss: {epoch_train_loss:.4f}, Train Acc: {epoch_train_acc:.2f}% | "
            f"Val Loss: {epoch_val_loss:.4f}, Val Acc: {epoch_val_acc:.2f}%"
        )

        # Save Best Model Checkpoint
        if epoch_val_acc > best_val_acc or epoch == 1:
            best_val_acc = max(best_val_acc, epoch_val_acc)
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "val_acc": best_val_acc,
                "classes": full_dataset.classes
            }, checkpoint_path)
            print(f" -> Checkpoint saved (Val Acc: {best_val_acc:.2f}%) to {checkpoint_path}")

    # Export to ONNX for production inference
    print("[CropDoc ML] Exporting best model to ONNX format...")
    onnx_path = os.path.join(args.output_dir, "cropdoc_mobilenetv2.onnx")
    dummy_input = torch.randn(1, 3, 224, 224).to(device)
    model.eval()
    try:
        torch.onnx.export(
            model, 
            dummy_input, 
            onnx_path, 
            input_names=["input"], 
            output_names=["output"],
            dynamic_axes={"input": {0: "batch_size"}, "output": {0: "batch_size"}},
            opset_version=14
        )
        print(f"[CropDoc ML] ONNX model successfully exported to {onnx_path}")
    except Exception as onnx_err:
        print(f"[CropDoc ML] ONNX export warning ({onnx_err}), PyTorch .pth checkpoint is primary.")

    print(f"\n[CropDoc ML] Training pipeline finished successfully! Best Val Accuracy: {best_val_acc:.2f}%")

if __name__ == "__main__":
    main()
