# ============================================================
#  ForensicVision — XONet Training on CASIA Dataset
#  Paste this entire file into a Kaggle Notebook (Code cell)
#  Enable GPU: Settings → Accelerator → GPU T4 x2 or P100
# ============================================================

import os, csv, random
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader, random_split
import torchvision.transforms as T
import torchvision.models as models
from PIL import Image
from tqdm import tqdm

# ── Config ────────────────────────────────────────────────────
INPUT_SIZE   = (256, 256)
BATCH_SIZE   = 64          # Kaggle GPU has 16GB — can use larger batch
EPOCHS       = 40
LR           = 1e-4
SEED         = 42
MODEL_PATH   = "/kaggle/working/dcnn_forgery.pt"
CASIA_ROOT   = "/kaggle/input"

MEAN = [0.485, 0.456, 0.406]
STD  = [0.229, 0.224, 0.225]
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".tif", ".tiff", ".bmp"}

torch.manual_seed(SEED)
random.seed(SEED)
np.random.seed(SEED)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Device : {device}")
if device.type == "cuda":
    print(f"GPU    : {torch.cuda.get_device_name(0)}")
    print(f"VRAM   : {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")


# ── Dataset ───────────────────────────────────────────────────
class ForgeryDataset(Dataset):
    def __init__(self, samples, transform=None):
        self.samples   = samples
        self.transform = transform

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        path, label = self.samples[idx]
        img = Image.open(path).convert("RGB")
        if self.transform:
            img = self.transform(img)
        return img, label


def collect_samples(root):
    """Walk CASIA dirs and collect (path, label) pairs."""
    samples = []
    for dirpath, _, fnames in os.walk(root):
        dname = os.path.basename(dirpath).lower()
        if any(k in dname for k in ("au", "authentic", "original")):
            label = 0
        elif any(k in dname for k in ("tp", "sp", "fake", "forged", "tamper", "splicing")):
            label = 1
        else:
            continue
        for f in fnames:
            if os.path.splitext(f)[1].lower() in IMAGE_EXTS:
                samples.append((os.path.join(dirpath, f), label))
    return samples


samples = collect_samples(CASIA_ROOT)
random.shuffle(samples)

n       = len(samples)
n_train = int(n * 0.80)
n_val   = int(n * 0.10)
n_test  = n - n_train - n_val

train_samples = samples[:n_train]
val_samples   = samples[n_train:n_train + n_val]
test_samples  = samples[n_train + n_val:]

auth_count   = sum(1 for _, l in samples if l == 0)
forged_count = sum(1 for _, l in samples if l == 1)
print(f"Total  : {n} ({auth_count} authentic | {forged_count} forged)")
print(f"Train  : {len(train_samples)} | Val : {len(val_samples)} | Test : {len(test_samples)}")

train_tf = T.Compose([
    T.Resize(INPUT_SIZE),
    T.RandomHorizontalFlip(),
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

train_ds = ForgeryDataset(train_samples, train_tf)
val_ds   = ForgeryDataset(val_samples,   val_tf)
test_ds  = ForgeryDataset(test_samples,  val_tf)

train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True,  num_workers=4, pin_memory=True)
val_loader   = DataLoader(val_ds,   batch_size=BATCH_SIZE, shuffle=False, num_workers=4, pin_memory=True)
test_loader  = DataLoader(test_ds,  batch_size=BATCH_SIZE, shuffle=False, num_workers=4, pin_memory=True)


# ── Model (EfficientNetB0 + custom head) ──────────────────────
class XONetPretrained(nn.Module):
    def __init__(self, num_classes=2):
        super().__init__()
        backbone = models.efficientnet_b0(
            weights=models.EfficientNet_B0_Weights.IMAGENET1K_V1
        )
        self.features   = backbone.features
        self.pool       = backbone.avgpool
        in_features     = backbone.classifier[1].in_features
        self.classifier = nn.Sequential(
            nn.Dropout(0.4),
            nn.Linear(in_features, 512),
            nn.ReLU(inplace=True),
            nn.Dropout(0.3),
            nn.Linear(512, num_classes),
        )

    def forward(self, x):
        x = self.features(x)
        x = self.pool(x)
        x = torch.flatten(x, 1)
        return self.classifier(x)


model     = XONetPretrained().to(device)
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=LR)
scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
    optimizer, mode="max", patience=4, factor=0.5
)


# ── Training loop ─────────────────────────────────────────────
def evaluate(loader):
    model.eval()
    loss_sum, correct, total = 0.0, 0, 0
    with torch.no_grad():
        for imgs, labels in loader:
            imgs, labels = imgs.to(device), labels.to(device)
            out   = model(imgs)
            loss_sum += criterion(out, labels).item()
            correct  += out.argmax(1).eq(labels).sum().item()
            total    += labels.size(0)
    return loss_sum / len(loader), correct / total


best_val_acc    = 0.0
patience_count  = 0
EARLY_STOP      = 10
log_rows        = []

print("\nStarting training...\n")

for epoch in range(1, EPOCHS + 1):
    model.train()
    train_loss, correct, total = 0.0, 0, 0

    for imgs, labels in tqdm(train_loader, desc=f"Epoch {epoch:2d}/{EPOCHS}"):
        imgs, labels = imgs.to(device), labels.to(device)
        optimizer.zero_grad()
        out  = model(imgs)
        loss = criterion(out, labels)
        loss.backward()
        optimizer.step()
        train_loss += loss.item()
        correct    += out.argmax(1).eq(labels).sum().item()
        total      += labels.size(0)

    train_acc          = correct / total
    val_loss, val_acc  = evaluate(val_loader)
    lr                 = optimizer.param_groups[0]["lr"]

    print(f"Epoch {epoch:2d} | train_acc: {train_acc:.4f} | val_acc: {val_acc:.4f} | lr: {lr:.2e}")
    log_rows.append([epoch, f"{train_loss/len(train_loader):.4f}", f"{train_acc:.4f}", f"{val_loss:.4f}", f"{val_acc:.4f}"])

    scheduler.step(val_acc)

    if val_acc > best_val_acc:
        best_val_acc   = val_acc
        patience_count = 0
        torch.save(model.state_dict(), MODEL_PATH)
        print(f"         → Saved best  (val_acc = {val_acc:.4f})")
    else:
        patience_count += 1
        if patience_count >= EARLY_STOP:
            print(f"\nEarly stopping at epoch {epoch}.")
            break


# ── Save training log ─────────────────────────────────────────
with open("/kaggle/working/training_log.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["epoch", "train_loss", "train_acc", "val_loss", "val_acc"])
    w.writerows(log_rows)


# ── Final test evaluation ─────────────────────────────────────
model.load_state_dict(torch.load(MODEL_PATH, map_location=device, weights_only=True))
_, test_acc = evaluate(test_loader)

print(f"\n{'='*50}")
print(f"Best val_accuracy  : {best_val_acc:.4f}  ({best_val_acc*100:.2f}%)")
print(f"Test accuracy      : {test_acc:.4f}  ({test_acc*100:.2f}%)")
print(f"Model saved        : {MODEL_PATH}")
print("Download dcnn_forgery.pt from Kaggle Output tab.")
print("Place it at: backend/model/weights/dcnn_forgery.pt")
