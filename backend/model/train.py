import os
import sys
import csv
import argparse

import torch
import torch.nn as nn
from torch.utils.data import DataLoader
import torchvision.transforms as T
from tqdm import tqdm

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import INPUT_SIZE, BATCH_SIZE, EPOCHS, LEARNING_RATE, DATASET_DIR, MODEL_PATH
from model.architecture import XONet, XONetPretrained
from model.dataset import ForgeryDataset

MEAN = [0.485, 0.456, 0.406]
STD  = [0.229, 0.224, 0.225]


def get_transforms():
    train_tf = T.Compose([
        T.Resize(INPUT_SIZE),
        T.RandomHorizontalFlip(),
        T.RandomVerticalFlip(p=0.1),
        T.RandomRotation(15),
        T.ColorJitter(brightness=0.25, contrast=0.25, saturation=0.1),
        T.ToTensor(),
        T.Normalize(MEAN, STD),
    ])
    val_tf = T.Compose([
        T.Resize(INPUT_SIZE),
        T.ToTensor(),
        T.Normalize(MEAN, STD),
    ])
    return train_tf, val_tf


def evaluate(model, loader, criterion, device):
    model.eval()
    total_loss, correct, total = 0.0, 0, 0
    with torch.no_grad():
        for imgs, labels in loader:
            imgs, labels = imgs.to(device), labels.to(device)
            out = model(imgs)
            total_loss += criterion(out, labels).item()
            correct += out.argmax(1).eq(labels).sum().item()
            total += labels.size(0)
    return total_loss / len(loader), correct / total


def train(use_pretrained: bool = False):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device : {device}")
    if device.type == "cuda":
        print(f"GPU    : {torch.cuda.get_device_name(0)}")

    train_tf, val_tf = get_transforms()

    train_ds = ForgeryDataset(os.path.join(DATASET_DIR, "train"), train_tf)
    val_ds   = ForgeryDataset(os.path.join(DATASET_DIR, "val"),   val_tf)

    print(f"Train  : {len(train_ds)} images  {train_ds.class_counts()}")
    print(f"Val    : {len(val_ds)} images  {val_ds.class_counts()}")

    train_loader = DataLoader(
        train_ds, batch_size=BATCH_SIZE, shuffle=True,
        num_workers=4, pin_memory=(device.type == "cuda")
    )
    val_loader = DataLoader(
        val_ds, batch_size=BATCH_SIZE, shuffle=False,
        num_workers=4, pin_memory=(device.type == "cuda")
    )

    model_name = "EfficientNetB0 (pretrained)" if use_pretrained else "XONet custom DCNN"
    print(f"Model  : {model_name}\n")

    model = XONetPretrained() if use_pretrained else XONet()
    model = model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=LEARNING_RATE)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode="max", patience=5, factor=0.5, verbose=True
    )

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    log_path = os.path.join(os.path.dirname(MODEL_PATH), "training_log.csv")

    with open(log_path, "w", newline="") as f:
        csv.writer(f).writerow(["epoch", "train_loss", "train_acc", "val_loss", "val_acc", "lr"])

    best_val_acc = 0.0
    patience_counter = 0
    EARLY_STOP_PATIENCE = 15

    for epoch in range(1, EPOCHS + 1):
        model.train()
        train_loss, correct, total = 0.0, 0, 0

        for imgs, labels in tqdm(train_loader, desc=f"Epoch {epoch:3d}/{EPOCHS}", leave=False):
            imgs, labels = imgs.to(device), labels.to(device)
            optimizer.zero_grad()
            out = model(imgs)
            loss = criterion(out, labels)
            loss.backward()
            optimizer.step()
            train_loss += loss.item()
            correct += out.argmax(1).eq(labels).sum().item()
            total += labels.size(0)

        train_acc = correct / total
        val_loss, val_acc = evaluate(model, val_loader, criterion, device)
        lr = optimizer.param_groups[0]["lr"]

        print(
            f"Epoch {epoch:3d} | "
            f"train_acc: {train_acc:.4f} | "
            f"val_acc: {val_acc:.4f} | "
            f"val_loss: {val_loss:.4f} | "
            f"lr: {lr:.2e}"
        )

        with open(log_path, "a", newline="") as f:
            csv.writer(f).writerow([
                epoch,
                f"{train_loss / len(train_loader):.4f}",
                f"{train_acc:.4f}",
                f"{val_loss:.4f}",
                f"{val_acc:.4f}",
                lr,
            ])

        scheduler.step(val_acc)

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            patience_counter = 0
            torch.save(model.state_dict(), MODEL_PATH)
            print(f"          → New best saved  (val_acc = {val_acc:.4f})")
        else:
            patience_counter += 1
            if patience_counter >= EARLY_STOP_PATIENCE:
                print(f"\nEarly stopping at epoch {epoch}.")
                break

    print(f"\n{'='*50}")
    print(f"Training complete.")
    print(f"Best val_accuracy : {best_val_acc:.4f}")
    print(f"Model saved to    : {MODEL_PATH}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--pretrained", action="store_true",
        help="Use EfficientNetB0 backbone (higher accuracy, recommended)"
    )
    args = parser.parse_args()
    train(use_pretrained=args.pretrained)
