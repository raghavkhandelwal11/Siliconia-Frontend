# Siliconia-Frontend

Next.js web app for the **Siliconics** prototype: every page for buyers, members, sellers,
creators, promoters and admins. Design docs and the issue tracker live in
[raghavkhandelwal11/Siliconia](https://github.com/raghavkhandelwal11/Siliconia); the API is in
[Siliconia_Backend](https://github.com/raghavkhandelwal11/Siliconia_Backend).

> **Free services only** (TRS D-20, D-24). No paid APIs, AI services or real payments.

## Run it

1. Start the backend stack in `Siliconia_Backend`: `make up` (Caddy on http://localhost:8080).
2. In this repo:

```bash
cp .env.example .env.local
npm install
npm run dev            # http://localhost:3000, or http://localhost:8080 through Caddy (same origin as the API)
```

## Develop

Use Node 26 (`.nvmrc`), the same as CI and the Docker image. If you change dependencies on another Node version, refresh the lock file with Node 26's npm so CI's `npm ci` accepts it:
`docker run --rm -v "$PWD":/app -w /app node:26-alpine npm install --package-lock-only`.

```bash
npm run check          # lint, typecheck, format check, API type drift, unit tests
npm run api:sync       # copy api/openapi.yaml from ../siliconia_backend and regenerate lib/api/schema.d.ts
npm run build          # production build (standalone output for the Docker image)
```

## Layout

```
app/
  (public)/  (auth)/  (buyer)/  (seller)/  (creator)/  (promoter)/  (admin)/   route groups (LLD 14.1)
  layout.tsx · providers.tsx · globals.css (design tokens, colour-blind safe statuses)
components/
  shell/    header, footer, TEST MODE banner, phone bottom navigation
  ui/       design system (Icon, StatusChip, …)
  system/   API status, placeholders
lib/api/    openapi.yaml (copied from the backend) · schema.d.ts (generated) · client.ts
messages/   en.json: every UI string (Hindi-ready)
i18n/       next-intl request config
```

## Rules

- One task (issue in the Siliconia repo) → one branch → one pull request; `ci-success` must pass.
- All text goes in `messages/en.json`; no hard-coded strings in components.
- Status is never shown by colour alone: use `StatusChip` (icon + text).
- The API contract comes from the backend; change it there first, then `npm run api:sync`.
