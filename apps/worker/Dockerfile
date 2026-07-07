# syntax=docker/dockerfile:1
# Worker (NestJS standalone, consumidor BullMQ) — imagen multi-stage, monorepo-aware.
# El contexto de build es la RAÍZ del monorepo:
#   docker build -f apps/worker/Dockerfile -t urnight-worker .

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

# ── build ──
FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
# El worker sólo depende de @urnight/db entre los compartidos; se compila igual.
RUN pnpm --filter @urnight/contracts --filter @urnight/db build \
 && pnpm --filter @urnight/worker build

# ── runner ──
FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /repo /repo
WORKDIR /repo/apps/worker
# Consumidor de cola: sin puerto expuesto.
CMD ["node", "dist/main.js"]
