# ----------------------------
# Stage 1: Install dependencies
# ----------------------------
FROM oven/bun:1.4-alpine AS deps

WORKDIR /app

COPY package.json bun.lock ./
# Cache mounts speed up local rebuilds; they never end up in the image.
RUN --mount=type=cache,target=/root/.bun/install/cache bun install --frozen-lockfile

# ----------------------------
# Stage 2: Build the Next.js app
# ----------------------------
FROM oven/bun:1.4-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Optional: call the backend directly from the browser (inlined at build time)
ARG NEXT_PUBLIC_API_BASE_URL=
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_TELEMETRY_DISABLED=1

# Next.js keeps its compile cache in .next/cache; keeping it between builds
# makes rebuilds incremental. The standalone output lives outside it.
RUN --mount=type=cache,target=/app/.next/cache bun --bun run build

# ----------------------------
# Stage 3: Final Production Image (standalone server)
# ----------------------------
FROM oven/bun:1.4-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    BACKEND_URL=http://backend:8080

COPY --from=builder --chown=bun:bun /app/.next/standalone ./
COPY --from=builder --chown=bun:bun /app/.next/static ./.next/static

# The image ships an unprivileged "bun" user.
USER bun

EXPOSE 3000

CMD ["bun", "server.js"]
