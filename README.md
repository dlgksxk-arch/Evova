# HAMDEVA

Current production baseline:

- frontend: React + Vite on Cloudflare-managed production deploy
- backend source of truth: Firebase Functions in `functions/src/index.ts`
- legacy/local-only stub: `server/index.js`
- AI/payment stack: OpenAI image + Google Veo video + Paddle + Firebase Auth/Firestore

See:

- `docs/api-route-audit.md`
- `docs/current-architecture.md`
- `docs/api-response-contract.md`

## Firebase Functions deploy notes

- Firebase Functions deploy requires the Blaze plan.
- Create `functions/.env` before deploy and set:
  - `OPENAI_API_KEY=...`
  - `OPENAI_IMAGE_MODEL=gpt-image-1`
  - `OPENAI_CLASSIFICATION_MODEL=gpt-4.1-nano`
  - `GOOGLE_VIDEO_API_KEY=...`
  - `GOOGLE_VIDEO_MODEL=veo-3.1-generate-preview`
  - `PADDLE_API_KEY=...`
  - `PADDLE_WEBHOOK_SECRET=...`
  - `PADDLE_ENV=production`
  - `PADDLE_PRICE_ID_STARTER=...`
  - `PADDLE_PRICE_ID_CREATOR=...`
  - `PADDLE_PRICE_ID_PRO=...`
  - `PADDLE_PRICE_ID_STUDIO=...`
  - `APP_BASE_URL=https://your-domain`
- Create root `.env` before frontend dev/build and set:
  - `VITE_FIREBASE_API_KEY=...`
  - `VITE_FIREBASE_AUTH_DOMAIN=...`
  - `VITE_FIREBASE_PROJECT_ID=...`
  - `VITE_FIREBASE_STORAGE_BUCKET=...`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID=...`
  - `VITE_FIREBASE_APP_ID=...`
  - `VITE_FUNCTIONS_BASE_URL=http://127.0.0.1:5001/<project-id>/asia-northeast3` for local dev, or your deployed Functions base URL
  - `VITE_API_BASE_URL=` to override frontend API calls in preview/staging deployments. Leave empty in production when `/api` is same-origin.
  - `VITE_PADDLE_CLIENT_TOKEN=...`
  - `VITE_PADDLE_ENV=production`
- Deploy Functions with:
  - `firebase deploy --only functions`
- Local verification:
  - confirm `.firebaserc` default project and root `.env` `VITE_FIREBASE_PROJECT_ID` point to the same Firebase project
  - `cd functions && npm install`
  - `cp .env.example .env` and fill in `OPENAI_API_KEY`
  - `npm run build`
  - `firebase emulators:start --only functions`
  - In another terminal run the app from the repo root with `npm run dev`
  - sign in through the frontend first so the app can call `POST /api/bootstrap` and initialize credits
  - verify `/api/tryon` through the app flow first, not as an anonymous request
  - if testing `/api/tryon` directly, include:
    - Firebase ID token in `Authorization: Bearer <token>`
    - `requestId`
    - `personImage`
    - `garmentImage`
    - a user account with available credits
  - confirm `/generateTryOn` only as a legacy compatibility route

## Preview environment

- Frontend preview should use the same GitHub -> Cloudflare deploy flow as production, but on a non-production branch / preview hostname.
- For Cloudflare preview hosts, set `VITE_API_BASE_URL` to the deployed backend origin that serves `/api/*`.
  - Example: `VITE_API_BASE_URL=https://hamdeva.dlgksxk.workers.dev`
- Firebase Functions CORS now allows preview origins on `*.pages.dev` and `*.workers.dev`.
- The frontend sets `robots=noindex,nofollow` automatically on preview hosts so preview deployments do not compete with production indexing.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
