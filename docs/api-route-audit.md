# API Route Audit

This document records the actual API paths used by the frontend and compares them against Firebase Hosting rewrites, Firebase Functions routes, and the legacy Express server.

## Runtime Baseline

- Frontend runtime: Firebase Hosting served Vite app.
- Primary rewrite: `/api/**` -> Firebase Function `api`.
- Legacy compatibility rewrite: `/generateTryOn` -> Firebase Function `generateTryOn`.
- Operational source of truth: Firebase Functions in [`functions/src/index.ts`](/home/user/evova/functions/src/index.ts).
- Legacy backend: [`server/index.js`](/home/user/evova/server/index.js) is not feature-complete for current production flows.

## Frontend Call Map

| Category | Frontend path | Call site | Firebase Hosting rewrite | Functions implementation | Express implementation | Current issue | Final action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Image try-on | `/api/tryon` | `callTryOn` in [`src/lib/api/hamdeva.ts`](/home/user/evova/src/lib/api/hamdeva.ts) | `api` function, normalized to `/tryon` | Yes, `handleTryOnRequest` via `api` | Yes | Works in both places, but dual backends create ambiguity | Keep frontend on `/api/tryon`; document Functions as source of truth |
| Credit bootstrap | `/api/bootstrap` | `callCreditBootstrap` in [`src/App.tsx`](/home/user/evova/src/App.tsx) | `api` function, normalized to `/bootstrap` | Yes | No | Local Express path does not exist | Keep Functions path; mark Express as legacy/incomplete |
| Subject classification | `/api/classify-subject` | `callSubjectClassifier` in [`src/App.tsx`](/home/user/evova/src/App.tsx) | `api` function, normalized to `/classify-subject` | Yes | No | Express cannot support current frontend flow | Keep Functions path; mark Express as legacy/incomplete |
| Video generation | `/api/video` | `callVideoGeneration` in [`src/App.tsx`](/home/user/evova/src/App.tsx) | `api` function, normalized to `/video` | Yes | No | Express cannot support current frontend flow | Keep Functions path; mark Express as legacy/incomplete |
| Video status | `/api/video-status` | `pollVideoGeneration` in [`src/App.tsx`](/home/user/evova/src/App.tsx) | `api` function, normalized to `/video-status` | Yes | No | Express cannot support current frontend flow | Keep Functions path; mark Express as legacy/incomplete |
| Video content | `/api/video-content` | `fetchVideoBlobUrl` in [`src/App.tsx`](/home/user/evova/src/App.tsx) | `api` function, normalized to `/video-content` | Yes | No | Express cannot support current frontend flow | Keep Functions path; mark Express as legacy/incomplete |
| Lemon checkout | `/api/lemon/checkout` | `callCreateCheckoutSession` in [`src/App.tsx`](/home/user/evova/src/App.tsx) | `api` function, normalized to `/lemon/checkout` | Yes | No | Express cannot support current frontend flow | Keep Functions path; mark Express as legacy/incomplete |
| Lemon session status | `/api/lemon/session` | `callCheckoutSessionStatus` in [`src/App.tsx`](/home/user/evova/src/App.tsx) | `api` function, normalized to `/lemon/session` | Yes | No | Express cannot support current frontend flow | Keep Functions path; mark Express as legacy/incomplete |
| Shared result fetch | Firestore direct read | `getDoc(doc(db, 'publicResults', ...))` in [`src/App.tsx`](/home/user/evova/src/App.tsx) | N/A | N/A | N/A | Not an HTTP API; still part of runtime behavior | Leave as Firestore read |
| Board CRUD | Firestore direct writes/reads | `addDoc`, `updateDoc`, `deleteDoc`, `onSnapshot` in [`src/App.tsx`](/home/user/evova/src/App.tsx) | N/A | N/A | N/A | Not routed through backend | Leave as Firestore-based behavior |
| Admin dashboard | Firestore direct reads | `getCountFromServer`, `getDocs` in [`src/App.tsx`](/home/user/evova/src/App.tsx) | N/A | N/A | N/A | Not routed through backend | Leave as Firestore-based behavior |

## Backend Route Inventory

### Firebase Functions

`api` function routes in [`functions/src/index.ts`](/home/user/evova/functions/src/index.ts):

- `POST /bootstrap`
- `GET /credits`
- `POST /classify-subject`
- `POST /lemon/checkout`
- `GET /lemon/session`
- `POST /lemon/webhook`
- `POST /video`
- `GET /video-status`
- `GET /video-content`
- `POST /tryon`
- `POST /generate`

Legacy compatibility function in [`functions/src/index.ts`](/home/user/evova/functions/src/index.ts):

- `generateTryOn` handles the direct Hosting rewrite `/generateTryOn`

### Express Legacy Server

Routes in [`server/index.js`](/home/user/evova/server/index.js):

- `GET /`
- `OPTIONS /generate`
- `OPTIONS /tryon`
- `OPTIONS /generateTryOn`
- `OPTIONS /api/tryon`
- `POST /generate`
- `POST /tryon`
- `POST /generateTryOn`
- `POST /api/tryon`

Missing from Express compared with current frontend:

- `/api/bootstrap`
- `/api/classify-subject`
- `/api/video`
- `/api/video-status`
- `/api/video-content`
- `/api/lemon/checkout`
- `/api/lemon/session`
- `/api/lemon/webhook`

## Conclusion

- Current frontend API paths already match Firebase Hosting rewrites and Firebase Functions routes.
- The major operational risk is not a broken Functions path; it is the coexistence of a partial Express server that looks production-capable but is missing most live routes.
- The repository should treat Firebase Functions as the only production backend and describe `server/index.js` as a legacy/local-only try-on stub.
