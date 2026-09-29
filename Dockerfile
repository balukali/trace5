# TRACE//5 — container image
#
# Multi-stage build. The runtime stage runs the Next.js "standalone" server as a
# non-root user and contains no source, no dev dependencies and no flag
# authoring file.
#
#   docker build -t trace5 .
#   docker run --rm -p 3000:3000 trace5
#
# The app needs no environment variables, database or external services.

# ---- deps: install exactly what the lockfile pins -------------------------
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---- builder: produce the standalone server -------------------------------
FROM node:24-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# The digests are already committed, so the build must not need the
# plaintext authoring file that scripts/flags.json represents.
RUN npm run build

# ---- runner: minimal non-root runtime -------------------------------------
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# standalone output already contains the pruned node_modules it needs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# public/ is optional in this project; copy only when present.
RUN if [ -d /app/public ]; then \
      cp -r /app/public ./public; \
    else \
      mkdir -p ./public; \
    fi

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/',r=>process.exit(r.statusCode<400?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "server.js"]
