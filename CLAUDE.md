# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

UrNight — a Peruvian nightlife marketplace. pnpm monorepo, modular monolith with hexagonal architecture. The functional **source of truth is `../der_class/PROJECT_SPECS.md`** (naming, patterns, ADRs); code comments reference its sections as `§N`. Any deviation from the spec must be recorded as an ADR in `docs/adr/`. The stack version baseline (newer than the spec) is documented in `docs/adr/0001-stack-version-baseline.md`. Most comments/docs are in Spanish.

## Commands

All run from the workspace root.

```bash
pnpm install
pnpm docker:up                       # Postgres 16 + Redis 7 (docker-compose.yml)
pnpm db:generate && pnpm db:migrate  # Drizzle migrations (packages/db)
pnpm --filter @urnight/db db:seed    # seed data

pnpm dev:api        # NestJS API (README: :3001)
pnpm dev:web        # Next.js web (:3000)
pnpm dev:worker / dev:mobile / dev:validator

pnpm lint           # eslint, whole workspace (-r --if-present)
pnpm typecheck      # tsc --noEmit, whole workspace
pnpm test           # vitest run, whole workspace
pnpm build          # pnpm -r build
```

**Build order matters:** shared packages compile first. When building manually, build `@urnight/contracts` and `@urnight/db` before the apps that consume them.

**Tests (in `apps/api`, all Vitest):**
```bash
pnpm --filter @urnight/api test                  # unit (colocated *.spec.ts)
pnpm --filter @urnight/api test:int              # integration (*.integration.spec.ts, real DB)
pnpm --filter @urnight/api test:e2e              # e2e (*.e2e.spec.ts, --no-file-parallelism)
pnpm --filter @urnight/api vitest run path/to/file.spec.ts   # a single test file
```
Each suite has its own config: `vitest.config.ts`, `vitest.integration.config.ts`, `vitest.e2e.config.ts`. Shared test infra (builders, fakes, mothers, in-memory repos) lives in `apps/api/src/shared/testing/`.

> Note: `docs/adr/0001` records that the local env may use Postgres `5433` and API `3101` to avoid port clashes — actual ports come from `.env` / compose, so check those if README defaults are taken.

## Layout

```
apps/api/        NestJS — modular monolith, 8+ bounded contexts (heavily implemented)
apps/worker/     NestJS standalone — BullMQ consumer (notifications queue; mostly scaffold)
apps/web/        Next.js 16 App Router — consumer + role panels (substantially implemented)
apps/mobile/     Expo / React Native — attendee app (scaffold)
apps/validator/  Expo / React Native — gate scan app, offline cache (scaffold)
packages/db/         Drizzle schema + migrations — single source of the data model
packages/contracts/  Zod schemas + DTOs shared API ↔ clients (@urnight/contracts)
packages/ui/         shared web components (shadcn)
packages/config/     base tsconfig / eslint / prettier
```

Shared dependency versions are pinned once in `pnpm-workspace.yaml` under `catalog:`; apps reference them as `"dep": "catalog:"`.

## API architecture (hexagonal, per module)

Every module under `apps/api/src/modules/<ctx>/` has the same four layers:

- `domain/` — pure TypeScript: `entities/`, `value-objects/`, `errors/`, domain `events/`, and `ports/` (interfaces). **No framework or ORM imports here.**
- `application/use-cases/` — one class per use case, `@Injectable`, injects ports, holds orchestration logic.
- `infrastructure/persistence/` — Drizzle adapters implementing the domain ports.
- `interfaces/http/` — controllers, OpenAPI definitions, e2e specs.

**Dependency injection uses Symbol port tokens.** A port file exports both an interface and a `Symbol` token (e.g. `EVENT_REPOSITORY`, `STORAGE_PORT`); the module's `<ctx>.module.ts` binds `{ provide: TOKEN, useClass: DrizzleAdapter }`; use cases `@Inject(TOKEN)` the interface. To wire a new adapter, add the binding in the module — never import the concrete adapter into a use case.

### Cross-cutting edge layer (`apps/api/src/edge/`)

Global pipeline registered in `app.module.ts`. **Guard order is significant: RateLimit → Auth → Roles.** Also global: `AuditInterceptor`, `ProblemJsonFilter` (RFC problem+json errors), `ZodValidationPipe`. Decorators: `@Public()`, `@Roles(...)`, `@CurrentUser()`.

### Multi-tenant isolation (invariant — do not bypass)

A company must never see another company's resources. The rule lives in **one place** and all modules use it:

- `tenantScopeOf(actor)` (edge) derives `TenantScope` from the JWT.
- `scopedCompanyId(scope)`: `super_admin → null` (all), scoped → its `companyId`, no company → `undefined` (sees nothing).
- `assertTenant(scope, resourceCompanyId)` throws `TenantForbiddenError` on mismatch.

Use cases receive `scope: TenantScope` and call these helpers — controllers don't re-derive role/company logic. RBAC roles: `super_admin`, `admin_local`.

### Object storage

`StoragePort` (S3-compatible, in `shared/adapters/storage/`) is an anti-corruption layer over the AWS SDK. **Persist S3 object *keys* in the DB, not URLs.** URLs are resolved at the HTTP presentation layer via `resolveUrl()` so data stays environment-independent. Clients upload/download directly with presigned URLs; the API only signs. The worker uses `putObject` server-side (e.g. ticket PDFs after `OrderPaid`).

## Data model (`packages/db`)

Single source of the DER. Drizzle schemas split by domain in `src/schema/` (identity, companies, catalog, events, ticketing, promoters, trust, ops, checkout). Conventions (§2.3):

- UUID PKs via `helpers.id()` (`gen_random_uuid()`); audit columns via `helpers.timestamps()`.
- **`varchar` + `CHECK` for discriminator/enum columns, not `pg_enum`.**
- snake_case singular table names; indexes named `idx_<table>_<col>`.
- 18+/business rules validated in domain + contracts, not the DB.

`drizzle.config` drives `db:generate` / `db:migrate` / `db:push` / `db:studio` / `db:seed`.

## Contracts (`packages/contracts`)

Zod schemas + inferred DTOs shared across API and clients, organized by domain (re-exported from `src/index.ts`). The API validates input with these via the edge Zod pipe; the web client types its requests against the same package. Change a DTO here, not separately in API and web.

## Web app (`apps/web`)

Next.js 16 App Router (no `/src`), Tailwind v4, NextAuth v5 (beta). Route groups: `app/(auth)`, `app/(consumer)`, `app/(panels)`, plus `checkout/` and `onboarding/`. The backend surface is wrapped in a typed client layer under `lib/api/` (one file per domain + `client.ts`); prefer adding functions there over inline `fetch`. Images render via the `StorageImage` component / `lib/storage/storage-context.tsx` (resolves storage keys to URLs) — not raw `next/image` on storage refs.

## Logging

Structured logging with `pino` / `nestjs-pino`. Use `createLogger(Name)` and dotted event names (`events.event.created`, `events.event.started`). See `docs/LOGGING.md`.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
