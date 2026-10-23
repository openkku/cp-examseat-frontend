# Deploying with Docker

> To serve rounds looked up on demand from checkex (KKU VPN + scrapler), use
> [openkku/cp-examseat-deployment](https://github.com/openkku/cp-examseat-deployment)
> instead. It is a superset of this stack.

This directory runs the whole site from the images CI publishes to GHCR on
every push to `main`. Nothing needs to be built on the server.

```
Internet ─► caddy :80/:443 ─► frontend :3000 ─► backend :8080
            (HTTPS, optional)  (Next.js)          (Go API) ─► ./data
```

| File | Purpose |
|------|---------|
| `docker-compose.yml` | The stack: `caddy` (optional), `frontend`, `backend` |
| `Caddyfile` | HTTPS reverse proxy with automatic certificates |
| `.env.example` | Settings; copy to `.env` |

Requirements: Docker Engine 25+ with Compose v2. For the bundled Caddy, a
domain whose DNS points at the server and ports 80 and 443 open.

## First deployment

1. **Get the files** onto the server, e.g.

   ```bash
   git clone --depth 1 https://github.com/openkku/cp-examseat-frontend.git /opt/cp-examseat
   cd /opt/cp-examseat/deploy
   ```

   Copying just the three files above anywhere also works. `data/` and
   `backups/` are git-ignored.

2. **Allow the server to pull the images.** New GHCR packages are private.
   Either make both packages public (organization → Packages →
   `cp-examseat-frontend` / `cp-examseat-backend` → Package settings →
   Change visibility), or log in once with a personal access token that has
   the `read:packages` scope:

   ```bash
   echo "$TOKEN" | docker login ghcr.io -u <github-user> --password-stdin
   ```

3. **Configure.**

   ```bash
   cp .env.example .env
   nano .env   # set DOMAIN
   ```

4. **Add data** in `./data` (or set `DATA_DIR`): `exams.db` plus `room/`
   (`metadata.json`, `map/`, `image/`). An empty directory also works; the
   backend creates the database and you import schedules with the operator
   app (see [Managing data](#managing-data)).

   Moving from the monorepo ([openkku/cp-examseat](https://github.com/openkku/cp-examseat)):
   run `docker compose down` in its directory first (it uses the same
   `cpkku-network` bridge), then point `DATA_DIR` at its `data/`. The
   database format is unchanged.

5. **Start.**

   ```bash
   docker compose pull
   docker compose up -d
   docker compose ps                       # backend should be "healthy"
   curl -s https://$DOMAIN/api/rounds      # replace $DOMAIN
   ```

## Updating and rolling back

```bash
docker compose pull && docker compose up -d && docker image prune -f
```

Every image is also tagged `sha-<7-char commit>`. To roll back, set
`FRONTEND_TAG` or `BACKEND_TAG` in `.env` to an earlier tag and run
`docker compose up -d`. Set it back to `latest` to follow `main` again.

To pick up a newer `docker-compose.yml`, run `git pull` here first.

## Using a reverse proxy that is already on the host

Delete the `COMPOSE_PROFILES=caddy` line from `.env`. The frontend listens on
`127.0.0.1:3000` (`FRONTEND_PORT`); point the proxy there. The proxy must
**set** `X-Forwarded-For` to the client address, because the backend
rate-limits per client and Next.js passes that header through unchanged.

```nginx
server {
    server_name exam.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```
# Caddyfile on the host; Caddy sets X-Forwarded-For by itself
exam.example.com {
    reverse_proxy 127.0.0.1:3000
}
```

## Managing data

The site is read-only; there is no admin page. Import seating files, rename
or delete rounds and edit rooms with the backend's operator app, in a
terminal on the server:

```bash
docker compose exec -it backend ./operator
```

Put files to import in `data/source/` first (e.g. `scp` them over). Every
change is live within a few seconds; no restart or reload needed. For the
drag-and-drop layout editor in a browser, use the operator service of
[openkku/cp-examseat-deployment](https://github.com/openkku/cp-examseat-deployment#managing-data).

## Operations

- **Logs:** `docker compose logs -f backend` (or `frontend`, `caddy`).
- **Room files changed on disk by hand:** `touch data/.reload` (or
  `docker compose kill -s HUP backend`). No restart needed.
- **Backups:** the backend doesn't take any. Back up `data/exams.db` from
  the host instead, e.g. snapshot the disk, or run a daily cron job (safe
  while the backend runs, needs `sqlite3` on the host):

  ```bash
  sqlite3 data/exams.db ".backup 'backups/exams-$(date +%F).db'"
  find backups -name 'exams-*.db' -mtime +7 -delete   # keep a week
  ```

  Copy the files off the server regularly.
- **Restore a backup:**

  ```bash
  docker compose stop backend
  cp backups/exams-YYYY-MM-DD.db data/exams.db
  rm -f data/exams.db-wal data/exams.db-shm   # stale WAL must not replay onto the restored file
  docker compose start backend
  ```

- **Rate limiting:** 10 requests/s with bursts of 40 per client IP. If many
  students reach the site through one address (campus NAT), raise
  `RATE_LIMIT_RPS` and `RATE_LIMIT_BURST` in `.env`.
- **Network:** the compose network keeps the monorepo's IPv6 subnet
  (`d000::/112`). The backend trusts it in `TRUSTED_PROXIES` so it can read
  the client address from the frontend; update both if you change the subnet.

All backend settings are described in the backend's
[`docs/env.md`](https://github.com/openkku/cp-examseat-backend/blob/main/docs/env.md).
