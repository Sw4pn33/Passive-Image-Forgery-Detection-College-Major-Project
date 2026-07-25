import io
import base64
import torch
import numpy as np
import cv2
from PIL import Image


def generate_gradcam(pil_image: Image.Image, model, device, transform, class_idx: int) -> str:
    model.eval()
    img_tensor = transform(pil_image.convert("RGB")).unsqueeze(0).to(device)

    activations: list = []
    gradients: list = []

    def _fwd(module, inp, out):
        activations.append(out.detach().clone())

    def _bwd(module, grad_in, grad_out):
        gradients.append(grad_out[0].detach().clone())

    target = model.features[-1]
    h1 = target.register_forward_hook(_fwd)
    h2 = target.register_full_backward_hook(_bwd)

    output = model(img_tensor)
    model.zero_grad()
    output[0, class_idx].backward()

    h1.remove()
    h2.remove()

    act = activations[0]
    grad = gradients[0]
    weights = grad.mean(dim=[2, 3], keepdim=True)
    cam = (weights * act).sum(dim=1).squeeze()
    cam = torch.relu(cam).cpu().numpy()

    cam -= cam.min()
    if cam.max() > 0:
        cam /= cam.max()

    img_np = np.array(pil_image.convert("RGB"))
    h, w = img_np.shape[:2]
    cam_up = cv2.resize(cam, (w, h), interpolation=cv2.INTER_LINEAR)
    cam_uint8 = (np.clip(cam_up, 0, 1) * 255).astype(np.uint8)

    heatmap_bgr = cv2.applyColorMap(cam_uint8, cv2.COLORMAP_JET)
    heatmap_rgb = cv2.cvtColor(heatmap_bgr, cv2.COLOR_BGR2RGB)

    buf = io.BytesIO()
    Image.fromarray(heatmap_rgb).save(buf, format="JPEG", quality=90)
    return base64.b64encode(buf.getvalue()).decode("utf-8")
