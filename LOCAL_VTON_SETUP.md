# FITROOM: free local virtual try-on (experimental)

FITROOM now has an optional **self-hosted** adapter for [FASHN VTON v1.5](https://github.com/fashn-AI/fashn-vton-1.5). The image model is open source; running it on your computer does not require an OpenAI API key or a per-image fee. Electricity, hardware and hosting are still costs.

**Caution:** The upstream model documentation specifies **about 8 GB NVIDIA VRAM**. A 4 GB RTX 3050 Laptop GPU is not a suitable target. Check your actual GPU VRAM **before downloading several gigabytes of model weights**:

```powershell
nvidia-smi --query-gpu=name,memory.total --format=csv
```

If it reports **less than 8 GB**, stop before installing the model. Use a separate machine with a suitable GPU or an available free GPU session for experiments (these are not guaranteed). The local adapter refuses to run on <7.5 GB by default; overriding this check is experimental and may produce out-of-memory failures.

## Supported

- Upper garment (top / t-shirt) and bottom (trousers)
- An outer garment (jacket) applied *after* the top. This is a sequential experimental approach; the model was trained for **one garment per invocation**, so multiple layers may not preserve all details.
- Shoes and hats are **not supported** by the upstream model. They remain selected in the UI, but are not applied to the output image. The UI reports this honestly.
- Neutral display mannequins may be less reliable than actual model photos because FASHN is optimized for person photos and pose detection.

## Install (Windows PowerShell)

Only proceed after confirming you have a suitable CUDA GPU. Use Python 3.10–3.12 (3.11 suggested). Run inside the existing FITROOM project root, where `package.json` is located:

```powershell
cd "C:\Users\hamed\Desktop\fitroom-store-auto-tryon\fitroom"
py -3.11 -m venv .\vton-service\.venv
.\vton-service\.venv\Scripts\python.exe -m pip install --upgrade pip
git clone https://github.com/fashn-AI/fashn-vton-1.5.git .\vton-service\upstream
.\vton-service\.venv\Scripts\python.exe -m pip install -e .\vton-service\upstream
.\vton-service\.venv\Scripts\python.exe -m pip install -r .\vton-service\requirements.txt
.\vton-service\.venv\Scripts\python.exe .\vton-service\upstream\scripts\download_weights.py --weights-dir .\vton-service\weights
```

The main weights are approximately **2 GB**, with other supporting files. Follow the official [PyTorch CUDA setup instructions](https://pytorch.org/get-started/locally/) if `torch.cuda.is_available()` returns false, and make sure the CUDA and ONNX Runtime GPU dependencies match your drivers. CPU mode is technically available using `VTON_ALLOW_CPU=1`, but may be impractically slow or require a lot of RAM.

## Run

Start **two terminals** in the existing project:

Terminal A, local free AI:

```powershell
cd "C:\Users\hamed\Desktop\fitroom-store-auto-tryon\fitroom\vton-service"
.\.venv\Scripts\python.exe -m uvicorn server:app --host 127.0.0.1 --port 8765
```

Test: http://127.0.0.1:8765/health should say `ready: true` when weights and GPU work.

Terminal B, Next.js:

```powershell
cd "C:\Users\hamed\Desktop\fitroom-store-auto-tryon\fitroom"
npm.cmd run dev
```

Test http://localhost:3000/api/tryon : `configured: true` means the local model service is ready (not proof an inference completed). Select a top first and allow the image to generate. Successful image combinations cache to local `.cache/`.

## Safety, privacy, and deployment

- This local service binds to `127.0.0.1` only. Do not expose it directly on the public Internet.
- Never upload model weights, personal photos, API keys or generated cache folders to GitHub.
- Remove unused `IMAGE_API_KEY` from `.env.local`; the local route does not use it.
- Vercel **cannot** connect to your laptop's `127.0.0.1`. A public deployed FITROOM needs a properly secured server with a GPU, authentication, request quotas, storage and abuse prevention. Such hosting normally costs money.
- Licensing: upstream FASHN VTON v1.5 is Apache-2.0; one required parser inherits NVIDIA's SegFormer license, so review *all dependency licenses* before commercial deployment.
- This is a development adapter. Its model-backed fitting quality, especially on our mannequin and with multiple garments, has not been validated end-to-end yet.
