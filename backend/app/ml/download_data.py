"""
CropDoc - PlantVillage Dataset Downloader
Fetches the benchmark PlantVillage crop disease dataset directly from Hugging Face or public mirrors.
"""

import os
import sys
import argparse

def main():
    parser = argparse.ArgumentParser(description="Download PlantVillage plant pathology dataset")
    parser.add_argument("--dest", type=str, default="./data/plantvillage", help="Destination folder")
    args = parser.parse_args()

    os.makedirs(args.dest, exist_ok=True)
    print(f"[CropDoc Data] Target destination: {os.path.abspath(args.dest)}")

    try:
        from datasets import load_dataset
        print("[CropDoc Data] Fetching 'mohanty/PlantVillage' via Hugging Face datasets...")
        dataset = load_dataset("mohanty/PlantVillage", split="train")
        print(f"[CropDoc Data] Successfully accessed dataset with {len(dataset)} images.")
        print("[CropDoc Data] Extracting and structuring images into class folders...")

        for idx, item in enumerate(dataset):
            img = item["image"]
            label = item["label"]
            class_name = dataset.features["label"].names[label]
            class_dir = os.path.join(args.dest, class_name)
            os.makedirs(class_dir, exist_ok=True)
            img.save(os.path.join(class_dir, f"img_{idx:05d}.jpg"))

            if (idx + 1) % 1000 == 0:
                print(f" -> Processed {idx + 1}/{len(dataset)} images...")

        print(f"[CropDoc Data] Completed! Dataset ready in {args.dest}")
    except ImportError:
        print("[Notice] 'datasets' library is not installed.")
        print("To download automatically, install: pip install datasets")
        print("Alternatively, download from Kaggle: https://www.kaggle.com/datasets/emmarex/plantdisease")
        print(f"and extract folders directly into: {os.path.abspath(args.dest)}")

if __name__ == "__main__":
    main()
