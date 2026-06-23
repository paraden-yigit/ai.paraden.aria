# ai.paraden.aria

End-user dashboard for the Paraden platform. A React 19 + Vite SPA that talks to
`ai.paraden.api`. It **hosts its own login** (styled to match the marketing site)
and authenticates directly against the API, which returns **httpOnly session
cookies**.

## Auth model (read this first)

- The login screen (`/login`) posts email + password to `POST /api/auth/login`.
  The API validates and replies with **httpOnly session cookies**; aria then
  loads the user via `GET /api/auth/me` and routes into the app.
- Aria's SPA can't read httpOnly cookies, so it never touches the token. Every
  request goes out with `credentials: "include"` and the API authenticates from
  the cookie. State-changing requests carry a double-submit CSRF header read from
  the JS-readable `paraden_csrf` cookie.
- On a missing/expired session, `ProtectedRoute` sends the user to `/login`. A
  `401` during a session triggers a single-flight refresh (`POST /api/auth/refresh`)
  and one retry; if that fails the user drops to logged-out.
- Invited users still set their password on the marketing site, which logs them
  in and redirects here; if that cookie handoff doesn't carry over they simply
  land on `/login`.

See `src/services/http.ts` (cookie-based client), `src/features/auth/` (login +
session bootstrap), and `src/components/auth/{ProtectedRoute,PublicOnlyRoute}.tsx`.

## Local dev

Session cookies must be **same-site** with the API. The simplest setup is to run
every app on plain `localhost` (different ports) — same host, so cookies are
same-site and shared across ports:

| App                | URL                     |
| ------------------ | ----------------------- |
| API                | `http://localhost:8000` |
| Marketing site     | `http://localhost:3000` |
| Aria (this app)    | `http://localhost:5174` |

The API sets cookies with `COOKIE_DOMAIN=` (host-only) and `COOKIE_SECURE=false`
in dev, and allows these origins in `CORS_ORIGINS` (see `ai.paraden.api/.env.example`).
In production aria + marketing are subdomains of `paraden.ai`, so the cookie uses
`COOKIE_DOMAIN=.paraden.ai` and `COOKIE_SECURE=true`.

> Don't use `*.localhost` subdomains in dev: `aria.localhost` and `api.localhost`
> are cross-site, so `SameSite=Lax` cookies wouldn't be sent on fetch.

```bash
npm install
cp .env.example .env   # fill in VITE_API_KEY
npm run dev            # http://localhost:5174
npm run build          # tsc -b + vite build
npm run lint
```

## Configuration

- `VITE_API_BASE_URL` — API base URL (dev: `http://localhost:8000`).
- `VITE_API_KEY` — app-level API key sent as `X-API-Key` (gates the whole API).
- `VITE_MARKETING_URL` — marketing site, for the login screen's site/legal links.

## Stack

React 19 · Vite · TypeScript · Tailwind v4 · shadcn/ui · react-router-dom · sonner.
Path alias `@/` → `src/`. Reusable building blocks carried over from the admin
dashboard live under `src/components`, `src/hooks`, and `src/lib`.
