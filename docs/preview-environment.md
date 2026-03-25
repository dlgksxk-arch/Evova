# Preview Environment

## Goal

Use a non-production frontend deployment for QA without changing the production domain or API structure.

## Stable preview URL

- Frontend preview URL: `https://hamdeva.dlgksxk.workers.dev`
- This preview URL is for manual QA and does not replace production.
- Production remains `https://hamdeva.com`

## Frontend

- Production path remains `GitHub -> Cloudflare -> hamdeva.com`.
- Preview path should use a non-production branch or Cloudflare preview hostname such as `*.pages.dev` or `*.workers.dev`.
- In this repository, the simplest stable preview flow is the existing `workers.dev` preview origin above.

## Quick deploy

From the repository root:

```bash
npm run deploy:preview
```

This will:

1. build the frontend with `VITE_API_BASE_URL=https://hamdeva.dlgksxk.workers.dev`
2. deploy the preview worker defined by `wrangler.toml`
3. update `https://hamdeva.dlgksxk.workers.dev`

## Required frontend env

- `VITE_API_BASE_URL`

Example:

```env
VITE_API_BASE_URL=https://hamdeva.dlgksxk.workers.dev
```

If `VITE_API_BASE_URL` is empty, the frontend keeps using same-origin `/api/*`.

## API behavior

- Frontend API helpers now support a configurable base URL for:
  - `/api/bootstrap`
  - `/api/tryon`
  - `/api/classify-subject`
  - `/api/video`
  - `/api/video-status`
  - `/api/video-content`
  - `/api/polar/checkout`
  - `/api/polar/session`

## Backend preview support

Firebase Functions CORS now accepts:

- production origins in `CORS_ORIGIN`
- `localhost`
- `127.0.0.1`
- `*.pages.dev`
- `*.workers.dev`

`APP_BASE_URL` fallback also accepts preview origins from the incoming request origin.

## SEO safety

On preview hosts, the frontend injects:

- `meta[name="robots"] = noindex, nofollow, noarchive, nosnippet`

This keeps preview deployments out of search indexing.
