# Promotores y atribución — Diagramas de secuencia y flujo de protocolo

**Serie:** [Diagramas de secuencia](./README.md) · **Dominio 6 del DER** — *Promoters & Promo Codes* (§4.1 de `PROJECT_SPECS.md`)

> **Alcance.** Cinco procesos del dominio *Promotores y atribución*, agrupados en cinco bloques y
> representados con **13 diagramas de secuencia Mermaid** más **1 diagrama de estados** complementario,
> en formato *protocol data flow*: cada flecha lleva su método, ruta, código de estado y forma del
> payload; cada fase del pipeline va marcada con un banner. Reflejan el código real de `apps/api`
> (módulo `promoters`, con sus puertos hacia `identity` y `ticketing`) y `apps/web` (postulación
> pública, panel de local, panel de promotor y enlace corto de compartir).
>
> Mismo estándar de notación que `docs/diagramas-secuencia/01-identidad-acceso.md`.
> Fecha de levantamiento: 2026-07-28 · Rama `feat/rebrand-ravenue`.

---

## 1. Índice

| # | Diagrama | Proceso cubierto |
|---|---|---|
| SD-A | [Tenant y consentimiento en Promoters](#sd-a--tenant-y-consentimiento-en-promoters) | sub-flujo compartido |
| SD-01 | [Postulación pública y revisión](#sd-01--postulación-pública-y-revisión) | Postulación pública |
| SD-02 | [Invitar a un promotor](#sd-02--invitar-a-un-promotor) | Invitar promotor |
| SD-03 | [Aceptar o rechazar el vínculo](#sd-03--aceptar-o-rechazar-el-vínculo) | Aceptar vínculo |
| SD-04 | [Asignar evento y cuotas](#sd-04--asignar-evento-y-cuotas) | Asignación y cuotas |
| SD-05 | [Desasignar un evento](#sd-05--desasignar-un-evento) | Asignación y cuotas |
| SD-06 | [Generar un código desde el cupo](#sd-06--generar-un-código-desde-el-cupo) | Generar códigos |
| SD-07 | [Compartir y resolver el enlace corto](#sd-07--compartir-y-resolver-el-enlace-corto) | Compartir códigos |
| SD-08 | [Canje y consumo del cupo](#sd-08--canje-y-consumo-del-cupo) | Códigos y cuotas |
| SD-09 | [Clics: dos contadores, dos caminos](#sd-09--clics-dos-contadores-dos-caminos) | Clics |
| SD-10 | [Atribución de ventas](#sd-10--atribución-de-ventas) | Atribución de ventas |
| SD-11 | [Liquidación de comisiones](#sd-11--liquidación-de-comisiones) — AS-IS y TO-BE | Liquidación |
| ED-1 | [Máquina de estados del promotor](#ed-1--máquina-de-estados-del-promotor) | Estados |

---

## 2. Agrupación de los procesos

El recorrido es lineal: una persona entra como promotor, la empresa le asigna un evento con cupo,
ese cupo se convierte en códigos, los códigos se comparten y se canjean, y el canje debería producir
una comisión liquidable. Los tres primeros tramos funcionan; el último está partido en dos, y el
diagrama lo refleja.

| Bloque | Procesos | Razón de la agrupación |
|---|---|---|
| **0 · Sub-flujo compartido** | — | El módulo combina dos controles distintos: aislamiento por empresa (`assertTenant`) y consentimiento de la persona invitada (`assertPendingInvitation`). Se extraen una vez en SD-A. |
| **1 · Alta del promotor** | Postulación pública · Invitar y aceptar vínculo | Son dos vías de entrada al mismo aggregate con resultados distintos: la postulación crea el promotor de una vez, la invitación exige que la persona acepte. |
| **2 · Asignación** | Asignar promotor a evento y cuotas | Asignar es un *upsert* idempotente por promotor y evento. Desasignar tiene su propio diagrama porque decide qué pasa con los códigos ya emitidos. |
| **3 · Códigos** | Generar y compartir códigos | Tres momentos: generar consumiendo cupo, compartir por enlace corto y canjear en el checkout. El canje se cuenta aquí desde la óptica del cupo, no del pago. |
| **4 · Atribución y liquidación** | Clics, atribución de ventas y liquidación | Los clics tienen dos contadores independientes, la atribución está inerte y la liquidación no existe. Cada uno merece su diagrama, con AS-IS y TO-BE donde corresponde. |

> **Cruce con otros documentos.** SD-03 amplía SD-12 de *Identidad y acceso* desde la óptica de
> Promoters. SD-06, SD-07 y SD-08 son la contraparte de SD-04, SD-05 y SD-06 de *Entradas y
> validación*: allí se contaron desde el checkout, aquí desde el cupo del promotor.

---

## 3. Convenciones de notación

Estándar de la serie. La fuente canónica es `.claude/skills/sincronizar-diagramas-secuencia/references/notacion.md`.

### 3.1 Estructura

1. **`autonumber` siempre.** Permite referenciar un paso concreto en revisiones ("falla en el paso 7").
2. **Un diagrama = un caso de uso.** Si un flujo supera ~40 mensajes o los 8 participantes, se parte y
   se referencia con una nota (`note over X: ver SD-A`).
3. **Máximo 8 participantes.** Por encima, el diagrama deja de leerse en pantalla.
4. **Declaración explícita de participantes al inicio**, en orden de aparición izquierda → derecha
   (usuario → cliente → borde → aplicación → dominio → infraestructura). Nunca declarar por primera
   vez a mitad del diagrama: el orden visual se desordena.
5. **`actor` para personas, `participant` para sistemas.** Alias corto en mayúsculas (`UC`, `DB`),
   etiqueta legible con `as`.

### 3.2 Flujo de protocolo

Regla central de este documento: **el diagrama debe poder contrastarse contra el tráfico real.**

6. **Toda petición lleva su respuesta.** Ninguna flecha `->>` de red se queda sin su `-->>` con código
   de estado y forma del payload. Si no hay respuesta, es un `-)` (asíncrono) y se dice por qué.
7. **Anotación de protocolo en la ida:** `MÉTODO /ruta · cabecera o cuerpo relevante`.
   Ejemplo: `GET /api/v1/{recurso}/{id} · Authorization Bearer {accessToken}`.
8. **Anotación de resultado en la vuelta:** `código · payload`.
   Ejemplo: `409 · problem+json { code: {contexto}/{error} }`.
9. **Infraestructura con su comando real**, no con una paráfrasis: `UPDATE promo_code SET used_count = used_count + 1`.
   Hace el diagrama auditable
   contra los adapters Drizzle y Redis.
10. **Placeholders entre llaves**, nunca entre `<` `>` (Mermaid los interpreta como HTML): `{promoterId}`.

### 3.3 Fases

11. **Banners de fase** con `note over A, B: Fase N · Nombre (componente real)`, abarcando los
    participantes implicados en ese tramo. Convierten un muro de flechas en un flujo legible por
    etapas y hacen explícito qué componente gobierna cada una.
12. **Notas de invariante** (`note over X:`) reservadas para reglas de seguridad, decisiones de diseño
    y brechas conocidas. Nunca para narrar lo que la flecha ya dice.
13. Saltos de línea en notas con `<br/>` para no ensanchar el diagrama.

### 3.4 Arrows y bloques de control

| Notación | Significado |
|---|---|
| `->>` | Llamada síncrona: el emisor espera respuesta |
| `-->>` | Respuesta o retorno, con código de estado |
| `-)` | Asíncrono fire-and-forget: publicación de evento, encolado |
| `X->>X` | Cómputo interno que cambia estado o toma una decisión (hash, firma, validación) |

| Bloque | Uso |
|---|---|
| `alt` / `else` | Caminos mutuamente excluyentes (éxito vs. error de negocio) |
| `opt` | Tramo que puede no ejecutarse y no tiene alternativa |
| `critical` | Transacción atómica (`UnitOfWork`): si algo falla, nada se persiste |
| `par` / `and` | Señales concurrentes e independientes |
| `loop` | Repetición acotada (reintentos, generación de código único) |

### 3.5 Cierre

14. **Cada diagrama termina en el efecto observable**: lo que ve el usuario, la cookie fijada o el
    documento devuelto. Un diagrama que acaba en una llamada interna está incompleto.

### 3.6 Higiene sintáctica

15. **Nada de `;` dentro de un mensaje o una nota.** Mermaid corta la sentencia ahí y el diagrama deja
    de compilar. Usar coma o punto.
16. Nada de `<` `>` sin escapar, incluidas las flechas de función de JavaScript (ver regla 10).
17. Los nombres de casos de uso, guards, endpoints y claves de Redis se copian **tal cual del código**:
    un `grep` del nombre debe encontrar el fuente.
18. **Los diagramas TO-BE nombran componentes que no existen todavía** y lo señalan en el propio participante o en una nota. Los AS-IS nombran archivos reales.

### 3.7 Validación

```bash
npx -y @mermaid-js/mermaid-cli@11 \
  -i docs/diagramas-secuencia/06-promotores-atribucion.md \
  -o /tmp/06-promotores-atribucion.md
```

También sirven mermaid.live y la extensión *Markdown Preview Mermaid Support* de VS Code. GitHub
renderiza estos bloques de forma nativa.

---

## 4. Catálogo de participantes

| Alias | Componente real | Archivo |
|---|---|---|
| `U` | Persona postulante, invitada, promotora o administradora | — |
| `W` | Componente cliente del panel, o Route Handler del enlace corto | `apps/web/**` |
| `EDGE` | Pipeline global del API: `RateLimit → Auth → Roles` + `ZodValidationPipe` | `apps/api/src/edge/**` |
| `UC` | Caso de uso (capa aplicación) | `apps/api/src/modules/promoters/application/use-cases/**` |
| `DOM` | Aggregates `Promoter`, `PromoCode`, `SaleAttribution` | `.../promoters/domain/entities/**` |
| `PREP` | `PromoterRepository` | `.../infrastructure/persistence/drizzle-promoter.repository.ts` |
| `PEREP` | `PromoterEventRepository` — asignaciones y cupos | `.../drizzle-promoter-event.repository.ts` |
| `PCREP` | `PromoCodeRepository` — códigos, canjes y clics | `.../drizzle-promo-code.repository.ts` |
| `SAREP` | `SaleAttributionRepository` | `.../drizzle-sale-attribution.repository.ts` |
| `TR` | `ResourceTenantResolver` — empresa dueña de un evento, local o tipo de entrada | `apps/api/src/shared/tenant/resource-tenant.port.ts` |
| `BUS` | `EventBus` in-process | `apps/api/src/shared/event-bus/event-bus.ts` |
| `IDN` | `PromoterConfirmedSubscriber` de Identity | `.../identity/application/subscribers/promoter-confirmed.subscriber.ts` |
| `CO` | `CheckoutUseCase` de Ticketing | `.../ticketing/application/use-cases/checkout.use-case.ts` |
| `DB` | PostgreSQL vía Drizzle | `packages/db/src/schema/promoters.ts` |

### Superficie de endpoints

| Método y ruta | Acceso | Caso de uso |
|---|---|---|
| `POST /promoter-applications` | público | `ApplyPromoterUseCase` |
| `POST /promoter-applications/{id}/review` | `admin_local` | `ReviewPromoterApplicationUseCase` |
| `POST /promoters` | `admin_local` | `CreatePromoterUseCase` (invitación) |
| `GET /promoters/mine` | `admin_local` | `ListMyPromotersUseCase` |
| `GET /promoters/me` · `GET /promoters/me/associations` | autenticado | `GetMyPromoterUseCase` · `ListPendingAssociationsUseCase` |
| `POST /promoters/{id}/confirm` · `POST /promoters/{id}/reject` | autenticado | `ConfirmPromoterAssociationUseCase` · `RejectPromoterAssociationUseCase` |
| `POST /promoters/{id}/assignments` · `DELETE /{id}/assignments/{promoterEventId}` | `admin_local` | `AssignEventToPromoterUseCase` · `UnassignEventUseCase` |
| `GET /promoters/{id}/assignments` · `GET /promoters/me/assignments` | `admin_local` · `promoter` | `ListPromoterAssignmentsUseCase` · `ListMyAssignmentsUseCase` |
| `POST /promoters/me/redemption-codes` · `GET /promoters/me/redemption-codes` | `promoter` | `GenerateRedemptionCodeUseCase` · `ListMyRedemptionCodesUseCase` |
| `POST /promoters/referrals/{code}/click` | público | `RegisterReferralClickUseCase` |
| `GET /promoters/{id}/sales` | `promoter` | `ListPromoterSalesUseCase` |
| `POST /promo-codes` · `POST /promo-codes/validate` · `GET /promo-codes/{id}/redemptions` | `admin_local` · público · `admin_local` | `CreatePromoCodeUseCase` · `ValidatePromoCodeUseCase` · `ListPromoCodeRedemptionsUseCase` |

---

## 5. Bloque 0 · Sub-flujo compartido

### SD-A · Tenant y consentimiento en Promoters

El módulo combina dos controles que no son intercambiables: uno protege a la **empresa**, el otro a la
**persona**.

```mermaid
sequenceDiagram
    autonumber
    actor U as Actor autenticado
    participant EDGE as Edge API
    participant UC as Caso de uso
    participant DOM as Aggregate Promoter
    participant TR as ResourceTenantResolver
    participant DB as PostgreSQL

    note over U, EDGE: Fase 1 · Rol y scope desde el JWT
    U->>EDGE: comando del módulo · Authorization Bearer
    EDGE->>EDGE: AuthGuard adjunta roles, companyId y localId
    EDGE->>UC: execute con el scope derivado por tenantScopeOf(actor)

    note over UC, TR: Fase 2a · Control de EMPRESA, para acciones del admin
    alt el comando lo ejecuta un admin_local sobre un promotor o un evento
        UC->>DB: SELECT del promotor por id
        DB-->>UC: Promoter con su companyId
        UC->>UC: assertTenant(scope, promoter.companyId)
        opt el recurso además es un evento o un tipo de entrada
            UC->>TR: companyIdForEvent o companyIdForTicketType
            TR->>DB: SELECT de la empresa dueña del recurso
            DB-->>TR: companyId
            TR-->>UC: companyId
            UC->>UC: assertTenant(scope, companyId del recurso)
        end
        alt el recurso es de otra empresa
            UC-->>EDGE: TenantForbiddenError o AssignmentForbiddenError
            EDGE-->>U: 403 · problem+json
        end
        note over UC, TR: Un admin nunca opera sobre promotores ni eventos ajenos.<br/>El companyId sale del token, jamás del cuerpo.
    end

    note over UC, DOM: Fase 2b · Control de CONSENTIMIENTO, para acciones de la persona
    alt el comando lo ejecuta la persona invitada
        UC->>DOM: assertPendingInvitation(actorUserId, actorEmail)
        DOM->>DOM: el promotor debe seguir en estado pending
        alt ya no está pendiente
            DOM-->>UC: AssociationNotPendingError
            UC-->>EDGE: 409 · { code promoters/association_not_pending }
        end
        DOM->>DOM: belongsToInvited compara por userId, o por invitedEmail en minúsculas
        alt el actor no es la persona invitada
            DOM-->>UC: AssociationForbiddenError
            UC-->>EDGE: 403 · { code promoters/association_forbidden }
            note over DOM: Un tercero no puede aceptar ni rechazar por otro.<br/>El match por correo permite invitar a alguien sin cuenta previa.
        end
    end
    UC->>DB: escritura sobre el aggregate
    DB-->>UC: filas afectadas
    UC-->>EDGE: entidad
    EDGE-->>U: 200 o 201 · DTO
```

---

## 6. Bloque 1 · Alta del promotor

### SD-01 · Postulación pública y revisión

`POST /api/v1/promoter-applications` (público) y `POST /{id}/review` (`@Roles('admin_local')`)

```mermaid
sequenceDiagram
    autonumber
    actor PR as Persona interesada
    actor AD as Admin de local
    participant W as Formulario /promotor/postular
    participant EDGE as Edge API
    participant UC as Apply y ReviewPromoterApplication
    participant PREP as PromoterRepository
    participant DB as PostgreSQL

    note over PR, DB: Fase 1 · Postulación sin sesión
    PR->>W: nombre, correo, teléfono y local de interés
    W->>EDGE: POST /api/v1/promoter-applications · application/json
    EDGE->>EDGE: AuthGuard @Public → ZodValidationPipe(applyPromoterSchema)
    EDGE->>UC: ApplyPromoterUseCase.execute({ dto })
    UC->>UC: PromoterApplication.submit con status pending
    note over EDGE, UC: El controller NO pasa applicantUserId: la postulación queda<br/>siempre sin usuario ligado, incluso si la persona tenía sesión. Ver §12.
    UC->>DB: INSERT INTO promoter_application
    DB-->>UC: fila creada
    UC-->>EDGE: PromoterApplication
    EDGE-->>W: 201 Created · PromoterApplicationResponse { id, status pending }
    W-->>PR: confirmación con el identificador de la postulación

    note over AD, DB: Fase 2 · Revisión por la empresa
    AD->>EDGE: POST /api/v1/promoter-applications/{id}/review · Bearer · { decision, companyId }
    EDGE->>EDGE: AuthGuard → RolesGuard @Roles('admin_local') → Zod
    EDGE->>UC: ReviewPromoterApplicationUseCase.execute(...)
    UC->>DB: SELECT de la postulación por id
    alt no existe
        UC-->>EDGE: ApplicationNotFoundError · 404
    else ya fue revisada
        UC-->>EDGE: ApplicationAlreadyReviewedError · 409
    else pendiente
        alt decisión rechazar
            UC->>UC: application.reject(reviewerId)
            UC->>DB: UPDATE promoter_application con status rejected
            UC-->>EDGE: 200 OK · status rejected
        else decisión aprobar

            note over UC, DB: Fase 3 · Alta atómica del promotor con su link
            UC->>UC: companyId del actor, o el del cuerpo solo si es super_admin
            note over UC: admin_local nunca puede crear el promotor en otra empresa.<br/>Sin companyId derivable, TenantForbiddenError.
            UC->>UC: Promoter.create con status active y userId de la postulación
            loop hasta 5 intentos
                UC->>UC: code = randomBytes(4) en hexadecimal mayúscula
                UC->>DB: comprueba que el código de referido no exista
            end
            UC->>UC: ReferralLink.create con url referralUrlFor(code)
            UC->>UC: application.approve(reviewerId, promoter.id)
            critical Tx única (UnitOfWork)
                UC->>PREP: create(promoter, link, tx)
                PREP->>DB: INSERT INTO promoter e INSERT INTO referral_link
                UC->>DB: UPDATE promoter_application con status approved
            end
            DB-->>UC: COMMIT
            UC-->>EDGE: PromoterApplication
            EDGE-->>AD: 200 OK · { status approved, createdPromoterId }
            note over UC, DB: Esta vía NO publica PromoterAssociationConfirmedEvent, así que<br/>NO otorga el rol promoter. Y como el userId viene en null, el<br/>promotor creado no puede autenticarse como tal. Ver §12.
        end
    end
```

### SD-02 · Invitar a un promotor

`POST /api/v1/promoters` · `@Roles('admin_local')` · `CreatePromoterUseCase`

```mermaid
sequenceDiagram
    autonumber
    actor AD as Admin de local
    participant W as Panel de promotores
    participant EDGE as Edge API
    participant UC as CreatePromoterUseCase
    participant DOM as Aggregate Promoter
    participant PREP as PromoterRepository
    participant DB as PostgreSQL

    note over AD, EDGE: Fase 1 · Invitación por correo
    AD->>W: nombre de la persona, correo, teléfono y local
    W->>EDGE: POST /api/v1/promoters · Bearer · { name, email, localId, contactPhone }
    EDGE->>EDGE: AuthGuard → RolesGuard @Roles('admin_local') → Zod(createPromoterSchema)
    EDGE->>UC: execute({ ...dto, companyId del actor })
    note over EDGE, UC: El companyId sale de los claims del token, NUNCA del cuerpo:<br/>un admin no puede invitar promotores a otra empresa.

    note over UC, DB: Fase 2 · Alta en pendiente, sin link de referido
    UC->>DOM: Promoter.invite(...)
    DOM->>DOM: normaliza el correo a minúsculas y lo guarda como invitedEmail
    DOM->>DOM: status pending, userId en null
    note over DOM: Sin link de referido todavía: se genera al confirmar (SD-03).<br/>Invitar no crea ningún acceso ni ningún código.
    DOM-->>UC: Promoter
    UC->>PREP: createPending(promoter)
    PREP->>DB: INSERT INTO promoter con status pending
    DB-->>PREP: fila creada
    UC-->>EDGE: { promoter }
    EDGE-->>W: 201 Created · PromoterResponse { status pending, invitedEmail }
    W-->>AD: invitación registrada, a la espera de que la persona la acepte
    note over W, AD: No se envía correo: la persona descubre la invitación al entrar<br/>a su cuenta. No hay notificación de invitación. Ver §12.
```

### SD-03 · Aceptar o rechazar el vínculo

`POST /api/v1/promoters/{id}/confirm` y `/reject` · autenticado. Amplía SD-12 de *Identidad y acceso*.

```mermaid
sequenceDiagram
    autonumber
    actor PR as Persona invitada
    participant W as /account/invitaciones
    participant EDGE as Edge API
    participant UC as Confirm y Reject Association
    participant PREP as PromoterRepository
    participant BUS as EventBus
    participant IDN as Identity · PromoterConfirmedSubscriber

    note over PR, EDGE: Fase 1 · Bandeja de invitaciones
    PR->>W: abre sus invitaciones
    W->>EDGE: GET /api/v1/promoters/me/associations · Bearer
    EDGE->>UC: ListPendingAssociationsUseCase.execute({ actorUserId, actorEmail })
    UC->>PREP: findPendingForActor(userId, email)
    PREP-->>UC: invitaciones que casan por userId o por correo
    UC-->>EDGE: Promoter[] en pending
    EDGE-->>W: 200 OK · PromoterAssociationResponse[]

    note over UC, IDN: Fase 2 · Decisión de la persona
    alt acepta
        W->>EDGE: POST /api/v1/promoters/{id}/confirm · Bearer
        EDGE->>UC: ConfirmPromoterAssociationUseCase
        UC->>UC: assertPendingInvitation → SD-A
        loop hasta 5 intentos
            UC->>UC: code = randomBytes(4) en hexadecimal mayúscula
            UC->>PREP: existsByCode(code)
        end
        UC->>UC: ReferralLink.create con url referralUrlFor(code)
        UC->>UC: promoter.confirm(userId) liga el usuario y pasa a active
        critical Tx única (UnitOfWork)
            UC->>PREP: update(promoter, tx)
            UC->>PREP: addLink(link, tx)
        end
        UC-)BUS: PromoterAssociationConfirmedEvent { promoterId, userId, companyId, localId }
        BUS-)IDN: suscriptor de promoters.association_confirmed
        IDN->>IDN: GrantRoleUseCase con rol promoter y scope de empresa y local
        note over IDN: Idempotente: si ya tenía el rol en ese scope, se ignora.<br/>Promoters no conoce RBAC, solo publica el evento (§3.2).
        UC-->>EDGE: { promoter, link }
        EDGE-->>W: 200 OK · PromoterResponse { status active, referralLink }
        W->>W: useSession().update() para refrescar los roles del navbar
        W-->>PR: acceso al panel de promotor habilitado
    else rechaza
        W->>EDGE: POST /api/v1/promoters/{id}/reject · Bearer
        EDGE->>UC: RejectPromoterAssociationUseCase
        UC->>UC: assertPendingInvitation → SD-A
        UC->>UC: promoter.reject() pasa a inactive
        UC->>PREP: update(promoter)
        UC-->>EDGE: Promoter
        EDGE-->>W: 200 OK · sin rol ni link de referido
        W-->>PR: invitación descartada
        note over UC: El rechazo es terminal: no hay forma de reactivar la invitación,<br/>la empresa tendría que invitar de nuevo.
    end
```

---

## 7. Bloque 2 · Asignación de eventos y cuotas

### SD-04 · Asignar evento y cuotas

`POST /api/v1/promoters/{id}/assignments` · `@Roles('admin_local')` · `AssignEventToPromoterUseCase`

```mermaid
sequenceDiagram
    autonumber
    actor AD as Admin de local
    participant W as Diálogo de asignación
    participant EDGE as Edge API
    participant UC as AssignEventToPromoterUseCase
    participant TR as ResourceTenantResolver
    participant PEREP as PromoterEventRepository
    participant DB as PostgreSQL

    note over AD, EDGE: Fase 1 · Descuento y cupo por tipo de entrada
    AD->>W: elige evento, y por cada tipo de entrada su descuento y su cupo
    W->>EDGE: POST /api/v1/promoters/{id}/assignments · Bearer · { eventId, items }
    EDGE->>EDGE: AuthGuard → RolesGuard @Roles('admin_local') → Zod(assignEventSchema)
    EDGE->>UC: execute({ promoterId, assignedBy, dto, scope })

    note over UC, TR: Fase 2 · Doble comprobación de empresa y promotor activo
    UC->>DB: SELECT del promotor por id
    alt no existe
        UC-->>EDGE: PromoterNotFoundError · 404
    else existe
        UC->>UC: assertTenant(scope, promoter.companyId) → SD-A
        alt el promotor no está activo
            UC-->>EDGE: AssignmentForbiddenError · 403
            note over UC: No se asignan eventos a una invitación aún sin aceptar:<br/>primero el consentimiento, después el trabajo.
        else promotor activo
            UC->>TR: companyIdForEvent(dto.eventId)
            TR-->>UC: companyId del evento o null
            UC->>UC: assertTenant(scope, companyId del evento)
            note over UC, TR: Se comprueban DOS recursos: el promotor y el evento.<br/>Ambos deben ser de la empresa del actor.

            note over UC, DB: Fase 3 · El cupo no puede exceder el stock real
            UC->>PEREP: listTicketStocks(eventId)
            PEREP->>DB: SELECT de stock menos vendidas por tipo de entrada
            DB-->>PEREP: disponibilidad por tipo
            PEREP-->>UC: remaining por ticketTypeId
            loop por cada línea del cuerpo
                alt el tipo de entrada no pertenece al evento
                    UC-->>EDGE: AssignmentForbiddenError · 403
                else el cupo pedido supera lo disponible
                    UC-->>EDGE: AllocationExceedsStockError
                    EDGE-->>W: 422 · { code promoters/allocation_exceeds_stock }
                end
            end

            note over UC, DB: Fase 4 · Upsert idempotente por promotor y evento
            UC->>PEREP: findIdByPromoterAndEvent(promoterId, eventId)
            PEREP-->>UC: id existente o null
            critical Tx única (UnitOfWork)
                alt ya existía la asignación
                    UC->>PEREP: replaceAllocations(id, allocations, tx)
                    note over UC, PEREP: Se reemplazan los cupos conservando la cabecera, y por tanto<br/>los códigos ya generados siguen vivos.
                else asignación nueva
                    UC->>PEREP: create(PromoterEvent, tx)
                    PEREP->>DB: INSERT de la cabecera y de sus allocations
                end
            end
            DB-->>UC: COMMIT
            UC->>PEREP: findView(id)
            PEREP-->>UC: asignación con evento, tipos, cupos y consumo
            UC-->>EDGE: AssignmentView
            EDGE-->>W: 201 Created · AssignmentResponse con allocatedStock, usedStock y remaining
            W-->>AD: promotor asignado al evento
        end
    end
```

### SD-05 · Desasignar un evento

`DELETE /api/v1/promoters/{id}/assignments/{promoterEventId}` · `@Roles('admin_local')`

```mermaid
sequenceDiagram
    autonumber
    actor AD as Admin de local
    participant W as Tabla de asignaciones
    participant EDGE as Edge API
    participant UC as UnassignEventUseCase
    participant PCREP as PromoCodeRepository
    participant PEREP as PromoterEventRepository
    participant DB as PostgreSQL

    note over AD, EDGE: Fase 1 · Comprobaciones de pertenencia
    AD->>W: retira un evento de un promotor
    W->>EDGE: DELETE /api/v1/promoters/{id}/assignments/{promoterEventId} · Bearer
    EDGE->>UC: execute({ promoterId, promoterEventId, scope })
    UC->>DB: SELECT del promotor por id
    alt no existe
        UC-->>EDGE: PromoterNotFoundError · 404
    else existe
        UC->>UC: assertTenant(scope, promoter.companyId) → SD-A
        UC->>PEREP: findHeader(promoterEventId)
        PEREP-->>UC: cabecera o null
        alt la asignación no existe o es de otro promotor
            UC-->>EDGE: PromoterEventNotFoundError · 404
        else asignación válida

            note over UC, DB: Fase 2 · Qué pasa con los códigos ya emitidos
            critical Tx única (UnitOfWork)
                UC->>PCREP: deactivateUnredeemedByPromoterEvent(promoterEventId, tx)
                PCREP->>DB: UPDATE promo_code SET is_active = false en los NO canjeados
                note over PCREP, DB: Los enlaces compartidos que nadie usó dejan de funcionar:<br/>resolver el código devolverá estado revoked.
                UC->>PEREP: deleteByPromoterAndEvent(promoterId, eventId, tx)
                PEREP->>DB: DELETE de la cabecera y sus allocations
                note over PEREP, DB: Los códigos YA canjeados sobreviven: la clave foránea<br/>promoter_event_id pasa a NULL por ON DELETE SET NULL,<br/>así que sus canjes y sus entradas se conservan.
            end
            DB-->>UC: COMMIT
            UC-->>EDGE: void
            EDGE-->>W: 204 No Content
            W-->>AD: asignación retirada
            note over UC, DB: Efecto colateral: al perder promoter_event_id, un canje pasado<br/>deja de poder rastrearse hasta la asignación que lo originó. Ver §12.
        end
    end
```

---

## 8. Bloque 3 · Códigos del promotor

### SD-06 · Generar un código desde el cupo

`POST /api/v1/promoters/me/redemption-codes` · `@Roles('promoter')` · `GenerateRedemptionCodeUseCase`

```mermaid
sequenceDiagram
    autonumber
    actor PR as Promotor
    participant W as Panel de promotor
    participant EDGE as Edge API
    participant UC as GenerateRedemptionCodeUseCase
    participant PEREP as PromoterEventRepository
    participant PCREP as PromoCodeRepository
    participant DB as PostgreSQL

    note over PR, UC: Fase 1 · Identidad del promotor y pertenencia de la asignación
    PR->>W: genera un código para un tipo de entrada de un evento suyo
    W->>EDGE: POST /api/v1/promoters/me/redemption-codes · Bearer · { promoterEventId, ticketTypeId }
    EDGE->>EDGE: AuthGuard → RolesGuard @Roles('promoter') → Zod
    EDGE->>UC: execute({ userId, dto })
    UC->>DB: SELECT del promotor ACTIVO ligado a este userId
    alt sin promotor activo para ese usuario
        DB-->>UC: null
        UC-->>EDGE: PromoterNotFoundError · 404
        note over UC, DB: El vínculo se busca por userId. Un promotor sin usuario ligado<br/>nunca llega hasta aquí. Ver §12.
    else promotor activo
        UC->>PEREP: findHeader(promoterEventId)
        alt la asignación no existe o no está activa
            UC-->>EDGE: PromoterEventNotFoundError · 404
        else activa
            alt la asignación es de otro promotor
                UC-->>EDGE: AssignmentForbiddenError · 403
            else asignación propia

                note over UC, DB: Fase 2 · Consumo de una unidad del cupo
                UC->>PEREP: getAllocation(promoterEventId, ticketTypeId)
                PEREP->>DB: SELECT del cupo con remaining, discountType y discountValue
                alt el tipo de entrada no está asignado
                    UC-->>EDGE: AllocationNotFoundError · 404
                else sin cupo restante
                    UC-->>EDGE: AllocationExhaustedError
                    EDGE-->>W: 409 · { code promoters/allocation_exhausted }
                else cupo disponible

                    note over UC, PCREP: Fase 3 · Código legible y único
                    loop hasta 6 intentos
                        UC->>UC: generateReadableCode con alfabeto Crockford de 6 caracteres
                        UC->>PCREP: existsByCode(code)
                    end
                    note over UC: Alfabeto sin caracteres ambiguos, sin 0, 1, O, I, L ni U:<br/>pensado para dictarse en la puerta sin errores.
                    UC->>PCREP: createGenerated con snapshot de descuento del cupo
                    PCREP->>DB: INSERT INTO promo_code ligado al promotor y a la asignación
                    DB-->>PCREP: fila creada
                    note over UC, DB: El descuento se copia en el momento de crear: cambiar el cupo<br/>después no altera los códigos ya emitidos.
                    UC-->>EDGE: RedemptionCodeView
                    EDGE-->>W: 201 Created · RedemptionCodeResponse con shareUrl
                    W-->>PR: código listo para compartir
                end
            end
        end
    end
```

### SD-07 · Compartir y resolver el enlace corto

`GET /p/{code}` en la web y resolución pública del código. Contraparte de SD-05 de *Entradas*.

```mermaid
sequenceDiagram
    autonumber
    actor PR as Promotor
    actor IN as Invitado
    participant W as Route Handler /p/{code}
    participant EDGE as Edge API
    participant UC as ResolveRedemptionCode y RegisterRedemptionClick
    participant DB as PostgreSQL

    note over PR, IN: Fase 1 · Reparto del enlace
    PR->>PR: copia el shareUrl del panel, con forma WEB_PUBLIC_URL más /p/{code}
    PR->>IN: comparte el enlace por mensajería o redes

    note over IN, DB: Fase 2 · Resolución del código
    IN->>W: GET /p/{code}
    W->>EDGE: resolución pública del código de canje
    EDGE->>UC: ResolveRedemptionCodeUseCase.execute(code)
    UC->>DB: SELECT de la vista del código con promotor, evento y tipo de entrada
    alt código inexistente
        DB-->>UC: null
        UC-->>EDGE: { valid false, reason "Código no encontrado" }
    else encontrado
        DB-->>UC: vista resuelta
        alt is_active en false
            UC->>UC: status revoked
        else pasó validUntil
            UC->>UC: status expired
        else usedCount alcanzó la cuota
            UC->>UC: status redeemed
        else vigente
            UC->>UC: status active y valid true
        end
        UC->>UC: isFree cuando el descuento es porcentual y vale 100
        UC->>UC: savings acotado al precio del tipo de entrada
        UC-->>EDGE: ResolveRedemptionCodeResponse
    end
    EDGE-->>W: 200 OK · payload con promotor, evento, tipo, isFree y savings

    note over W, IN: Fase 3 · Métrica y redirección
    W-)EDGE: RegisterRedemptionClickUseCase incrementa promo_code.clicks
    note over W, EDGE: Clic best-effort: se dispara sin esperar respuesta para no<br/>retrasar ni romper la redirección del invitado.
    alt código válido y con evento
        W-->>IN: 307 → /checkout?event={slug}&code={code}
    else inválido, expirado o API caída
        W-->>IN: 307 → /events
    end
```

### SD-08 · Canje y consumo del cupo

Vista del canje desde el cupo del promotor. El detalle del descuento está en SD-06 de *Entradas*.

```mermaid
sequenceDiagram
    autonumber
    actor IN as Invitado
    participant CO as CheckoutUseCase (ticketing)
    participant PROMO as PromoRedemptionService
    participant DOM as Aggregate PromoCode
    participant PCREP as PromoCodeRepository
    participant DB as PostgreSQL
    participant W as Panel de promotor

    note over IN, DOM: Fase 1 · Validación previa, sin efectos
    IN->>CO: checkout con el código precargado desde el enlace corto
    CO->>PROMO: preview({ code, userId, eventId, subtotal, items })
    PROMO->>PCREP: findByCode(code)
    PCREP-->>PROMO: PromoCode o null
    alt código inexistente
        PROMO-->>CO: PromoCodeNotFoundError · 404
    else existe
        PROMO->>DOM: isValid con vigencia, cupo y scope
        alt no aplica
            DOM-->>PROMO: { valid false, reason }
            PROMO-->>CO: PromoCodeInvalidError · 422 con el motivo
        else aplica
            PROMO->>PCREP: listRedemptionsByUser(userId)
            alt ese usuario ya canjeó este código
                PROMO-->>CO: PromoCodeAlreadyRedeemedError · 409
                note over PROMO, DB: Corte temprano antes de cobrar. La barrera dura es el UNIQUE<br/>de promo_code_id más user_id en el esquema.
            else primer canje
                PROMO->>DOM: computeDiscount con base en la línea del tipo si el scope lo exige
                DOM-->>PROMO: descuento
                PROMO-->>CO: { promoCodeId, discount }

                note over CO, DB: Fase 2 · Registro del canje en la Tx del checkout
                critical Tx del checkout
                    CO->>PROMO: redeem({ promoCodeId, orderId, userId, discount }, tx)
                    PROMO->>DB: INSERT INTO promo_code_redemption
                    PROMO->>DB: UPDATE promo_code SET used_count = used_count + 1
                end
                DB-->>CO: COMMIT
                note over PROMO, DB: Si el checkout aborta, el canje no se registra y el código<br/>sigue disponible: un pago fallido no quema una entrada del cupo.

                note over W, DB: Fase 3 · Lo que ve el promotor
                W->>DB: GET /promoters/me/redemption-codes con usedCount y clicks
                DB-->>W: sus códigos con estado derivado
                W->>DB: GET /promoters/me/assignments con allocatedStock, usedStock y remaining
                DB-->>W: consumo del cupo por tipo de entrada
                note over W, DB: El promotor ve cuántos códigos generó, cuántos se canjearon y<br/>cuánto cupo le queda. Lo que NO ve es su comisión: ver SD-10 y SD-11.
            end
        end
    end
```

---

## 9. Bloque 4 · Clics, atribución y liquidación

### SD-09 · Clics: dos contadores, dos caminos

Existen dos mecanismos de conteo independientes que nunca se cruzan.

```mermaid
sequenceDiagram
    autonumber
    actor IN as Invitado
    participant W as Web
    participant EDGE as Edge API
    participant UC1 as RegisterRedemptionClickUseCase
    participant UC2 as RegisterReferralClickUseCase
    participant DB as PostgreSQL

    note over IN, DB: Camino A · Enlace de un código de canje, en uso
    IN->>W: GET /p/{code}
    W-)EDGE: registro de clic best-effort
    EDGE->>UC1: execute(code)
    UC1->>DB: UPDATE promo_code SET clicks = clicks + 1 WHERE code = ?
    DB-->>UC1: fila actualizada
    note over UC1, DB: Este contador SÍ se alimenta: es el que ve el promotor<br/>junto a cada código en su panel.

    note over IN, DB: Camino B · Enlace de referido del promotor, sin uso
    IN->>W: GET /r/{code}
    note over W: La ruta /r/{code} NO existe en apps/web: responde 404.<br/>El enlace que se entrega al promotor está roto. Ver §12.
    W-->>IN: 404 Not Found
    note over EDGE, UC2: POST /promoters/referrals/{code}/click existe y es público,<br/>pero ningún cliente lo invoca.
    EDGE->>UC2: execute(code) — camino nunca ejercido
    UC2->>DB: UPDATE referral_link SET clicks = clicks + 1
    note over UC2, DB: referral_link.clicks se queda en cero de forma permanente,<br/>aunque el campo se devuelve en PromoterResponse.
```

### SD-10 · Atribución de ventas

`AttributeSaleUseCase`, gatillado por `OrderPaid`. Implementado y **hoy inerte**.

```mermaid
sequenceDiagram
    autonumber
    participant CO as CheckoutUseCase
    participant BUS as EventBus
    participant SUB as OrderPaidSubscriber
    participant UC as AttributeSaleUseCase
    participant DOM as Aggregate SaleAttribution
    participant SAREP as SaleAttributionRepository
    participant DB as PostgreSQL

    note over CO, SUB: Fase 1 · Gatillo por evento de dominio
    CO-)BUS: OrderPaidEvent { orderId, userId, total, referralCode }
    BUS-)SUB: suscriptor de checkout.order_paid
    SUB->>SUB: si referralCode viene en null, no hace nada
    note over CO, SUB: Aquí muere el flujo hoy: el checkout web nunca informa<br/>referralCode. CreateOrderDto lo admite, useCheckoutForm no lo rellena.

    note over UC, DB: Fase 2 · Camino implementado, si algún cliente informara el código
    SUB->>UC: execute({ orderId, referralCode, amount })
    UC->>SAREP: existsForOrder(orderId)
    alt la orden ya fue atribuida
        SAREP-->>UC: true
        UC-->>SUB: retorna sin duplicar
        note over UC, SAREP: Idempotencia por orden: un reintento del evento no genera<br/>dos comisiones.
    else sin atribución previa
        UC->>DB: SELECT del referral_link por código
        alt link inexistente o inactivo
            UC-->>SUB: retorna en silencio
        else link activo
            UC->>DB: SELECT del promotor del link
            alt promotor inexistente o no activo
                UC-->>SUB: retorna en silencio
                note over UC: Best-effort en todo el camino: ningún fallo de atribución<br/>puede romper un pago ya cobrado.
            else promotor activo
                UC->>DOM: SaleAttribution.estimate con PROMOTER_COMMISSION_RATE
                DOM->>DOM: commissionAmount = importe por tasa, redondeado a dos decimales
                DOM->>DOM: status estimated
                note over DOM: La tasa se guarda como snapshot en la fila: cambiarla después<br/>no recalcula comisiones pasadas. Hoy viene de una variable de<br/>entorno, con TODO para moverla a PLATFORM_SETTING.
                DOM-->>UC: SaleAttribution
                UC->>SAREP: create(attribution)
                SAREP->>DB: INSERT INTO sale_attribution
                DB-->>SAREP: fila creada
            end
        end
    end
    note over CO, DB: ADR 0003: NO hay ventana de atribución de 7 días. El modelo vivo es<br/>el canje de códigos, que sí registra promo_code_redemption pero NO<br/>escribe sale_attribution. Ver §12.
```

### SD-11 · Liquidación de comisiones

#### SD-11a · Estado actual (AS-IS)

```mermaid
sequenceDiagram
    autonumber
    actor PR as Promotor
    participant W as Panel de promotor
    participant EDGE as Edge API
    participant UC as ListPromoterSalesUseCase
    participant DB as PostgreSQL

    note over PR, DB: Fase 1 · Consulta de comisiones
    PR->>W: abre su resumen de ventas
    W->>EDGE: GET /api/v1/promoters/{id}/sales · Bearer
    EDGE->>EDGE: AuthGuard → RolesGuard @Roles('promoter')
    EDGE->>UC: execute({ promoterId, actorUserId, isSuperAdmin })
    UC->>DB: SELECT del promotor por id
    alt el promotor no es del actor y el actor no es super_admin
        UC-->>EDGE: TenantForbiddenError · 403
        note over UC: Un promotor solo ve SUS comisiones. super_admin ve todas.
    else autorizado
        UC->>DB: SELECT * FROM sale_attribution WHERE promoter_id = ?
        DB-->>UC: filas
        UC->>UC: suma commissionAmount y redondea a dos decimales
        UC-->>EDGE: { promoterId, attributions, totalCommission }
        EDGE-->>W: 200 OK · PromoterSalesResponse
        W-->>PR: total de comisiones y detalle por orden
    end

    note over EDGE, DB: Fase 2 · Lo que NO existe
    note over DB: sale_attribution nace siempre en estado estimated. No hay método en<br/>el aggregate ni endpoint que la pase a confirmed o a void, ni registro<br/>de pago al promotor. El ciclo de comisiones no cierra.
    note over PR, DB: Y como la atribución está inerte (SD-10), en la práctica esta<br/>consulta devuelve cero atribuciones y cero comisión.
```

#### SD-11b · Diseño propuesto (TO-BE)

Cierre del ciclo apoyado en piezas que ya existen: el canje de códigos como fuente de verdad, la tasa
de comisión centralizada y los estados ya declarados en `SaleStatus`.

```mermaid
sequenceDiagram
    autonumber
    participant CO as CheckoutUseCase
    participant BUS as EventBus
    participant SUB as Suscriptor de atribución propuesto
    participant UC as Confirm y Void Attribution propuestos
    participant DB as PostgreSQL
    actor AD as Admin o plataforma
    actor PR as Promotor

    note over CO, DB: Fase 1 · Atribuir por el canje, no por el referralCode
    CO-)BUS: OrderPaidEvent con el promoCodeId canjeado en la orden
    BUS-)SUB: suscriptor de checkout.order_paid
    SUB->>DB: SELECT del promoter_id del promo_code canjeado
    DB-->>SUB: promoterId o null
    opt el código pertenece a un promotor
        SUB->>DB: INSERT INTO sale_attribution con status estimated
        note over SUB, DB: Fuente de verdad: promo_code_redemption más promo_code.promoter_id,<br/>que es el modelo que sí está vivo hoy.
    end

    note over UC, DB: Fase 2 · Cierre del estado tras el evento
    AD->>UC: confirmar las atribuciones de un evento ya celebrado
    UC->>DB: UPDATE sale_attribution SET status = 'confirmed' donde la entrada se usó
    note over UC, DB: Solo se confirma lo realmente asistido: se cruza contra ticket.status<br/>igual a used, que es el mismo criterio que habilita reseñar.
    UC->>DB: UPDATE sale_attribution SET status = 'void' si la orden se anuló o el evento se canceló
    DB-->>UC: filas actualizadas

    note over AD, PR: Fase 3 · Liquidación
    AD->>UC: generar la liquidación de un periodo
    UC->>DB: SELECT de atribuciones confirmed y sin liquidar, agrupadas por promotor
    DB-->>UC: totales por promotor
    UC->>DB: INSERT de la liquidación con su periodo, importe y estado
    UC->>DB: UPDATE de las atribuciones incluidas marcándolas como liquidadas
    UC-->>AD: resumen de la liquidación
    AD-->>PR: pago fuera de la plataforma, con el comprobante referenciado
    note over UC, DB: El pago en sí queda fuera de alcance. Lo que falta en el sistema es<br/>el registro auditable de qué se liquidó, a quién y por qué periodo.
```

---

## 10. Bloque 5 · Estados

### ED-1 · Máquina de estados del promotor

Complemento a los diagramas de secuencia. Incluye el estado declarado en `PromoterStatus` que nada
asigna.

```mermaid
stateDiagram-v2
    direction LR
    [*] --> pending : Promoter.invite() desde el panel
    [*] --> active : Promoter.create() al aprobar una postulación
    pending --> active : confirm(userId) — la persona acepta
    pending --> inactive : reject() — la persona rechaza
    active --> [*]

    note right of pending
        Sin link de referido y sin rol.
        El match con la persona es por
        userId o por invitedEmail.
    end note

    note right of active
        Único estado que permite asignar
        eventos, generar códigos y
        recibir atribuciones.
    end note

    note left of inactive
        Terminal: no hay reactivación.
        La empresa debe invitar de nuevo.
    end note

    suspended --> active : sin transición implementada

    note left of suspended
        Estado muerto: declarado en
        PromoterStatus y nunca asignado.
    end note
```

---

## 11. Trazabilidad: proceso → endpoint → código → estado

| Proceso | Endpoint(s) | Caso de uso / componente | Estado |
|---|---|---|---|
| Postulación pública | `POST /promoter-applications` | `ApplyPromoterUseCase` | ⚠️ Nunca liga el usuario postulante |
| Revisión de postulación | `POST /promoter-applications/{id}/review` | `ReviewPromoterApplicationUseCase` | ⚠️ Crea promotor y link, pero no otorga el rol |
| Invitar promotor | `POST /promoters` | `CreatePromoterUseCase` | ✅ Implementado, sin notificación |
| Aceptar o rechazar vínculo | `POST /promoters/{id}/confirm` y `/reject` | `ConfirmPromoterAssociationUseCase`, `PromoterConfirmedSubscriber` | ✅ Implementado, otorga el rol por evento |
| Asignar evento y cuotas | `POST /promoters/{id}/assignments` | `AssignEventToPromoterUseCase` | ✅ Implementado, upsert idempotente |
| Desasignar | `DELETE /promoters/{id}/assignments/{id}` | `UnassignEventUseCase` | ⚠️ Los canjes pasados pierden su asignación |
| Generar código | `POST /promoters/me/redemption-codes` | `GenerateRedemptionCodeUseCase` | ✅ Implementado, consume cupo |
| Compartir código | `GET /p/{code}` en la web | `ResolveRedemptionCodeUseCase` | ✅ Implementado |
| Enlace de referido | `referralUrlFor` genera `/r/{code}` | — | ❌ La ruta no existe en la web |
| Clic de código | `RegisterRedemptionClickUseCase` | `promo_code.clicks` | ✅ En uso |
| Clic de referido | `POST /promoters/referrals/{code}/click` | `RegisterReferralClickUseCase` | ❌ Nadie lo invoca |
| Atribución de ventas | — (suscriptor de `OrderPaid`) | `AttributeSaleUseCase` | ❌ Inerte: nadie envía `referralCode` |
| Consulta de comisiones | `GET /promoters/{id}/sales` | `ListPromoterSalesUseCase` | ⚠️ Implementado, devuelve cero en la práctica |
| Liquidación | — | — | ❌ No existe (ver SD-11b) |

---

## 12. Brechas y riesgos detectados al levantar los flujos

Hallazgos de la lectura del código, ordenados por impacto. No forman parte del pedido, pero
condicionan la fidelidad de los diagramas.

1. **La atribución de ventas está inerte, así que no hay comisiones.** `AttributeSaleUseCase` solo
   actúa si `OrderPaidEvent` trae `referralCode`, y el checkout web nunca lo envía: `CreateOrderDto`
   lo admite pero `useCheckoutForm` no lo rellena. Consecuencia directa: `sale_attribution` no se
   escribe jamás y `GET /promoters/{id}/sales` devuelve siempre cero atribuciones y cero comisión. El
   modelo que sí está vivo, el canje de códigos, no genera atribución alguna. El propio ADR 0003
   documenta el re-cableado pendiente.
2. **No hay liquidación.** `SaleAttribution` nace `estimated` y no existe ningún método en el
   aggregate ni endpoint que la pase a `confirmed` o `void`, ni registro de pago al promotor. Aunque
   se arreglara el punto 1, el ciclo seguiría sin cerrar.
3. **El enlace de referido apunta a una ruta que no existe.** `referralUrlFor` construye
   `{WEB_PUBLIC_URL}/r/{code}` y `apps/web/app/r` no existe: responde 404. Ese es el enlace que se
   entrega al promotor al aprobar su postulación y al confirmar su asociación, y se devuelve en
   `PromoterResponse.referralLink.url`.
4. **La postulación pública nunca liga al usuario.** `PromoterApplicationsController` llama a
   `apply.execute({ dto })` sin `applicantUserId`, así que la postulación guarda `null` incluso si la
   persona tenía sesión. Al aprobarla, el `Promoter` se crea con `userId` en `null` y
   `findActiveByUserId` no lo encontrará nunca: ese promotor no puede generar códigos ni consultar sus
   ventas.
5. **Aprobar una postulación no otorga el rol `promoter`.** Solo la confirmación de una *invitación*
   publica `PromoterAssociationConfirmedEvent`, que es lo que dispara `GrantRoleUseCase`. Quien entra
   por la vía de postulación queda como promotor activo sin acceso al panel.
6. **`referral_link.clicks` se queda en cero para siempre.** El endpoint público
   `POST /promoters/referrals/{code}/click` existe y ningún cliente lo llama. El campo se sigue
   devolviendo en la respuesta como si midiera algo.
7. **No hay listado de postulaciones.** Igual que en afiliaciones y verificaciones de local: existen
   el alta y la revisión por id, pero no un `GET`. El admin necesita el UUID por un canal externo.
8. **Desasignar rompe la trazabilidad de los canjes pasados.** El borrado de la asignación deja
   `promo_code.promoter_event_id` en `NULL` por `ON DELETE SET NULL`: el canje sobrevive, pero ya no
   puede rastrearse hasta el cupo y el evento que lo originaron.
9. **La tasa de comisión no es configurable por plataforma.** `PROMOTER_COMMISSION_RATE` sale de una
   variable de entorno, con un TODO explícito para moverla a `PLATFORM_SETTING`. Guardarla como
   snapshot en cada atribución sí es correcto y no debe cambiarse.
10. **Invitar no notifica.** La persona invitada solo descubre la invitación si entra a su cuenta y
    abre `/account/invitaciones`. No se encola ningún correo, teniendo la cadena de outbox disponible.
11. **`suspended` es un estado muerto** en `PromoterStatus`: no hay forma de suspender temporalmente a
    un promotor sin dejarlo `inactive`, que es terminal.

---

## 13. Mantenimiento

- **Fuente de verdad funcional:** `../der_class/PROJECT_SPECS.md` (§N) y `docs/adr/0003-modelo-atribucion-promo-codes.md`
  para el modelo de atribución. Toda desviación se registra como ADR en `docs/adr/`.
- Al cambiar un caso de uso de `apps/api/src/modules/promoters/`, el `PromoRedemptionPort` que consume
  Ticketing o el suscriptor de Identity, actualizar el diagrama correspondiente **en el mismo PR** y
  revisar la tabla del §11.
- Antes de mergear, ejecutar el comando de validación de §3.6: los 14 diagramas deben renderizar.
- Los diagramas nombran casos de uso, endpoints y columnas reales a propósito: un `grep` del nombre en
  el repo debe encontrar el código. Si no lo encuentra, el diagrama está desactualizado.
