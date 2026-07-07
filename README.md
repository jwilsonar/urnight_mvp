# UrNight — Monorepo

Marketplace de vida nocturna (Perú). Monolito modular + arquitectura hexagonal.
Fuente de verdad: [`../der_class/PROJECT_SPECS.md`](../der_class/PROJECT_SPECS.md).

## Estructura

```
apps/
  api/        NestJS — API Backend (monolito modular hexagonal, 8 bounded contexts)
  worker/     NestJS standalone — consumidor BullMQ (email, PDF, push)
  web/        Next.js — canal principal (consumidor + paneles por rol)
  mobile/     Expo / React Native — app del asistente (billetera QR, push)
  validator/  Expo / React Native — app de puerta (escaneo QR, cache offline)
packages/
  db/         Drizzle schema + migraciones (única fuente del DER)
  contracts/  DTOs + esquemas Zod compartidos (API ↔ clientes)
  config/     tsconfig / eslint / prettier base
  ui/         componentes web compartidos (shadcn)
```

## Prerrequisitos

- Node.js **22.11+**
- pnpm **10.x** (`npm i -g pnpm@10`)
- Docker + docker compose

## Setup

```bash
pnpm install
cp .env.example .env            # editar credenciales
pnpm docker:up                  # Postgres 16 + Redis 7
pnpm db:generate && pnpm db:migrate
pnpm dev:api                    # API en :3101 (ADR 0001; NO 3001)
```

| Script | Acción |
|---|---|
| `pnpm dev:api` / `dev:worker` / `dev:web` / `dev:mobile` / `dev:validator` | dev de cada app |
| `pnpm db:generate` / `db:migrate` / `db:studio` | migraciones Drizzle |
| `pnpm lint` / `typecheck` / `test` / `build` | calidad (todo el workspace) |
| `pnpm docker:up` / `docker:down` | infra local |

## Convenciones

Ver `PROJECT_SPECS.md` §2.3 (naming), §3 (patrones), §8 (ADR). Toda desviación del spec → ADR en `docs/adr/`.

> Versiones del stack: ver `docs/adr/0001-stack-version-baseline.md` (se usa latest estable; el spec fijaba versiones anteriores).
