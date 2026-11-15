# FITROOM — virtual fitting room with open-weight AI

The premium Next.js storefront and its virtual fitting room retain the same features and styling: blank mannequin, automatic try-on when selecting an item, jackets over tops, trousers, shoes, hats, uploads of personal garment photos, selected-piece thumbnails, zoom and cart.

The backend now uses an **experimental local Qwen Image Edit 2511 adapter** in `vton-service/` instead of paid OpenAI API or the limited single-garment FASHN VTON backend. It can accept all five selected pieces but applies them in separate passes; composition quality and item fidelity have **not yet been verified**. Open weights are free to use under Apache-2.0; the hardware/hosting is not necessarily free.

Read **[LOCAL_VTON_SETUP.md](LOCAL_VTON_SETUP.md)** before installing any model or downloading large weights. The full model is too demanding for common 4GB laptop GPUs and will not be an always-free public API. Do not download it on unsuitable hardware.

## Local Next.js UI

```powershell
cd "C:\Users\hamed\Desktop\fitroom-store-auto-tryon\fitroom"
git pull origin main
npm.cmd run dev
```

The UI works without the AI service; realistic image updates require a successfully running image-editing backend. A missing local service results in a clear status notice, not a silent fake update.

No OpenAI `IMAGE_API_KEY` is needed. Keep any old `.env.local` credentials private or remove the unused key from your local file. Never commit secrets to GitHub.

### For production

Protect AI compute behind authentication, quotas and rate limits; add persistent caches. Checkout remains demo-only. Generated image previews do not certify garment sizing or fit.
