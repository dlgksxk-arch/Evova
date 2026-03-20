# Preview Environment

## Goal

Use a non-production frontend deployment for QA without changing the production domain or API structure.

## Frontend

- Production path remains `GitHub -> Cloudflare -> hamdeva.com`.
- Preview path should use a non-production branch or Cloudflare preview hostname such as `*.pages.dev` or `*.workers.dev`.

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
  - `/api/lemon/checkout`
  - `/api/lemon/session`

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
