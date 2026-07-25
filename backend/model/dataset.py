import os
from PIL import Image
from torch.utils.data import Dataset

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".tif", ".tiff", ".bmp"}
CLASSES = ["authentic", "forged"]


class ForgeryDataset(Dataset):
    def __init__(self, root_dir: str, transform=None):
        self.samples = []
        self.transform = transform

        for label, cls in enumerate(CLASSES):
            cls_dir = os.path.join(root_dir, cls)
            if not os.path.isdir(cls_dir):
                continue
            for fname in os.listdir(cls_dir):
                if os.path.splitext(fname)[1].lower() in IMAGE_EXTS:
                    self.samples.append((os.path.join(cls_dir, fname), label))

        if not self.samples:
            raise RuntimeError(
                f"No images found in {root_dir}. "
                "Run dataset_setup.py first to organize CASIA images."
            )

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx):
        path, label = self.samples[idx]
        img = Image.open(path).convert("RGB")
        if self.transform:
            img = self.transform(img)
        return img, label

    def class_counts(self):
        counts = {c: 0 for c in CLASSES}
        for _, label in self.samples:
            counts[CLASSES[label]] += 1
        return counts
