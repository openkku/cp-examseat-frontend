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

## Project structure

```
src/
  app/            routes: layout (theme + shell), template (page transition),
                  / (student search), /explorer, /room, /stats, not-found
  views/          page-level client components (StudentSearch, RoomExplorer, RoomInfo, Stats)
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
docker compose up -d --build   # http://localhost:3000
```

## License

MIT — see [LICENSE](LICENSE).
