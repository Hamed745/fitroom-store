# FITROOM: Free open-weight AI integration (experimental)

The FITROOM UI is intentionally unchanged. The model is now **Qwen/Qwen-Image-Edit-2511**, an open-weight Apache-2.0 image editor, running in a separate local Python service. There is no OpenAI API call or image-generation subscription. The adapter tries to apply **all selected slots**: top, outer jacket, trousers, shoes and hat. It also accepts user-uploaded garment photos.

**Important distinction:** Free model weights do not provide free cloud GPU compute. This large model requires significant GPU VRAM, system RAM and disk. It is not likely to work on an RTX 3050 Laptop with 4 GB VRAM. Some quantized third-party builds may lower requirements, but the sample adapter here uses the full model and has not been tested end-to-end.

## 1. Check resources BEFORE installing

In PowerShell:

```powershell
nvidia-smi --query-gpu=name,memory.total --format=csv
```

If it says less than 8 GB, **do not download the model** to this machine using these commands. The official fp16/bf16 model is large (Hugging Face repository roughly 58 GB including multiple weight variants and assets). In practice this adapter needs substantially more than 8 GB VRAM or heavy CPU offloading with adequate RAM. A capable desktop GPU or temporary free GPU session (when offered) would be needed for a realistic test; free hosted sessions have time limits and are not reliably always available.

## 2. Install the service (on a suitable GPU machine only)

Use Windows PowerShell, Python 3.11 and your existing project directory. Create the service environment once:

```powershell
cd "C:\Users\hamed\Desktop\fitroom-store-auto-tryon\fitroom"
py -3.11 -m venv .\vton-service\.venv
.\vton-service\.venv\Scripts\python.exe -m pip install --upgrade pip
```

Install a PyTorch CUDA wheel compatible with the host's NVIDIA driver from [PyTorch official installation guide](https://pytorch.org/get-started/locally/), then install the remainder:

```powershell
.\vton-service\.venv\Scripts\python.exe -m pip install -r .\vton-service\requirements.txt
```

The adapter downloads the open model weights on first real inference from Hugging Face; no API key is required for this public model. First-time model download and memory allocation can take considerable time and storage.

## 3. Run FITROOM and the local model

Start two terminals.

Terminal A (Python service):
```powershell
cd "C:\Users\hamed\Desktop\fitroom-store-auto-tryon\fitroom\vton-service"
.\.venv\Scripts\python.exe -m uvicorn server:app --host 127.0.0.1 --port 8765
```

Terminal B (Next.js, same installed dependencies):
```powershell
cd "C:\Users\hamed\Desktop\fitroom-store-auto-tryon\fitroom"
npm.cmd run dev
```

Test:
- http://127.0.0.1:8765/health checks Python dependencies/GPU status, **not a successful image generation**.
- http://localhost:3000/api/tryon checks that Next.js can reach the Python service.
- In FITROOM click **Try on** once, then inspect both terminal windows for the actual first inference result.

## Current limitations and expectations

- The UI and product layering rules remain identical. The backend handles every selected slot and its uploaded photo.
- To keep the interface intact while working around a practical two-reference image editor, the backend re-renders selected garments **sequentially** (bottom, top, jacket, shoes, hat). Earlier items can drift or be overwritten; no exact-detail guarantee exists. For a production-grade complete outfit, later evaluation of a genuine multi-item try-on model is advisable.
- We are not claiming the local model can run on your current laptop. A 4GB GPU is not sufficient for the unquantized model in this adapter. Avoid unnecessary downloads until hardware is checked.
- The blank mannequin is a neutral reference, not a live 3D model. Image generation may not preserve 100% of brand logos or fit.
- For a publicly accessible website, a GPU server and security controls (authentication, quotas and abuse protection) will be required, and hosting normally costs money.
- Never expose Python port 8765 to the Internet, commit secrets or weights, or rely on a free demo API for production.

Official model: https://huggingface.co/Qwen/Qwen-Image-Edit-2511 .
Official implementation: https://github.com/QwenLM/Qwen-Image .
