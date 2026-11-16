# FITROOM — Virtual Fitting Room

Responsive Next.js shop with the same fitting-room UI, automatic garment selection, upload, thumbnails and zoom. A Cloudflare Workers AI image editing backend is in `app/api/tryon/route.ts`.

**Important:** FLUX.2 Klein is a general-purpose image editor, NOT a specialized virtual try-on model. It can invent clothes or change colors/logos. Generated concepts are labeled as **UNVERIFIED** and must be compared with original product photos. This is an experimental preview, not a verified try-on or clothing sizing tool.

## Local setup

Create `.env.local` alongside `package.json` (never share or commit it):

```dotenv
CLOUDFLARE_ACCOUNT_ID=YOUR_ACCOUNT_ID
CLOUDFLARE_API_TOKEN=YOUR_WORKERS_AI_TOKEN
CLOUDFLARE_AI_MODEL=@cf/black-forest-labs/flux-2-klein-4b
```

In Windows PowerShell:

```powershell
cd "C:\Users\hamed\Desktop\fitroom-store-auto-tryon\fitroom"
git pull origin main
npm.cmd run dev
```

Open http://localhost:3000/api/tryon . `configured:true` means credentials are **present, not necessarily valid**.

## Diagnose poor garment fidelity

1. Select only one T-shirt and compare its color, graphics and shape against the thumbnail.
2. The default model is `@cf/black-forest-labs/flux-2-klein-4b`. Try one comparison with `@cf/black-forest-labs/flux-2-klein-9b` by changing only `CLOUDFLARE_AI_MODEL` in `.env.local` and restarting Next.js; the 9B model uses much more free-tier compute and still does **not** guarantee accurate clothing transfer.
3. On Windows, refresh the browser to clear the client-side session cache after changing models. The server-side cache is separated by model and prompt version.
4. If a single garment is incorrect with both models, stop repeated generation and consider a purpose-built virtual try-on solution rather than spending the free daily quota on inaccurate images.

Cloudflare Workers AI gives a limited free daily quota, and requests stop when exceeded on the Free plan; public usage needs server-side protections and quotas.

Cloudflare docs: https://developers.cloudflare.com/workers-ai/models/flux-2-klein-4b/ .

The old experimental Python `vton-service` folder is not used by this Cloudflare integration. Checkout is still a demo, not live payments.

## Cloudflare multi-item reference image fix (November 2026)

Cloudflare FLUX.2 Klein requires each input image reference to be **smaller than 512x512 pixels**. The prior FITROOM implementation reused the full 768x1024 first-pass result as a reference for the second pass (four or five selected pieces). The server now resizes **every** reference, including generated previews, to fit within 480x480 using `sharp` before submission; final output is still generated at 768x1024. This addresses a likely input-size failure, but does **not** guarantee that Cloudflare will accept requests or preserve garment designs.

This adds an npm dependency. After pulling this commit once run `npm.cmd install` and restart the Next.js server. On subsequent code-only updates, installation is unnecessary. If a repository checkout uses `npm ci`, update/commit `package-lock.json` to match `package.json` first.

Start by trying **one garment**. If it succeeds, try two, then four. Cloudflare still has safety filters and possible service errors; do not repeatedly retry unsuccessful jobs or interpret a generated image as a faithful product fitting.
