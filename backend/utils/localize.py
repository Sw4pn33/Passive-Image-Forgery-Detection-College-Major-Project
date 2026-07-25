import cv2
import numpy as np
from skimage.segmentation import slic


def localize_forgery(image_np: np.ndarray):
    copy_move_mask, cm_meta = _detect_copy_move(image_np)
    splicing_mask, sp_meta = _detect_splicing(image_np)

    if copy_move_mask.max() > splicing_mask.max():
        combined = copy_move_mask
        ftype = "copy-move"
    elif splicing_mask.max() > 0:
        combined = splicing_mask
        ftype = "splicing"
    else:
        combined = np.maximum(copy_move_mask, splicing_mask)
        ftype = "unknown"

    meta = {
        "sift_keypoints": cm_meta["keypoints"],
        "sift_matches": cm_meta["matches"],
        "slic_segments": sp_meta["segments"],
        "outlier_segments": sp_meta["outliers"],
        "copy_move_score": float(copy_move_mask.max()),
        "splicing_score": float(splicing_mask.max()),
    }

    return combined, ftype, meta


def _detect_copy_move(image_np: np.ndarray):
    gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY) if image_np.shape[2] == 3 else image_np

    sift = cv2.SIFT_create(nfeatures=500)
    keypoints, descriptors = sift.detectAndCompute(gray, None)

    mask = np.zeros(gray.shape, dtype=np.float32)
    n_kp = len(keypoints) if keypoints else 0

    if descriptors is None or n_kp < 10:
        return mask, {"keypoints": n_kp, "matches": 0}

    bf = cv2.BFMatcher(cv2.NORM_L2, crossCheck=False)
    try:
        matches = bf.knnMatch(descriptors, descriptors, k=3)
    except Exception:
        return mask, {"keypoints": n_kp, "matches": 0}

    min_dist = max(image_np.shape[:2]) * 0.05
    good_matches = 0

    for m_list in matches:
        if len(m_list) < 2:
            continue
        for m in m_list[1:]:
            if m.queryIdx == m.trainIdx:
                continue
            pt1 = np.array(keypoints[m.queryIdx].pt)
            pt2 = np.array(keypoints[m.trainIdx].pt)
            if np.linalg.norm(pt1 - pt2) > min_dist and m.distance < 120:
                x, y = int(pt2[0]), int(pt2[1])
                radius = int(keypoints[m.trainIdx].size * 3)
                cv2.circle(mask, (x, y), max(radius, 15), 1.0, -1)
                good_matches += 1

    if mask.max() > 0:
        mask = cv2.GaussianBlur(mask, (31, 31), 0)
        mask = mask / mask.max()

    return mask, {"keypoints": n_kp, "matches": good_matches}


def _detect_splicing(image_np: np.ndarray):
    h, w = image_np.shape[:2]
    n_target = 100
    segments = slic(image_np, n_segments=n_target, compactness=10, sigma=1, start_label=0)

    lab = cv2.cvtColor(image_np, cv2.COLOR_RGB2LAB).astype(np.float32)

    n_segs = segments.max() + 1
    means = np.zeros((n_segs, 3), dtype=np.float32)
    for s in range(n_segs):
        region = lab[segments == s]
        if len(region) > 0:
            means[s] = region.mean(axis=0)

    global_mean = means.mean(axis=0)
    global_std = means.std(axis=0) + 1e-6
    z_scores = np.abs((means - global_mean) / global_std).mean(axis=1)

    threshold = 2.5
    outlier_segs = np.where(z_scores > threshold)[0]

    mask = np.zeros((h, w), dtype=np.float32)
    for s in outlier_segs:
        mask[segments == s] = float(z_scores[s]) / z_scores.max()

    if mask.max() > 0:
        mask = cv2.GaussianBlur(mask, (21, 21), 0)
        mask = mask / mask.max()

    return mask, {"segments": int(n_segs), "outliers": int(len(outlier_segs))}
