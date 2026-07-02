# syntax=docker/dockerfile:1
# Migrator — imagen one-shot que aplica migraciones Drizzle contra DATABASE_URL.
# El contexto de build es la RAÍZ del monorepo:
#   docker build -f packages/db/Dockerfile -t urnight-migrator .
# Uso en deploy (contenedor efímero, aborta el deploy si sale != 0):
#   docker run --rm --network urnight_data --env-file /opt/urnight/<env>/.env urnight-migrator
#
# Solo necesita @urnight/db (drizzle-kit es devDependency suya) + packages/config
# (workspace:*) + los manifests raíz para resolver versiones `catalog:`.
# drizzle.config.ts intenta cargar ../../.env vía dotenv: sin el archivo es no-op
# y DATABASE_URL llega por env del contenedor.

FROM node:22-alpine
RUN corepack enable
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/config ./packages/config
# Solo el manifest antes del install: una migración nueva no invalida la layer
# de node_modules (la más pesada) — el deploy re-descarga solo capas pequeñas.
COPY packages/db/package.json ./packages/db/package.json
# Cache mount: el store de pnpm no se persiste en la layer;
# pnpm copia (no hardlink) hacia node_modules al cruzar el boundary del mount.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm-store \
    pnpm config set store-dir /pnpm-store && \
    pnpm install --frozen-lockfile --filter @urnight/db
COPY packages/db ./packages/db
WORKDIR /repo/packages/db
CMD ["pnpm", "db:migrate"]
