# ── Stage 1: Install dependencies ─────────────────────────────────────────────
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# ── Stage 2: Build the application ────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time, non-secret only. The app reads no secrets at build time, so secrets
# (AUTH_SECRET, AZURE_*, ADMIN_*) are NOT passed here — they would otherwise be
# baked into an image layer. Provide them at runtime (see docker-compose.yml).
ARG NEXTAUTH_URL

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# ── Stage 3: Production runner ─────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Runtime secrets are injected by the orchestrator (docker-compose / k8s / platform).
# AUTH_SECRET (or NEXTAUTH_SECRET) MUST be ≥32 chars in production — the app throws
# on a missing/weak secret. Required: DATAVERSE_URL, AZURE_TENANT_ID, AZURE_CLIENT_ID,
# AZURE_CLIENT_SECRET, AUTH_SECRET, NEXTAUTH_URL, ADMIN_EMAIL, ADMIN_PASSWORD.

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy only the standalone output and required static assets
COPY --from=builder /app/public                    ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
