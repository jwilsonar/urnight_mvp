# Auditoría integral UrNight — 2026-07-02

> Auditoría contra `der_class/PROJECT_SPECS.md` v1.1. Dimensiones: seguridad, funcionalidad (invariantes de negocio), arquitectura/coherencia con spec, SOLID/DRY, frontend/UX, apps móviles, worker, DB e infra.
>
> Baseline verificado: typecheck limpio en los 9 proyectos del workspace; 409 tests unitarios de la API pasan.

---

## 0. Veredicto general

La base arquitectónica es **sólida y fiel a la spec**: hexagonal real (0 imports de framework en `domain/`), Outbox/UoW/EventBus vivos y usados, triple barrera anti-sobreventa, QR con CSPRNG de 192 bits, contracts Zod compartidos de verdad (109 archivos en API + ~50 en web), schema DB completo (47 tablas, todos los dominios del DER), frontend con 0 `any` y RBAC server-side en capas.

Los problemas graves se concentran en **tres zonas**: (1) la app de validación de puerta no cumple su función (crítico para el piloto), (2) huecos de seguridad en validación QR multi-tenant, tokens y rate-limiting, y (3) invariantes de negocio a medias (atribución 7 días inexistente, races en check-in y promo codes).

---

## 1. Hallazgos CRÍTICOS (bloquean piloto)

### C1. App validator no valida nada
- `apps/validator`: `syncPending` (`lib/offline-cache.ts:73`) y `validateQr` (`lib/api-client.ts:32`) **no se invocan desde ninguna pantalla**. El escaneo (`app/scan.tsx:35-43`) solo encola en SQLite y muere ahí: el portero nunca ve válido/inválido y nada se sincroniza.
- **Sin login de validador**: el endpoint exige JWT rol `validator` pero la app no tiene pantalla de auth ni storage de token.
- Sin dedupe offline: `pending_checkin` sin `UNIQUE(qr_code)`; escaneos A→B→A insertan A dos veces.
- Sin `scannedAt` en `ValidateQrDto`: el servidor registra hora del sync, no del escaneo real.
- QR completo pintado en pantalla (`scan.tsx:45`) contradiciendo la política de no exponer el QR.

### C2. Doble check-in por race (TOCTOU)
- `validate-qr.use-case.ts`: lee ticket con `findByQr` fuera de la Tx, decide en memoria, y el UPDATE (`drizzle-ticket.repository.ts:90-95`) es incondicional — sin `WHERE status='valid'` ni chequeo de rowCount. Dos validadores escaneando el mismo QR a la vez → ambos "Acceso permitido".
- Bug menor asociado: `usedAt` se regenera con `new Date()` en el repo en vez de usar el del dominio.

### C3. Validación QR sin aislamiento multi-tenant
- `validation.controller.ts:9` solo exige rol global `validator`. El use-case acepta `dto.localId` **del body del cliente** sin verificar nada: un validador del Local A puede quemar/admitir entradas de cualquier otro local o empresa. Rompe invariante §4.3 "Multi-tenant aislado".

---

## 2. Hallazgos ALTOS

### Seguridad API
- **A1. Refresh tokens sin rotación ni revocación** (`jwt-token.service.ts:61-70`, `refresh-token.use-case.ts`): sin `jti`, sin denylist, sin endpoint de logout. Token robado válido 7 días; cambio de contraseña no invalida sesiones.
- **A2. Google login enlaza cuentas por email sin exigir `email_verified`** (`google-login.use-case.ts:52-56`): riesgo de account takeover / pre-hijacking sobre cuentas email+password existentes.
- **A3. IDOR en canjes de promo codes** (`promo-codes.controller.ts:40-46` → `list-promo-code-redemptions.use-case.ts`): cualquier `admin_local` lee canjes (orderId, usuarios, descuentos) de códigos de OTRA empresa. Falta `assertTenant`.
- **A4. Rate limiting insuficiente** (`edge/guards/rate-limit.guard.ts`): un solo bucket global 100/min por IP para toda la API; fail-open si Redis cae; sin `trust proxy` (tras reverse proxy todo colapsa a una IP); login/refresh/checkout sin límites dedicados ni bloqueo por intentos fallidos.
- **A5. CORS abierto** (`main.ts:24` — `enableCors()` sin origin) y **sin helmet** (sin HSTS, X-Content-Type-