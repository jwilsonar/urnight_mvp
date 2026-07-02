# syntax=docker/dockerfile:1
# API (NestJS) — imagen multi-stage, monorepo-aware.
# El contexto de build es la RAÍZ del monorepo (por el lockfile y los workspaces):
#   docker build -f apps/api/Dockerfile -t urnight-api .
#
# Node 22 LTS + pnpm (via corepack, versión pineada en package.json#packageManager).

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

# ── build: instala con el lockfile y compila los paquetes compartidos + la app ──
FROM base AS build
# .dockerignore excluye node_modules/dist del host: el contexto es solo código fuente.
COPY . .
RUN pnpm install --frozen-lockfile
# El orden importa: paquetes compartidos primero, luego la app.
RUN pnpm --filter @urnight/contracts --filter @urnight/db build \
 && pnpm --filter @urnight/api build

# ── runner ──
FROM base AS runner
ENV NODE_ENV=production
# Trae el workspace ya instalado y compilado (node_modules + dist).
COPY --from=build /repo /repo
WORKDIR /repo/apps/api
EXPOSE 3101
CMD ["node", "dist/main.js"]
