"""Local-only virtual try-on service using the upstream FASHN VTON v1.5 model.

Install the upstream model separately; see LOCAL_VTON_SETUP.md.
This is an experimental adapter, not an official FASHN API.
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

ROOT = Path(__file__).resolve().parent
WEIGHTS_DIR = Path(os.getenv("VTON_WEIGHTS_DIR", str(ROOT / "weights"))).resolve()
MAX_INPUT_BYTES = 10 * 1024 * 1024
SUPPORTED_LAYERS = {"bottom": "bottoms", "top": "tops", "outer": "tops"}
app = FastAPI(title="FITROOM local VTON adapter")
pipeline = None
pipeline_lock = threading.Lock()

class Garment(BaseModel):
    layer: str
    image: str = Field(max_length=14_000_000)

class TryOnRequest(BaseModel):
    mannequin: str = Field(max_length=14_000_000)
    garments: list[Garment] = Field(min_length=1, max_length=3)

def _hardware_status():
    if importlib.util.find_spec("torch") is None:
        return False, "PyTorch has not been installed in the Python environment."
    import torch
    if not torch.cuda.is_available():
        if os.getenv("VTON_ALLOW_CPU") == "1":
            return True, "CPU mode enabled; rendering may be extremely slow."
        return False, "CUDA GPU unavailable. Install compatible NVIDIA PyTorch/CUDA or use another GPU machine."
    vram = torch.cuda.get_device_properties(0).total_memory / (1024 ** 3)
    if vram < 7.5 and os.getenv("VTON_ALLOW_LOW_VRAM") != "1":
        return False, f"GPU has {vram:.1f} GB VRAM; model documentation specifies about 8 GB. This GPU is unlikely to fit the model."
    return True, f"CUDA available with {vram:.1f} GB VRAM"

def _readiness():
    if importlib.util.find_spec("fashn_vton") is None:
        return False, "FASHN VTON is not installed. Follow LOCAL_VTON_SETUP.md."
    if not (WEIGHTS_DIR / "model.safetensors").is_file():
        return False, "Model weights not found. Run the upstream scripts/download_weights.py command."
    return _hardware_status()

@app.get("/health")
def health():
    ready, message = _readiness()
    return {"ready": ready, "provider": "fashn-vton-1.5", "message": message}

def _decode_image(encoded: str) -> Image.Image:
    if encoded.startswith("data:"):
        encoded = encoded.partition(",")[2]
    if len(encoded) > 14_000_000:
        raise HTTPException(status_code=413, detail="Image payload is too large.")
    try:
        raw = base64.b64decode(encoded, validate=True)
        if len(raw) > MAX_INPUT_BYTES:
            raise ValueError("oversized")
        img = Image.open(io.BytesIO(raw))
        img.load()
        if img.width * img.height > 16_000_000:
            raise ValueError("oversized dimensions")
        return img.convert("RGB")
    except (ValueError, binascii.Error, UnidentifiedImageError, OSError) as ex:
        raise HTTPException(status_code=400, detail="Invalid input image.") from ex

def _get_pipeline():
    global pipeline
    if pipeline is None:
        from fashn_vton import TryOnPipeline
        pipeline = TryOnPipeline(weights_dir=str(WEIGHTS_DIR))
    return pipeline

@app.post("/tryon")
def tryon(req: TryOnRequest):
    ready, message = _readiness()
    if not ready:
        raise HTTPException(status_code=503, detail=message)
    if len({item.layer for item in req.garments}) != len(req.garments):
        raise HTTPException(status_code=422, detail="Only one garment per layer is supported.")
    if any(item.layer not in SUPPORTED_LAYERS for item in req.garments):
        raise HTTPException(status_code=422, detail="This model supports tops, outerwear and bottoms, not hats or footwear.")
    person = _decode_image(req.mannequin)
    garments = {item.layer: _decode_image(item.image) for item in req.garments}
    # Always start from the neutral reference; removing a garment must undo it.
    # Layering quality is experimental: this is a single-garment model.
    try:
        with pipeline_lock:
            model = _get_pipeline()
            for layer in ("bottom", "top", "outer"):
                if layer not in garments:
                    continue
                output = model(
                    person_image=person,
                    garment_image=garments[layer],
                    category=SUPPORTED_LAYERS[layer],
                    garment_photo_type="flat-lay",
                    num_timesteps=25,
                )
                person = output.images[0].convert("RGB")
    except RuntimeError as ex:
        if "out of memory" in str(ex).lower():
            raise HTTPException(status_code=507, detail="Not enough GPU VRAM for this model. Approximately 8GB is recommended.") from ex
        raise HTTPException(status_code=502, detail="Local model inference failed; check the Python terminal.") from ex
    except Exception as ex:
        raise HTTPException(status_code=502, detail="Local model inference failed; check the Python terminal.") from ex

    buf = io.BytesIO()
    person.save(buf, format="PNG")
    return {"image": "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")}
