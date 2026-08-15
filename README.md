# شاز — بۆ چاپ و ڕیکلام (Shaz Print)

A Kurdish print & advertising company website built with **Vue 3 + Vite + TypeScript + Tailwind CSS**, deployed as a **Cloudflare Worker** serving a static SPA with a **KV-backed visitor counter**.

## Tech Stack

- **Vue 3** (Composition API) + **GSAP** for the cinematic scene transitions
- **Vite** build tool
- **Tailwind CSS**
- **TypeScript**
- Deployed to **Cloudflare Workers** (assets + KV)

## Project Structure

```
├── index.html              # SPA entry (RTL Kurdish)
├── wrangler.toml           # Cloudflare Worker config
├── package.json
├── src/
│   ├── main.ts             # Vite/Vue bootstrap
│   ├── App.vue             # Main app (scene navigation)
│   ├── styles.css          # Global styles
│   ├── index.js            # Cloudflare Worker entry (assets + /api/count)
│   └── components/
│       ├── CircularNavigator.vue
│       ├── MusicPlayer.vue
│       └── VisitorCounter.vue   # Header visitor counter (KV-backed)
├── public/                 # Static assets (products, fonts, etc.)
└── scripts/
    └── website-texts.txt
```

## Local Development

```bash
yarn          # install dependencies
yarn dev      # Vite dev server (http://localhost:5173)
yarn build    # production build -> dist/
```

## Deployment (Cloudflare Worker)

This project deploys as a **Cloudflare Worker** that serves the built Vite app from `dist/` and exposes a visitor-counter API backed by KV.

### How it works

1. `yarn build` compiles the Vue app → `dist/`
2. `wrangler deploy` uploads the Worker (`src/index.js`) + the `dist/` assets
3. The Worker binds a **KV namespace** (`VIEW_COUNTER`) for the visitor counter

### `wrangler.toml`

```toml
name = "shaz"
main = "src/index.js"
compatibility_date = "2024-12-18"

[assets]
directory = "./dist"
binding = "ASSETS"

[[kv_namespaces]]
binding = "VIEW_COUNTER"
id = "f6e1d8688cc7447cb5495118d6d2daa6"
```

### Worker Entry (`src/index.js`)

- `GET /api/count` → increments + returns the KV-backed visitor count
- All other routes → serves static assets from `dist/`, with SPA fallback to `index.html`

### One-time setup

```bash
# Create the KV namespace (only once)
npx wrangler kv:namespace create "VIEW_COUNTER"
# ^ copy the returned `id` into wrangler.toml

# Deploy (after building)
yarn build
npx wrangler deploy
```

### Git-connected auto-deploy

The Worker is connected to GitHub (`arkan-leki/shaz`). Pushing to `main` triggers a Cloudflare build:

- **Build command:** `yarn build`
- **Deploy command:** `npx wrangler deploy`
- **Version command:** `npx wrangler versions upload`

## Visitor Counter

The header shows a live visitor count (`● N سەردان | شاز بۆ چاپ و ڕیکلام`), fetched from `GET /api/count`, persisted in Cloudflare KV (`VIEW_COUNTER` namespace).

## Notes / Gotchas

- **Use a Worker, not Pages.** This site is a Worker serving static assets (`[assets]`), not a Pages project — do **not** use `wrangler pages deploy`.
- **Don't add `public/_redirects`.** A Pages-style `/* → /index.html` redirect causes `code 100324` (infinite loop) on Workers. SPA fallback is handled in `src/index.js`.
- **Yarn version:** `package.json` pins `"packageManager": "yarn@1.22.22"` so Cloudflare uses classic Yarn (its default Yarn 4 rejects the v1-format lockfile).
- **KV binding lives in `wrangler.toml`**, which applies on `wrangler deploy` for Workers (no dashboard binding needed).

## License

© شاز — بۆ چاپ و ڕیکلام. All rights reserved.
