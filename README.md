# FITROOM — local open-source AI fitting room

A Next.js clothing store with a mannequin, garment selection and product upload. The AI fitting endpoint is now configured for **FASHN VTON v1.5** through a local Python service, rather than the paid OpenAI image API.

## Quick start

```powershell
cd "C:\Users\hamed\Desktop\fitroom-store-auto-tryon\fitroom"
git pull origin main
npm.cmd run dev
```

Open http://localhost:3000. Next.js works without the model, but realistic outfit previews require a running local AI model.

**Start with [LOCAL_VTON_SETUP.md](LOCAL_VTON_SETUP.md)**. It explains VRAM checks, Python model installation, and the second local server.

## Limitations

- The model needs **about 8GB VRAM**; check your GPU before downloading weights.
- The model supports tops, bottoms and one-piece clothes. The experimental multi-garment sequence applies bottom, top and then jacket; shoes and hats are not rendered by the model yet.
- The blank display mannequin may not be recognized reliably; real-person photos are closer to the model's training data. It is not a true 3D renderer.
- This integration has not yet been tested end-to-end with GPU inference on a real machine.
- Product sample images and payments are demonstration-only.
- A local free model does not mean public production deployment is free. GPU hosting costs money; never expose this service without security, quotas and authentication.
- Keep all credentials, model weights and caches off GitHub. There is no need to create or add an `IMAGE_API_KEY` for the local model.

## Credits

[FASHN VTON v1.5](https://github.com/fashn-AI/fashn-vton-1.5), Apache-2.0. Review licenses of included dependencies (including FASHN Human Parser/NVIDIA SegFormer) before commercial use.
