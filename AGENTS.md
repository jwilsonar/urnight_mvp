# OpenCode Instructions for UrNight

## Architecture & Sources of Truth

- **Source of Truth**: Read `../der_class/PROJECT_SPECS.md` for naming conventions, patterns, and Architecture Decision Records (ADRs).
- **Workspace**: pnpm workspace (v10) with Node v22.11+.
  - `apps/api`: NestJS API backend (modular monolith, hexagonal architecture).
  - `apps/worker`: NestJS standalone BullMQ consumer.
  - `apps/web`: Next.js 16 (App Router) + TailwindCSS v4 + NextAuth v5 beta.
  - `apps/mobile` & `apps/validator`: Expo / React Native apps.
  - `packages/db`: Drizzle schema + migrations.
  - `packages/contracts`: Zod schemas & DTOs shared across apps.
  - `packages/ui`: Shared Shadcn UI components (transpiled by Next.js directly).
- **Deviations**: Any deviation from the main spec must be documented as an ADR in `docs/adr/`.

## Command Workflows

All commands are run from the workspace root via pnpm.

**Infrastructure & DB**:

- Setup infrastructure: `pnpm docker:up` (Postgres 16, Redis 7).
- Database operations (via Drizzle in `packages/db`):
  - `pnpm db:generate`
  - `pnpm db:migrate`
  - `pnpm db:studio`

**Development Servers**:

- API: `pnpm dev:api` (:3001)
- Web: `pnpm dev:web` (:3000)
- Others: `pnpm dev:worker` / `pnpm dev:mobile` / `pnpm dev:validator`

**Verification & Quality**:

- CI enforces running these across the workspace:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test` (Uses Vitest)
- When building shared code manually, make sure to build `@urnight/contracts` and `@urnight/db` first (e.g., `pnpm --filter @urnight/contracts --filter @urnight/db build`).
