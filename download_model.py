"""
Download trained model weights from Kaggle kernel output.
Run: python download_model.py
"""
import os
import shutil
import subprocess
import sys

KERNEL = "nexustest22/notebook0966c02184"
DEST_DIR = os.path.join(os.path.dirname(__file__), "backend", "model", "weights")
MODEL_FILE = os.path.join(DEST_DIR, "dcnn_forgery.pt")

os.makedirs(DEST_DIR, exist_ok=True)

if os.path.exists(MODEL_FILE):
    size_mb = os.path.getsize(MODEL_FILE) / (1024 * 1024)
    print(f"Model already present: {MODEL_FILE} ({size_mb:.1f} MB)")
    sys.exit(0)

print(f"Downloading kernel output: {KERNEL}")
tmp_dir = os.path.join(os.path.dirname(__file__), "_kaggle_tmp")
os.makedirs(tmp_dir, exist_ok=True)

result = subprocess.run(
    ["kaggle", "kernels", "output", KERNEL, "-p", tmp_dir],
    capture_output=True, text=True
)

if result.returncode != 0:
    print("Kaggle download failed:")
    print(result.stderr)
    print("\nMake sure ~/.kaggle/kaggle.json exists with your API credentials.")
    sys.exit(1)

found = None
for root, _, files in os.walk(tmp_dir):
    for f in files:
        if f.endswith(".pt"):
            found = os.path.join(root, f)
            break

if not found:
    print("No .pt file found in kernel output. Files downloaded:")
    for root, _, files in os.walk(tmp_dir):
        for f in files:
            print(" ", os.path.join(root, f))
    sys.exit(1)

shutil.copy2(found, MODEL_FILE)
shutil.rmtree(tmp_dir, ignore_errors=True)

size_mb = os.path.getsize(MODEL_FILE) / (1024 * 1024)
print(f"Model saved: {MODEL_FILE} ({size_mb:.1f} MB)")
