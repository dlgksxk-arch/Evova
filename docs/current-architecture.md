# Current Architecture

## Frontend

- Runtime: React 19 + Vite + TypeScript.
- Main entry: [`src/main.tsx`](/home/user/evova/src/main.tsx)
- Top-level app shell: [`src/App.tsx`](/home/user/evova/src/App.tsx)
- Firebase client setup: [`src/firebase.ts`](/home/user/evova/src/firebase.ts)
- App uses Firebase Auth and Firestore directly for:
  - sign-in/sign-up
  - user profile reads
  - generation history reads
  - board CRUD
  - shared result reads
  - admin dashboard reads

## Backend Source Of Truth

- Production backend: Firebase Functions in [`functions/src/index.ts`](/home/user/evova/functions/src/index.ts)
- Region: `asia-northeast3`
- Hosting rewrite entrypoint: `api`
- Legacy compatibility entrypoint: `generateTryOn`

## Hosting Rewrite

Configured in [`firebase.json`](/home/user/evova/firebase.json):

- `/api/**` -> Firebase Function `api`
- `/generateTryOn` -> Firebase Function `generateTryOn`
- all other routes -> `/index.html`

## Main API Paths

- `POST /api/bootstrap`
- `POST /api/tryon`
- `POST /api/classify-subject`
- `POST /api/video`
- `GET /api/video-status`
- `GET /api/video-content`
- `POST /api/polar/checkout`
- `GET /api/polar/session`
- `POST /api/polar/webhook`

## Environment Variables

### Frontend (`.env`)

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FUNCTIONS_BASE_URL` (recommended for local dev proxy; otherwise Vite derives a local emulator target from `VITE_FIREBASE_PROJECT_ID`)
- `VITE_KAKAO_JS_KEY` (optional)

Frontend Firebase config now fails closed when required values are missing. It no longer falls back to a hard-coded project configuration.

### Functions (`functions/.env`)

- `OPENAI_API_KEY`
- `OPENAI_IMAGE_MODEL`
- `OPENAI_CLASSIFICATION_MODEL`
- `OPENAI_VIDEO_MODEL`
- `POLAR_API_KEY`
- `POLAR_WEBHOOK_SECRET`
- `POLAR_PRODUCT_ID_STARTER`
- `POLAR_PRODUCT_ID_CREATOR`
- `POLAR_PRODUCT_ID_PRO`
- `POLAR_PRODUCT_ID_STUDIO`
- `APP_BASE_URL`

## Legacy Elements

- [`server/index.js`](/home/user/evova/server/index.js) remains in the repository as a legacy/local-only Express try-on stub.
- It is not feature-complete for the current product and does not implement the live payment, video, bootstrap, or subject-classification flows.
- Operational changes should target Firebase Functions first.
