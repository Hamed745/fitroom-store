# FITROOM — automatic virtual fitting room

A Next.js clothing storefront with a virtual fitting room. Visitors can select products by clicking **Try on**, upload garment photos, and build a layered outfit (top, jacket, trousers, shoes, hat).

## How to run — Windows PowerShell

```powershell
cd "C:\Users\hamed\Desktop\fitroom-store-auto-tryon\fitroom"
npm.cmd install
npm.cmd run dev
```

Open http://localhost:3000. Install dependencies again only when package dependencies change.

## AI setup (private)

Create **.env.local** alongside package.json; do not commit or share it.

```dotenv
IMAGE_API_KEY=YOUR_API_KEY_HERE
IMAGE_MODEL=gpt-image-2.5-flare
IMAGE_QUALITY=medium
```

Restart the development server after changes. Visit http://localhost:3000/api/tryon; `configured: true` **only confirms a key was loaded**, not that billing, access or generation is working.

Trying on, replacing or removing an item triggers image generation automatically after a brief debounce. Successful combinations are cached. The blank mannequin stays visible until generation succeeds; errors remain visible rather than pretending the example reflects the selected clothing.

## Known limitations

- The current `public/mannequin.png` is a simple neutral **placeholder image**. It must be replaced with a good studio mannequin photo for an actually realistic starting screen. Updating prompts by itself cannot improve the static placeholder.
- AI fitting images are approximate visual previews, not accurate clothing sizes or guaranteed product fidelity.
- AI generation requires a working API key, model access and sufficient rate/credit allowance; requests can cost money.
- Products are sample imagery and data in `public/products/` and `data/products.json`.
- Checkout is a demo, and there is no true 3D / 360-degree fitting.
- Before public launch, add user authentication, quotas, security checks and rate limiting to prevent unauthorized image-generation spending.
- Server-side .cache is local only; hosting on serverless requires persistent storage.

## GitHub workflow

For code updates made to main, run:

```powershell
git pull origin main
```

Keep `.env.local`, `node_modules`, `.next` and `.cache` off GitHub.
