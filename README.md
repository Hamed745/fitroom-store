# FITROOM – redesigned storefront (v2)

Premium responsive clothing store, with real-looking **sample AI-generated** product assets, outfit selection, customer garment upload, and an optional server-side image generation endpoint.

## Windows
1. Extract this archive and open the `fitroom` folder.
2. Run `npm.cmd install` and `npm.cmd run dev` in PowerShell.
3. Open http://localhost:3000.
4. To activate AI fitting, copy `.env.example` to `.env.local` and set `IMAGE_API_KEY` to your own API key; restart the dev server.
5. The studio will display `AI key detected on the server` after restart. This confirms only that the key was loaded; its validity is checked on generation.
6. Press **Try on** for a few items, then explicitly press **Generate realistic look**. Requests can incur API charges. Without a key, the fitting room shows a labeled *demo look* and your selected thumbnails, rather than pretending the demo matches your actual selections.

## Features and limitations
- Product photographs and initial dressed mannequin are **AI-generated sample images**, not photos of real inventory. Replace them before selling real items.
- Edited outfit images are generated on request and cached locally by outfit combination in `.cache/` and the page session. For public deployment, replace disk storage with durable object storage and add sign-in, quotas, validation, moderation, and abuse/rate-limit protections before allowing public use. Avoid exposing a server with unrestricted paid image-generation calls.
- Payment and checkout are demos, not live charging. No 360° or true 3D simulation is implemented. AI try-on is an approximate image rendering, not size/fit prediction.
- Select product pictures in `public/products/` and descriptions, pricing in `data/products.json`.
- Brand details are in `data/site.ts`; the theme is in `app/globals.css`.

## Notes
Image model choice, image-editing support, organization access, pricing, and supported parameters depend on your API account. Check current API docs before changing the model. Never paste your key into the chat, GitHub, or frontend files.

## Updated image API settings (November 2026)
The previous image model `gpt-image-1` is retired; this build uses `gpt-image-2.5-flare` and removes the obsolete `input_fidelity` parameter. Set `IMAGE_MODEL=gpt-image-2.5-sunburst` to compare precision. If the first image request fails, read the user-facing error and inspect the `[tryon]` line in your local server terminal. A key alone may not be sufficient: the account also needs API model access and applicable usage credit.

Never send screenshots of your secret key or paste it into chat. A ChatGPT subscription and API billing are separate. Keep deployment private until authentication and rate limits are added.
