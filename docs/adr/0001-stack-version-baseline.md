# ADR 0001 — Línea base de versiones del stack (latest estable)

- **Estado:** Aceptado
- **Fecha:** 2026-06-19
- **Decisores:** Equipo UrNight

## Contexto

`PROJECT_SPECS.md` (v1.0) fijó versiones que, a la fecha de arranque del monorepo,
ya quedaron por detrás de los releases estables vigentes. Verificado contra docs
oficiales el 2026-06-19. El usuario pidió explícitamente "consultar documentación
actual y aplicar mejores prácticas". El §8 del spec exige registrar como ADR toda
desviación de las versiones/decisiones.

## Decisión

Usar la **última versión estable** de cada componente en lugar de las fijadas en el
spec. Desviaciones respecto a `PROJECT_SPECS.md §1`:

| Componente | Spec | Adoptado | Motivo |
|---|---|---|---|
| NestJS | 10.x | **11.1.x** | v10 sin soporte; v11 = estándar (Express 5 default). |
| Drizzle ORM | 0.36.x | **0.45.x** | Línea estable actual. |
| drizzle-kit | 0.28.x | **0.31.x** | Línea estable alineada con drizzle-orm 0.45. |
| Zod | 3.23.x | **3.25.x** | Última 3.x (máxima compatibilidad nestjs-zod/RHF; evita el salto a v4). |
| Next.js | 15.x | **16.2.x** | v15 EOL Oct-2026; v16 App Router + Turbopack default. |
| Tailwind CSS | 3.4.x | **4.3.x** | v4 CSS-first (`@tailwindcss/postcss`). |
| Auth.js | @auth/nextjs 5.x | **next-auth 5 (beta)** | Paquete real `next-auth`; `@auth/nextjs` es interno. |
| Expo SDK | 52 | **56** | New Architecture obligatoria. Módulos `expo-*` versionan como `56.x`. |
| React Native | 0.76.x | **0.85.x** | Bundled por Expo SDK 56. |
| Expo Router | 4.x | **6.x** (`56.2.x`) | File-based routing actual. |
| QR scan | expo-camera + expo-barcode-scanner | **solo expo-camera** | `expo-barcode-scanner` eliminado en SDK 52. |
| pnpm | 9.x | **10.x** | pnpm 11 exige Node ≥22.13; el entorno corre Node 22.11. |
| Node.js | 22.x | **22.11** | LTS Active; condiciona pnpm 10. |

### Notas de implementación
- **Linker pnpm:** `node-linker=isolated` (default). `hoisted` impedía materializar
  `react-native` en disco con SDK 56 — ver `.npmrc`.
- **Puertos dev locales:** Postgres `5433` y API `3101` (los 5432/3001/3000 estaban
  ocupados por otro proyecto en la máquina). Configurable vía `.env` / compose.

## Alternativas consideradas

1. **Respetar versiones exactas del spec.** Trazable pero adopta software con EOL
   próximo o ya sin soporte (NestJS 10, Next 15, Expo 52) y contradice el pedido de
   "docs actuales".
2. **Adoptar betas/canaries más nuevos** (Drizzle v1-beta, Zod 4). Mayor riesgo de
   inestabilidad en compatibilidad con nestjs-zod/drizzle-zod; descartado para el MVP.

## Consecuencias

- (+) Stack soportado y alineado con documentación vigente; menor deuda a corto plazo.
- (+) New Architecture (RN) y Turbopack (Next) por defecto: mejor rendimiento.
- (−) Express 5 / Tailwind v4 / Zod migrable a v4 introducen breaking changes a vigilar
  en fases siguientes.
- El `PROJECT_SPECS.md` debería actualizarse para reflejar esta línea base (§8).
