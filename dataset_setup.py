"""
Dataset Setup for CASIA Image Forgery Detection

Download sources:
    CASIA v1.0  -> https://github.com/namtpham/casia1groundtruth
    CASIA v2.0  -> http://forensics.idealtest.org/

After downloading, run:
    python dataset_setup.py --auth <path_to_authentic_folder> --forged <path_to_forged_folder>
"""

import os
import shutil
import random
import argparse
from pathlib import Path

DATASET_DIR = Path(__file__).parent / "dataset"
SPLITS = {"train": 0.70, "val": 0.15, "test": 0.15}
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".tif", ".tiff", ".bmp"}


def create_structure():
    for split in SPLITS:
        for cls in ["authentic", "forged"]:
            (DATASET_DIR / split / cls).mkdir(parents=True, exist_ok=True)
    print("Dataset folder structure ready:")
    print("  dataset/train/{authentic,forged}/")
    print("  dataset/val/{authentic,forged}/")
    print("  dataset/test/{authentic,forged}/")


def split_images(source_dir: Path, class_name: str):
    images = [f for f in source_dir.iterdir() if f.suffix.lower() in IMAGE_EXTS]
    random.shuffle(images)
    n = len(images)
    if n == 0:
        print(f"  WARNING: No images found in {source_dir}")
        return

    cut1 = int(n * SPLITS["train"])
    cut2 = cut1 + int(n * SPLITS["val"])
    buckets = {
        "train": images[:cut1],
        "val": images[cut1:cut2],
        "test": images[cut2:],
    }

    for split, files in buckets.items():
        dest = DATASET_DIR / split / class_name
        for f in files:
            shutil.copy2(f, dest / f.name)
        print(f"  {class_name}/{split}: {len(files)} images")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--auth", help="Path to authentic images folder")
    parser.add_argument("--forged", help="Path to forged images folder")
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    random.seed(args.seed)
    create_structure()

    if args.auth and args.forged:
        print("\nSplitting authentic images...")
        split_images(Path(args.auth), "authentic")
        print("Splitting forged images...")
        split_images(Path(args.forged), "forged")
        print("\nDataset ready for training.")
    else:
        print("\nNo source folders provided. Folder structure created.")
        print("Usage: python dataset_setup.py --auth ./CASIA/Au --forged ./CASIA/Tp")


if __name__ == "__main__":
    main()
