# syntax=docker/dockerfile:1
# Web (Next.js 16, App Router) — imagen multi-stage, monorepo-aware.
# El contexto de build es la RAÍZ del monorepo:
#   docker build -f apps/web/Dockerfile -t urnight-web .
#
# NOTA: las vars NEXT_PUBLIC_* se hornean en `next build` → la imagen resultante
# es POR ENTORNO. Para un deploy real pásalas como build args:
#   --build-arg NEXT_PUBLIC_API_URL=https://api.example.com \
#   --build-arg NEXT_PUBLIC_STORAGE_URL=https://xxxx.cloudfront.net \
#   --build-arg NEXT_PUBLIC_GOOGLE_MAPS_KEY=...
# Sin args se usan defaults de dev (build de verificación en CI).

FROM node:22-alpine AS base
# libc6-compat: algunos binarios de Next/SWC lo necesitan en Alpine.
RUN apk add --no-cache libc6-compat && corepack enable
WORKDIR /repo

# ── build ──
FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
# NEXT_PUBLIC_* se leen en build-time; defaults = dev/CI (build de verificación).
# NEXT_PUBLIC_STORAGE_URL debe ser URL válida: next.config.ts hace new URL() sobre ella.
ARG NEXT_PUBLIC_API_URL=http://localhost:3101
ARG NEXT_PUBLIC_STORAGE_URL=http://localhost:4566
ARG NEXT_PUBLIC_GOOGLE_MAPS_KEY=""
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_STORAGE_URL=$NEXT_PUBLIC_STORAGE_URL \
    NEXT_PUBLIC_GOOGLE_MAPS_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_KEY
# @urnight/ui lo transpila Next directamente; sólo se compila @urnight/contracts.
RUN pnpm --filter @urnight/contracts build \
 && pnpm --filter @urnight/web build

# ── runner ──
FROM base AS runner
ENV NODE_ENV=production
# output:'standalone' (next.config.ts) + outputFileTracingRoot=raíz del monorepo:
# el bundle trae server.js en apps/web/ y SOLO los node_modules necesarios.
COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "apps/web/server.js"]
