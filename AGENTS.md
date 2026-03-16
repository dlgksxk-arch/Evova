# HAMDEVA Repository Instructions

## Deployment Source of Truth

- Frontend production deployment is **not** Firebase Hosting.
- The live site deployment path is:
  - `git push` to GitHub
  - Cloudflare automatic deploy
  - live domain `hamdeva.com`
- For frontend changes, assume `hamdeva.com` is served by Cloudflare-managed deployment output.

## Firebase Role

- Firebase Functions is the backend API layer.
- Firebase Hosting is not the primary source of truth for the production frontend.
- Do **not** assume `firebase deploy --only hosting` updates the real live site unless the user explicitly says the deployment architecture changed.

## Operational Rules

- Before any deploy action, first identify which platform is the actual production path.
- For this repository, default production verification order is:
  1. confirm pushed commit hash
  2. confirm Cloudflare auto-deploy status
  3. confirm `hamdeva.com` asset hash/version
- Do not manually run unnecessary Firebase Hosting deploys for frontend-only changes.
- If the task is only to push code for release, prefer `git push` and then verify Cloudflare deployment rather than doing manual frontend deploy commands.

## Version Verification

- If the site shows an old version string, check Cloudflare-served assets first.
- Treat mismatches between GitHub HEAD and `hamdeva.com` as a Cloudflare deployment/caching issue before touching Firebase Hosting.
