# ai.paraden.aria

End-user dashboard for the Paraden REST API. Sibling of `ai.paraden.admin`, built
from the same scaffold, but authenticated with **httpOnly session cookies** rather
than localStorage bearer tokens. It hosts its own login screen (styled to match
the marketing site) and authenticates directly against the API.

## Stack

- **React 19** + **Vite** (TypeScript)
- **Tailwind CSS v4** (`@tailwindcss/vite`)
- **shadcn/ui** (new-york style, neutral base) — components live in `src/components/ui`
- **react-router-dom** for routing
- **react-hook-form** + **zod** for forms and validation
- **sonner** for toast notifications · **lucide-react** for icons

## Core conventions

1. **Use shadcn components first** (`src/components/ui`); add with `npx shadcn@latest add <name>`.
2. **All API calls go through the service layer** (`src/services`). UI/hooks never call `fetch`.
3. **Reuse aggressively.** Shared logic → service, hook, or `src/lib` util.
4. **Read config from `src/lib/config.ts`**, never `import.meta.env` directly.
5. Path alias `@/` → `src/`.

## Auth (the important difference vs admin)

Aria has **no `tokenStorage`** — the session is a set of **httpOnly cookies** the
API sets at login; the browser carries them automatically. Login lives in aria
itself (`/login`), copied in look from the marketing site.

- **`features/auth/LoginForm` + `pages/LoginPage`** — the login screen (markup +
  scoped `features/auth/login.css` from the marketing site). Calls
  `useAuth().login(email, password)`.
- **`services/http.ts`** — `apiClient` sends `X-API-Key` on every request, uses
  `credentials: "include"` (no `Authorization` header), and adds an
  `X-CSRF-Token` header (read from the JS-readable `paraden_csrf` cookie) on
  state-changing requests. On `401` it does a single-flight `POST /api/auth/refresh`
  and retries once; if refresh fails it fires the unauthorized handler.
- **`features/auth/AuthProvider`** bootstraps the session with `GET /api/auth/me`
  and exposes `{ user, isAuthenticated, isInitializing, login, logout }` via
  `useAuth()`. `login()` posts to `/api/auth/login` then loads the profile.
- **`components/auth/ProtectedRoute`** redirects unauthenticated visitors to
  `/login`; **`PublicOnlyRoute`** keeps signed-in users off `/login`.
- **Logout** (`AppLayout` account menu) calls `POST /api/auth/logout` then routes
  to `/login`.
- **Password reset** — `/forgot-password` (ask for an address) and
  `/reset-password/:token` (choose a new password), both under `PublicOnlyRoute`.
  The reset page validates the token on mount before showing its form, then sends
  the user to `/login` with a `notice` in the navigation state, which `LoginForm`
  seeds its info line from. Setting the password ends every existing session
  server-side, so logging in again is required, not just polite.
- **`features/auth/AuthScreen`** is the shell all three unauthenticated screens
  share (nav, heading, card slot, footer). Reuse it for any new logged-out page
  rather than copying the markup.

## REST API

- Spec: `http://localhost:8000/openapi.json` (FastAPI, title `ai.paraden.api`).
- **Every** request needs a valid `X-API-Key` header (set `VITE_API_KEY`).
- Responses use the envelope `{ success, message, data }`. 422 → `data.detail`.

### User auth endpoints (`auth` tag — cookie session)

| Method | Path                | Body              | Purpose                                   |
| ------ | ------------------- | ----------------- | ----------------------------------------- |
| POST   | `/api/auth/login`   | `{ email, password }` | Authenticates; sets the session cookies   |
| POST   | `/api/auth/refresh` | — (refresh cookie) | Rotates the session                       |
| POST   | `/api/auth/logout`  | — (CSRF header)   | Revokes the refresh token, clears cookies |
| GET    | `/api/auth/me`      | —                 | Current user (session bootstrap)          |

## Adding a feature

Create `src/services/<domain>.service.ts` on `apiClient`, types in `src/types`,
UI in `src/features/<domain>`, route in `App.tsx`. Reusable helpers carried over
from admin: `hooks/useAsync`, `hooks/usePaginatedList`, `components/DataState`,
`components/PaginationFooter`, `components/ConfirmDialog`, `components/DescriptionList`,
`components/form/*`, `lib/query`, `lib/format`, `types/api.ts`.

## Commands

```bash
npm install
npm run dev      # http://localhost:5174
npm run build    # tsc -b + vite build
npm run lint
npm run preview
```

Run every app on plain `localhost` in dev (API :8000, marketing :3000, aria :5174)
so session cookies are same-site. See `README.md` for details.
