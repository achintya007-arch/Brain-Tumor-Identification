# ── Frontend Dockerfile ───────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps
COPY frontend/package*.json ./
RUN npm ci

# Copy source and build
COPY frontend/ .

# API URL baked in at build time
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only what next/standalone needs
COPY --from=builder --chown=appuser:appgroup /app/.next/standalone ./
COPY --from=builder --chown=appuser:appgroup /app/.next/static ./.next/static

# With this (creates dir first so it never fails):
RUN mkdir -p ./public
COPY --from=builder --chown=appuser:appgroup /app/public ./public
USER appuser

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
