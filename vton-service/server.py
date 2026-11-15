"""Experimental open-weight outfit image editor for FITROOM.

Qwen Image Edit 2511 processes each selected piece using the last composed image
and a reference of the garment. This supports all five selection slots, but
fidelity across successive edits is not guaranteed. Requires a powerful GPU.
The service binds to localhost only and never calls a paid image API.
"""
import base64
import binascii
import importlib.util
import io
import os
import threading
from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from PIL import Image, UnidentifiedImageError

MODEL_ID = os.getenv("FITROOM_MODEL_ID", "Qwen/Qwen-Image-Edit-2511")
MAX_INPUT_BYTES = 10 * 1024 * 1024
MAX_PIXELS = 16_000_000
LAYER_ORDER = ("bottom", "top", "outer", "shoes", "hat")
DISPLAY_NAMES = {
    "bottom": "trousers or pants",
    "top": "shirt or T-shirt",
    "outer": "jacket or outer layer",
    "shoes": "shoes or sneakers",
    "hat": "hat or cap",
}
app = FastAPI(title="FITROOM free local multi-item image editor")
_model = None
_lock = threading.Lock()


class Garment(BaseModel):
    layer: str
    image: str = Field(max_length=14_000_000)


class TryOnRequest(BaseModel):
    mannequin: str = Field(max_length=14_000_000)
    garments: list[Garment] = Field(min_length=1, max_length=5)


def _status():
    required = ("torch", "diffusers", "transformers", "accelerate")
    missing = [name for name in required if importlib.util.find_spec(name) is None]
    if missing:
        return False, "Install local AI packages first: " + ", ".join(missing)
    import torch
    if not torch.cuda.is_available():
        return False, "No CUDA-enabled NVIDIA GPU found. Free local image editing needs a suitable GPU."
    vram = torch.cuda.get_device_properties(0).total_memory / (1024 ** 3)
    if vram < 8 and os.getenv("FITROOM_ALLOW_EXPERIMENTAL_LOW_VRAM") != "1":
        return False, (
            f"GPU has {vram:.1f} GB VRAM. This large multi-reference image model "
            "is not expected to run reliably on this GPU, even with offloading. "
            "Use a capable GPU machine to test it."
        )
    return True, (
        f"Local AI dependencies found on {vram:.1f} GB GPU. "
        "Model download/loading and successful outfit generation have not yet been verified."
    )


@app.get("/health")
def health():
    ready, message = _status()
    return {"ready": ready, "provider": "qwen-image-edit-2511-local", "message": message}


def _image(value: str) -> Image.Image:
    payload = value.partition(",")[2] if value.startswith("data:") else value
    try:
        raw = base64.b64decode(payload, validate=True)
        if len(raw) > MAX_INPUT_BYTES:
            raise ValueError("Input image is too large")
        image = Image.open(io.BytesIO(raw))
        image.load()
        if image.width * image.height > MAX_PIXELS:
            raise ValueError("Image dimensions are too large")
        return image.convert("RGB")
    except (binascii.Error, ValueError, UnidentifiedImageError, OSError) as error:
        raise HTTPException(status_code=400, detail="Could not decode one of the images.") from error


def _pipeline():
    global _model
    if _model is None:
        import torch
        from diffusers import QwenImageEditPlusPipeline
        _model = QwenImageEditPlusPipeline.from_pretrained(
            MODEL_ID, torch_dtype=torch.bfloat16
        )
        # Trades GPU memory for CPU RAM and speed. Still a large model.
        _model.enable_model_cpu_offload()
        _model.set_progress_bar_config(disable=True)
    return _model


def _prompt(layer: str, selected: list[str]) -> str:
    label = DISPLAY_NAMES[layer]
    chosen = ", ".join(selected)
    instructions = (
        "Image 1 is the existing neutral display mannequin or its latest dressed rendering. "
        "Image 2 is the reference product. Create a photorealistic full-body fashion "
        f"e-commerce studio photograph, placing the exact {label} from image 2 "
        "naturally on the mannequin in image 1. Preserve the existing mannequin's "
        "pose, shape, camera angle and pale studio background. Preserve all other "
        f"already-selected pieces ({chosen}) without changing their colors, graphics, "
        "fabrics, logos, seams or placement. Respect natural layering: a jacket "
        "goes over the shirt, trousers on legs, shoes on feet and hat on head. "
        "Do not add other garments, accessories, text, facial features or hair. "
        "Keep the whole figure in frame."
    )
    return instructions


@app.post("/tryon")
def tryon(body: TryOnRequest):
    ready, message = _status()
    if not ready:
        raise HTTPException(status_code=503, detail=message)
    if len({g.layer for g in body.garments}) != len(body.garments):
        raise HTTPException(status_code=422, detail="Only one garment per outfit slot is allowed.")
    if any(g.layer not in LAYER_ORDER for g in body.garments):
        raise HTTPException(status_code=422, detail="Unknown outfit slot.")
    person = _image(body.mannequin)
    garments = {g.layer: _image(g.image) for g in body.garments}
    already_applied = []
    try:
        import torch
        with _lock, torch.inference_mode():
            pipeline = _pipeline()
            for layer in LAYER_ORDER:
                if layer not in garments:
                    continue
                image_refs = [person, garments[layer]]
                result = pipeline(
                    image=image_refs,
                    prompt=_prompt(layer, already_applied),
                    negative_prompt=" ",
                    guidance_scale=1.0,
                    true_cfg_scale=4.0,
                    num_inference_steps=25,
                    num_images_per_prompt=1,
                )
                person = result.images[0].convert("RGB")
                already_applied.append(DISPLAY_NAMES[layer])
    except RuntimeError as error:
        if "out of memory" in str(error).lower():
            raise HTTPException(status_code=507, detail="Not enough GPU/CPU memory for this large open model.") from error
        raise HTTPException(status_code=502, detail="Local image editing failed. Check the Python terminal.") from error
    except Exception as error:
        raise HTTPException(status_code=502, detail="Local image editing failed. Check the Python terminal.") from error
    output = io.BytesIO()
    person.save(output, format="PNG")
    return {"image": "data:image/png;base64," + base64.b64encode(output.getvalue()).decode("ascii")}
