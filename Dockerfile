# ----------------------------
# Stage 1: Install dependencies
# ----------------------------
FROM node:26-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ----------------------------
# Stage 2: Build the Next.js app
# ----------------------------
FROM node:26-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Optional: call the backend directly from the browser (inlined at build time)
ARG NEXT_PUBLIC_API_BASE_URL=
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ----------------------------
# Stage 3: Final Production Image (standalone server)
# ----------------------------
FROM node:26-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    BACKEND_URL=http://backend:8080

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
