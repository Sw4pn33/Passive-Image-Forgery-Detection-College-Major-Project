"""
CASIA Dataset Downloader
------------------------
Downloads CASIA v1.0 + v2.0 from Kaggle and organizes into train/val/test splits.

Before running:
    1. Go to https://www.kaggle.com/settings/account
    2. Click "Create New Token" → downloads kaggle.json
    3. Move kaggle.json to: C:\\Users\\<your_username>\\.kaggle\\kaggle.json
    4. Run: python download_dataset.py
"""

import os
import sys
import shutil
import random
import zipfile
from pathlib import Path

DATASET_DIR = Path(__file__).parent / "dataset"
DOWNLOAD_DIR = Path(__file__).parent / "_downloads"

KAGGLE_DATASETS = [
    "sophatvathana/casia-dataset",
    "divg07/casia-dataset",
]

SPLITS = {"train": 0.70, "val": 0.15, "test": 0.15}
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".tif", ".tiff", ".bmp"}
RANDOM_SEED = 42


def check_kaggle():
    kaggle_json = Path.home() / ".kaggle" / "kaggle.json"
    if not kaggle_json.exists():
        print("ERROR: kaggle.json not found at:", kaggle_json)
        print()
        print("Steps to fix:")
        print("  1. Go to https://www.kaggle.com/settings/account")
        print("  2. Scroll to 'API' section → click 'Create New Token'")
        print("  3. kaggle.json will download automatically")
        print(f"  4. Move it to: {kaggle_json}")
        print("  5. Run this script again")
        sys.exit(1)


def download_from_kaggle():
    import kaggle
    DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)

    for dataset in KAGGLE_DATASETS:
        try:
            print(f"Downloading {dataset}...")
            kaggle.api.dataset_download_files(
                dataset,
                path=str(DOWNLOAD_DIR),
                unzip=True,
                quiet=False,
            )
            print(f"Downloaded {dataset} successfully.")
            return True
        except Exception as e:
            print(f"  Failed ({e}), trying next source...")

    print("ERROR: Could not download from any Kaggle source.")
    return False


def find_image_dirs(base: Path):
    """Find authentic and forged image directories anywhere under base."""
    authentic_dirs, forged_dirs = [], []

    for d in base.rglob("*"):
        if not d.is_dir():
            continue
        name = d.name.lower()
        imgs = [f for f in d.iterdir() if f.suffix.lower() in IMAGE_EXTS]
        if not imgs:
            continue
        if any(k in name for k in ("au", "authentic", "original", "real")):
            authentic_dirs.append(d)
        elif any(k in name for k in ("tp", "fake", "forged", "tamper", "manipulat")):
            forged_dirs.append(d)

    return authentic_dirs, forged_dirs


def collect_images(dirs):
    images = []
    for d in dirs:
        for f in d.iterdir():
            if f.suffix.lower() in IMAGE_EXTS:
                images.append(f)
    return images


def split_and_copy(images, class_name):
    random.shuffle(images)
    n = len(images)
    n_train = int(n * SPLITS["train"])
    n_val = int(n * SPLITS["val"])

    buckets = {
        "train": images[:n_train],
        "val":   images[n_train:n_train + n_val],
        "test":  images[n_train + n_val:],
    }
    for split, files in buckets.items():
        dest = DATASET_DIR / split / class_name
        dest.mkdir(parents=True, exist_ok=True)
        for f in files:
            shutil.copy2(f, dest / f.name)
    print(
        f"  {class_name}: {n_train} train | "
        f"{len(buckets['val'])} val | "
        f"{len(buckets['test'])} test  (total {n})"
    )


def main():
    random.seed(RANDOM_SEED)
    check_kaggle()

    if not download_from_kaggle():
        sys.exit(1)

    print("\nLocating image directories...")
    auth_dirs, forged_dirs = find_image_dirs(DOWNLOAD_DIR)

    if not auth_dirs or not forged_dirs:
        print("Could not auto-detect authentic/forged directories.")
        print("Available dirs:", [str(d) for d in DOWNLOAD_DIR.rglob("*") if d.is_dir()])
        sys.exit(1)

    auth_imgs   = collect_images(auth_dirs)
    forged_imgs = collect_images(forged_dirs)
    print(f"Found {len(auth_imgs)} authentic | {len(forged_imgs)} forged images")

    print("\nOrganizing dataset...")
    split_and_copy(auth_imgs,   "authentic")
    split_and_copy(forged_imgs, "forged")

    print(f"\nDataset ready at: {DATASET_DIR}")
    print("Run training:  cd backend && python model/train.py --pretrained")


if __name__ == "__main__":
    main()
