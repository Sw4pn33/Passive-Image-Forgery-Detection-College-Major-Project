import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

INPUT_SIZE   = (256, 256)
NUM_CLASSES  = 2
BATCH_SIZE   = 32
EPOCHS       = 50
LEARNING_RATE = 1e-4

MODEL_PATH   = os.path.join(BASE_DIR, "model", "weights", "dcnn_forgery.pt")
DATASET_DIR  = os.path.join(BASE_DIR, "..", "dataset")

CLASSES = ["authentic", "forged"]
