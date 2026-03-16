# HAMDEVA Blueprint

## Current Production Baseline

HAMDEVA is an AI virtual try-on service where a signed-in user uploads:

1. a person or pet image
2. a clothing image

The system generates a fitted image and can optionally generate a short follow-up video.

This blueprint reflects the current repository implementation as of March 16, 2026.

## Actual Architecture

Frontend

- React 19
- Vite
- TypeScript
- Firebase Auth
- Firestore direct reads/writes for profile, board, history, shared results, and admin views

Hosting

- Firebase Hosting

Backend Source Of Truth

- Firebase Functions in `functions/src/index.ts`
- Region: `asia-northeast3`

Legacy Backend

- `server/index.js`
- legacy/local-only try-on stub
- not feature-complete for current production flows

AI / Payments

- OpenAI image editing for try-on generation
- OpenAI video generation for result video flow
- Stripe Checkout + webhook fulfillment

## Request Flow

User uploads images in the browser

Browser
↓
Firebase Hosting
↓
Hosting rewrite `/api/**`
↓
Firebase Function `api`
↓
OpenAI / Stripe / Firestore
↓
Response returned to frontend

Legacy compatibility only:

- `/generateTryOn` rewrites to Firebase Function `generateTryOn`

## Main API Paths

- `POST /api/bootstrap`
- `POST /api/tryon`
- `POST /api/classify-subject`
- `POST /api/video`
- `GET /api/video-status`
- `GET /api/video-content`
- `POST /api/stripe/checkout`
- `GET /api/stripe/session`
- `POST /api/stripe/webhook`

## Important Runtime Rules

- `POST /api/tryon` is not an anonymous smoke endpoint.
- It requires:
  - a valid Firebase ID token in `Authorization: Bearer <token>`
  - `requestId`
  - `personImage`
  - `garmentImage`
  - available user credits
- Credits are initialized through `POST /api/bootstrap` after login.

## Environment Configuration

Frontend `.env`

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FUNCTIONS_BASE_URL` for local dev proxy, or rely on local emulator target derived from `VITE_FIREBASE_PROJECT_ID`
- `VITE_KAKAO_JS_KEY` optional

Functions `functions/.env`

- `OPENAI_API_KEY`
- `OPENAI_IMAGE_MODEL`
- `OPENAI_CLASSIFICATION_MODEL`
- `OPENAI_VIDEO_MODEL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `APP_BASE_URL`

## Operational Risks To Watch

- Wrong Firebase project binding between `.firebaserc`, frontend `.env`, and deployed Functions
- Missing `OPENAI_API_KEY`
- Running Firebase Functions deploy without Blaze plan
- Mistaking `server/index.js` for the production backend
- Directly calling `/api/tryon` without auth token and credits

## Repository Focus Areas

- `src/App.tsx` remains the top-level orchestrator and is still large
- API helpers live under `src/lib/api`
- runtime hooks live under `src/hooks`
- larger page sections live under `src/features`
- source-of-truth route audit lives in `docs/api-route-audit.md`
- current architecture summary lives in `docs/current-architecture.md`
