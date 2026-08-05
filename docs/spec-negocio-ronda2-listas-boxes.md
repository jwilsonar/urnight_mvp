# Spec de negocio — Ronda 2: listas, boxes, pulseras y barra (2026-08)

> Para: Wilson (backend) y Piero (frontend). Origen: segunda entrevista con el
> insider de discotecas de Lima (referencias: LIMA BAR / Larcomar).
> Complementa `docs/spec-backend-negocio-discotecas.md` (ronda 1). Aquí solo van
> los **deltas**: lo que la ronda 1 no cubría o cubría mal, más las decisiones de
> alcance que la entrevista permite tomar.

## 1. Lo que la entrevista confirma (no hay que cambiar nada)

- Reservas de box con adelanto 50 % o 100 % y depósito a cuenta del local → ya modelado en ronda 1 (`venue_policy.advance_pct`).
- Paloteo "vengo de parte de" → ya modelado.
- Zonas custom por local (General / VIP / SUPER VIP / BOX) → ya modelado.
- Reclamo #1 del rubro ("pagué mi box y no aparece en la lista") → sigue siendo el objetivo central.

## 2. Deltas — lo que falta modelar

### 2.1 La lista NO es un canal general (corrige un supuesto de la ronda 1)

Hallazgo: *"Para general no hay lista, solamente es con códigos."* La lista existe solo para **VIP / SUPER VIP** y para invitados cercanos a la marca.

Implicación: `guest_list` debe colgar de una **zona/tier**, no del evento a secas. La UI de admin no debe ofrecer lista para General; debe ofrecer solo códigos QR.

```
guest_list_entry
  event_id        uuid FK event
  zone_id         uuid FK venue_zone      -- solo tiers no-general
  promoter_id     uuid FK promoter NULL   -- null = invitado de la casa
  full_name       varchar(120)
  document_number varchar(20) NULL        -- DNI: se pide SIEMPRE en puerta
  preferential    boolean default false   -- "fast pass" de promotor
  status          varchar(12) CHECK (status IN ('pending','admitted','rejected','no_show'))
```

### 2.2 La lista no garantiza el ingreso (riesgo legal)

Hallazgo: *"si se llenó aforo y hay gente de la lista, a veces se les deja entrar, a veces no"*. Los invitados de promotor sí tienen preferencia, tipo fast pass.

Decisiones:
- `preferential` como flag explícito, visible en puerta.
- **Copy obligatorio** en cualquier pase de lista (web y PDF): estar en lista no garantiza el ingreso; queda sujeto a aforo, políticas del local y criterio de puerta. Esto se alinea con el aviso de intermediación que se está añadiendo al footer.
- Los pases de lista **no** se cobran, así que no generan derecho de reembolso; los tickets pagados sí. Mantener esa frontera clara en el dominio.

### 2.3 Validación en puerta = DNI, no solo QR

Hallazgo: *"Si o si se muestra DNI para corroborar los datos. A veces también piden el código."*

Implicación para el app validador y para `checkin-live`:
- Búsqueda por **nombre y por número de documento** además del escaneo de QR.
- Al validar, mostrar los datos a cotejar (nombre + DNI parcial) para que el portero compare con el documento físico.
- `document_number` debe tratarse como dato personal: no exponerlo completo en listados; enmascarar salvo en el momento de la validación (auditar el acceso vía `AuditInterceptor`).

### 2.4 Pulseras por zona, entregadas al validar

Hallazgo: *"Las pulseras se las entregan en la entrada, se entregan ni bien se valida el QR; son para códigos VIP o SUPER VIP. Si reservas BOX en VIP o SUPER también te entregan las pulseras."*

Implicación: la pantalla de validación exitosa debe decir, en grande, **qué pulsera entregar**. Basta con extender la zona del local:

```
venue_zone
  + wristband_label  varchar(40) NULL   -- "VIP", "SUPER VIP"
  + wristband_color  varchar(9)  NULL   -- hex, ya lo usa el editor de zonas
```

Y en el resultado de validación devolver `wristband: { label, color } | null`. Es barato y resuelve un paso operativo real de puerta.

### 2.5 Cupos y jerarquía de promotores (nuevo)

Hallazgo: *"cada promotor en promedio puede dar 100 a 130 códigos en total [por fecha]. Por arriba de los promotores están los cabeza que tienen 4 a 5 promotores a cargo y claro tienen más conteo."*

Dos cosas que hoy no existen:

```
promoter_quota                 -- cupo por promotor y evento
  event_id, promoter_id, max_codes int, issued_count int
  CHECK (issued_count <= max_codes)          -- barrera DB, igual que sold <= stock

promoter                        -- jerarquía
  + parent_promoter_id uuid FK promoter NULL  -- "cabeza" con 4-5 a cargo
```

Consecuencias a decidir con Wilson antes de implementar:
- El cupo del "cabeza" ¿es propio, o la suma de los de su equipo? Propuesta: cupo propio **más** visibilidad agregada del equipo.
- La comisión en cascada (el cabeza gana un % sobre lo que venden sus promotores) cambia el cálculo de `promoter-ranking`. Propuesta para el MVP: **no** implementar cascada de comisión todavía; sí implementar la jerarquía para agregación de métricas. Registrar la decisión como ADR cuando se tome.

### 2.6 Boxes: quién cobra y qué queda como constancia

Hallazgos: el depósito puede ir a la cuenta del local o al promotor (que luego transfiere); algunos locales ya usan link de pago self-serve; a veces piden datos de todo el grupo, a veces solo del titular.

```
reservation
  + payment_recipient varchar(12) CHECK (payment_recipient IN ('venue','promoter'))
  + proof_object_key  varchar(512) NULL   -- constancia de la venta (S3 key, no URL)
  + group_required    boolean default false
```

Y la **lista de boxes** debe ser una vista de puerta de primera clase: buscar por titular o por código `RV-…`, ver los pases del grupo y su estado. Es exactamente el reclamo #1 del rubro.

## 3. Decisión de alcance: barra e inventario quedan FUERA

La entrevista cierra este frente y ahorra un módulo entero:

- *"Nunca pasa [que se agote un insumo], si o si tienen insumos siempre."*
- *"Todo el inventario se maneja con el sistema que tienen en caja."*
- Personalización: **solo se puede quitar o reducir**, nunca agregar. *"No se realiza [recálculo de precio] por eso no se puede."*

Decisiones:
1. **No construir** módulo de inventario, alertas de quiebre de stock, ni recálculo dinámico de precios. Sería competir con el sistema de caja del local y resolver un problema que no existe.
2. Lo único que sí aporta valor en la carta: una **nota de preparación** por ítem, limitada a quitar/reducir (chips predefinidos por ítem: "sin hielo", "media onza menos", "sin limón"), **sin impacto en el precio**, que viaje al ticket de barra junto al pedido. Barato y elimina fricción real.
3. Registrar esto como no-objetivo explícito para que no vuelva a aparecer en el backlog.

## 4. Backlog de producto (ideas de Piero, priorizadas)

| # | Idea | Valor | Costo | Recomendación |
|---|------|-------|-------|---------------|
| 1 | Aviso de intermediación en footer y términos | Alto (legal) | Bajo | **Hacer ya** — en ejecución |
| 2 | "Tomar bebidas alcohólicas en exceso es dañino" en la carta | Alto (legal PE) | Bajo | **Hacer ya** — en ejecución |
| 3 | Licencias vencidas → el local pasa a *Sin verificar* | Alto (confianza) | — | **Ya implementado.** El worker corre `maintain-local-verifications`, que degrada el local cuando caducan sus documentos; `LocalVerificationDocument` calcula `valid` / `expiring_soon` / `expired` y los días de aviso salen del ajuste `verification_expiry_warning_days`. La cadena está completa en la web: gestor de documentos del admin, cola de revisión de superadmin y sello en la ficha pública del local |
| 4 | MFA (TOTP) para super_admin y admin_local | Alto (seguridad) | Medio | **Siguiente**. Obligatorio para los dos roles con panel; opcional para usuarios finales. Va en el módulo identity, no en el edge |
| 5 | Algoritmo de eventos en tendencia en el home | Medio | Medio | Después. Empezar con una fórmula simple y explicable (ventas recientes + vistas + proximidad de fecha, con decaimiento), no un ranking opaco |
| 6 | Temáticas estacionales (Halloween, Navidad, 14 feb) | Medio (marca) | Bajo–Medio | Después. Si el DS está tokenizado, son *theme packs* con fecha de activación, no ramas por temática. Una rama por temática se vuelve inmantenible |
| 7 | Planes de pago + personalización tipo Wix del local + votación de la comunidad | Alto (ingresos) | **Alto** | Reformular. Un constructor drag-and-drop de HTML es un producto en sí mismo y abre superficie de seguridad (HTML de terceros). Propuesta: 4–6 **plantillas** de página de local + color de acento + orden de secciones + galería, todo dentro del DS. La votación de la comunidad y el destacado en el home funcionan igual y el costo es una fracción |

## 5. Orden de trabajo sugerido

1. ~~Fixes de UX de esta ronda~~ — hecho.
2. ~~Pulseras por zona + búsqueda por documento en puerta~~ — hecho en frontend sobre mocks; falta el backend.
3. MFA de paneles (`super_admin` y `admin_local`).
4. Cupos y jerarquía de promotores (requiere decisión previa sobre comisión en cascada).
5. Lista de boxes como vista de puerta.
6. Todo lo demás.
