# CP Exam Seat — Frontend

Web UI for **CP Exam Seat**, the exam seat lookup of the College of Computing,
Khon Kaen University: find your exam seats, explore room seating maps, browse
exam rooms and statistics, and subscribe to your exam calendar.

This repository was split out of the monorepo
[openkku/cp-examseat](https://github.com/openkku/cp-examseat) and migrated from
Vite + React Router to **Next.js (App Router)**. Data comes from the Go API in
[openkku/cp-examseat-backend](https://github.com/openkku/cp-examseat-backend).
The monorepo itself is unchanged.

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Leaflet ·
Vitest + Testing Library. The visual design is documented in [design.md](design.md).

## How it talks to the backend

```
Browser ──► Next.js (this app)
              ├─ /, /explorer, /room, /stats   pages (App Router)
              └─ /api/*, /room/image/*         src/proxy.ts ──► BACKEND_URL (Go API)
```

The browser only calls this site's origin. [`src/proxy.ts`](src/proxy.ts)
forwards `/api/*` and `/room/image/*` to `BACKEND_URL`, read at runtime, so one
build runs in every environment, no CORS is needed and calendar subscription
links stay on the site's domain.

To call the backend directly from the browser instead, build with
`NEXT_PUBLIC_API_BASE_URL` and allow the site in the backend's `CORS_ALLOWED_ORIGINS`.

| Variable | When | Default | Purpose |
|----------|------|---------|---------|
| `BACKEND_URL` | runtime | `http://localhost:8080` | Go API the proxy forwards to |
| `NEXT_PUBLIC_API_BASE_URL` | build time | *(empty)* | Optional direct backend URL for browser requests |
| `PORT` / `HOSTNAME` | runtime | `3000` / `0.0.0.0` | Standalone server bind address (Docker) |

## Features

- **ค้นหาที่นั่ง (`/`)** — exam schedule by student ID and round, seat map
  previews, hide finished exams, search history, share link, next-exam
  banner with countdown, calendar subscription (webcal / .ics). Press `/` to
  jump to the search box.
- **สำรวจห้องสอบ (`/explorer`)** — cascading round/date/time/room filters,
  zoomable seat map colored by subject, per-seat details, student search,
  shareable URLs.
- **ห้องสอบ (`/room`)** — campus map and room photos/layouts. Titles and
  coordinates come from the backend's `metadata.json` when set, with a
  built-in fallback list.
- **สถิติ (`/stats`)** — per-round and global analytics.
- **ผู้ดูแลระบบ (`/admin`)** — sign in with the backend's `ADMIN_TOKEN`
  (kept only in the tab's session storage) to import `.xlsx`/`.pdf`/`.json`
  files, rename or delete rounds and out-of-schedule datasets, reload data,
  and take or download backups. Changes are live immediately. The page is
  not linked from the navigation and is `noindex`.
- Installable as an app (web manifest), dark mode, mobile layout.

## Project structure

```
src/
  app/            routes: layout (theme + shell), template (page transition),
                  / (student search), /explorer, /room, /stats, not-found
  views/          page-level client components (StudentSearch, RoomExplorer, RoomInfo, Stats, admin/)
                  explorer/ holds the explorer's filter hook and panels
  components/     layout, ui primitives, exam card, seat map, Leaflet room map, calendar
  hooks/          SSR-safe browser state (localStorage, theme, media query, URL hash, query string)
  lib/            API URL helpers, room locations, constants, utilities
  proxy.ts        backend forwarding (Next.js Proxy, formerly Middleware)
  types.ts        API types
```

Notes on the migration from the Vite SPA:

- Pages that read the query string (`/`, `/explorer`) render inside a
  `Suspense` boundary; `/room` and `/stats` are prerendered.
- Browser-only state (theme, search history, hide-passed filter, explorer
  display preferences) goes through `useSyncExternalStore`, so server and
  client render the same markup.
- Leaflet needs `window`, so the room map is loaded with `next/dynamic` and `ssr: false`.
- URL updates use the native History API, which Next.js syncs into `useSearchParams`.

## Security

- The proxy only forwards `/api/*` and `/room/image/*`, and refuses paths
  whose encoded dot segments (`/api/%2e%2e/...`) resolve elsewhere.
- Pages send `nosniff`, `X-Frame-Options: DENY`, a restrictive
  `Permissions-Policy` and a CSP with `frame-ancestors 'none'`, `object-src 'none'`.
- Links built from API data go through `safeExternalUrl` (http(s) or
  site-relative only), and API text is always rendered as text.
- The admin token lives in `sessionStorage` only and is sent as a bearer
  header, which browsers never attach on their own (no CSRF).
- `src/__tests__/security.test.tsx` covers the above; CI also runs
  `npm audit` on production dependencies.

## Getting started

```bash
npm ci
cp .env.example .env.local   # point BACKEND_URL at a running backend
npm run dev                  # http://localhost:3000
```

Start the backend from its own repository (`go run ./cmd/server`, port 8080).

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` | ESLint (Next.js config) |
| `npm run typecheck` | Route type generation + `tsc` |
| `npm test` | Vitest (add `-- --run` for a single run) |

### Deployment

Every push to `main` publishes `ghcr.io/openkku/cp-examseat-frontend:latest`
(plus `:sha-…`, and `:X.Y.Z` for `vX.Y.Z` tags); the backend publishes its
image the same way. Update a server with `docker compose pull && docker compose up -d`.

Put a reverse proxy (Caddy, nginx, Cloudflare…) in front of this app that
sets `X-Forwarded-For` to the real client address. The backend rate-limits
per client IP using that header, and Next.js forwards it unchanged, so
without such a proxy clients could send their own header and dodge the
limit. For example:

```
# Caddyfile — Caddy replaces client-supplied X-Forwarded-For by default
exam.example.com {
    reverse_proxy 127.0.0.1:3000
}
```

```nginx
# nginx — overwrite, don't append, the client's header
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header Host $host;
}
```

Admin uploads pass through the proxy; `experimental.proxyClientMaxBodySize`
in `next.config.ts` (25 MB) must stay above the backend's `MAX_UPLOAD_MB`.

### Docker

```bash
docker build -t cp-examseat-frontend .
docker run -p 3000:3000 -e BACKEND_URL=http://host.docker.internal:8080 cp-examseat-frontend
```

[`docker-compose.yml`](docker-compose.yml) runs the whole stack, building the
backend from a sibling checkout (`../cp-examseat-backend`, override with
`BACKEND_CONTEXT`) and mounting its `data/` directory (override with `DATA_DIR`):

```bash
git clone https://github.com/openkku/cp-examseat-backend ../cp-examseat-backend
ADMIN_TOKEN=$(openssl rand -hex 32) docker compose up -d --build   # http://localhost:3000
```

Backups land in `../cp-examseat-backend/backups` (override with `BACKUP_HOST_DIR`).

## License

MIT — see [LICENSE](LICENSE).
