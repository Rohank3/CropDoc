"""
CropDoc - PlantVillage Dataset Downloader
Fetches benchmark PlantVillage pathology dataset from Hugging Face and structures into class folders.
"""

import os
import sys
import argparse

def main():
    parser = argparse.ArgumentParser(description="Download PlantVillage plant pathology dataset")
    parser.add_argument("--dest", type=str, default="./data/plantvillage", help="Destination folder")
    parser.add_argument("--limit-per-class", type=int, default=150, help="Max images per class to extract for efficient local training")
    args = parser.parse_args()

    os.makedirs(args.dest, exist_ok=True)
    print(f"[CropDoc Data] Target destination: {os.path.abspath(args.dest)}")

    try:
        from datasets import load_dataset
        print("[CropDoc Data] Loading 'GVJahnavi/Plant_village_subset' from Hugging Face cache...")
        ds = load_dataset("GVJahnavi/Plant_village_subset")
        train_data = ds["train"]
        class_names = train_data.features["label"].names
        print(f"[CropDoc Data] Dataset contains {len(train_data)} images across {len(class_names)} classes.")
        
        counts = {c: 0 for c in class_names}
        saved_total = 0

        for idx, item in enumerate(train_data):
            label_idx = item["label"]
            class_name = class_names[label_idx]

            if counts[class_name] >= args.limit_per_class:
                continue

            class_dir = os.path.join(args.dest, class_name)
            os.makedirs(class_dir, exist_ok=True)
            
            img = item["image"].convert("RGB")
            img.save(os.path.join(class_dir, f"img_{counts[class_name]:04d}.jpg"))
            counts[class_name] += 1
            saved_total += 1

            if saved_total % 250 == 0:
                print(f" -> Extracted {saved_total} balanced images into class folders...")

        print(f"[CropDoc Data] Complete! Successfully extracted {saved_total} images across {len(class_names)} classes into {args.dest}")
    except Exception as e:
        print(f"[CropDoc Data Error]: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
