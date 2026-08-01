# Diagramas de secuencia — índice de la serie

> **Qué es esto.** El levantamiento de los flujos de UrNight/RAVENUE en formato *protocol data flow*:
> diagramas de secuencia Mermaid donde cada flecha lleva método, ruta, código de estado y forma del
> payload, y cada fase del pipeline va marcada con un banner. **90 diagramas** repartidos en 7
> documentos, uno por dominio del DER.
>
> Los diagramas reflejan el **código real** de `apps/api`, `apps/web`, `apps/worker`, `apps/validator`
> y `apps/mobile`, no un diseño ideal: donde el flujo está a medio implementar se marca el estado
> (`AS-IS`) y, si corresponde, se propone el `TO-BE` sobre las piezas que ya existen en el repo.
>
> **Fuente de verdad funcional:** `../der_class/PROJECT_SPECS.md` (ruta desde la raíz del repo). La organización de esta carpeta
> sigue el **mapa de dominios de §4.1** de ese documento.

---

## 1. Cómo está organizada la carpeta

El número del archivo **es** el número del dominio en `PROJECT_SPECS.md §4.1`. Los documentos
transversales (canales, plataforma) usan el rango `9x` para no chocar con la numeración de dominios.

```
docs/diagramas-secuencia/
├── README.md                        ← este índice
├── 01-identidad-acceso.md           ← dominio 1
├── 02-descubrimiento-confianza.md   ← dominios 2 + 7
├── 03-empresas-locales.md           ← dominio 3
├── 04-eventos-inventario.md         ← dominio 4
├── 05-entradas-validacion.md        ← dominio 5
├── 06-promotores-atribucion.md      ← dominio 6
└── 90-canales-moviles.md            ← transversal (canal móvil)
```

| Convención | Regla |
|---|---|
| Nombre de archivo | `NN-<dominio-en-kebab-case>.md`, `NN` = dominio del DER (§4.1) |
| Transversales | rango `90`–`99` (canales, plataforma, operación) |
| ID de diagrama | `SD-01`, `SD-02`… por documento; `SD-A`, `SD-B`… para sub-flujos compartidos |
| Desdoblamiento | `SD-05a` / `SD-05b` cuando un proceso tiene `AS-IS` y `TO-BE` |
| Cabecera | todo documento abre con H1, línea **Serie:** con su dominio, y `> Alcance` |

---

## 2. Mapa dominio → documento

| Dominio §4.1 | Entidades núcleo | Documento | Diagramas | Módulos de código |
|---|---|---|---|---|
| **1 · Identity, Access & Legal** | `USER`, `ROLE`, `USER_ROLE`, `USER_PREFERENCE`, `LEGAL_*` | [`01-identidad-acceso.md`](./01-identidad-acceso.md) | 16 | `api/identity`, `edge/`, `web/(auth)` |
| **2 · Taxonomy & Catalogs**<br>**7 · Trust** | `ZONE`, `LOCAL_TYPE`, `MUSIC_GENRE`, `TAG`, `REVIEW`, `REPORT` | [`02-descubrimiento-confianza.md`](./02-descubrimiento-confianza.md) | 12 | `api/catalog`, `api/trust`, `api/identity/favorites`, `web/(consumer)` |
| **3 · Companies & Locals** | `COMPANY`, `LOCAL`, `LOCAL_VERIFICATION`, `AFFILIATION_REQUEST` | [`03-empresas-locales.md`](./03-empresas-locales.md) | 14 | `api/companies`, `api/uploads`, `web/(panels)` |
| **4 · Events & Ticket Types** | `EVENT`, `TICKET_TYPE`, `EVENT_IMAGE` | [`04-eventos-inventario.md`](./04-eventos-inventario.md) | 14 | `api/events`, `InventoryPort` de `ticketing`, `web/(panels)` |
| **5 · Checkout, Payments & Tickets** | `ORDER`, `ORDER_ITEM`, `PAYMENT`, `TICKET`, `ATTENDEE`, `QR_VALIDATION` | [`05-entradas-validacion.md`](./05-entradas-validacion.md) | 13 | `api/ticketing`, `apps/worker`, `web/checkout`, `apps/validator` |
| **6 · Promoters & Promo Codes** | `PROMOTER`, `REFERRAL_LINK`, `SALE_ATTRIBUTION`, `PROMO_CODE*` | [`06-promotores-atribucion.md`](./06-promotores-atribucion.md) | 14 | `api/promoters`, `web/(panels)`, enlace corto |
| **8 · Ops & Platform** | `AUDIT_LOG`, `PLATFORM_SETTING`, `SUPPORT_TICKET`, `NOTIFICATION`, `ANALYTICS_EVENT` | — **pendiente** | — | `edge/AuditInterceptor`, `apps/worker` |
| *Transversal · canal móvil* | — (C4 §7: container `App Móvil`) | [`90-canales-moviles.md`](./90-canales-moviles.md) | 7 | `apps/mobile`, patrón tomado de `apps/validator` y de `apps/web` |

**Total: 90 diagramas.** Los dominios 2 y 7 comparten documento porque el recorrido del consumidor
(descubrir → ver ficha → reseñar/reportar) atraviesa ambos sin corte natural. El dominio 8 aún no
tiene levantamiento.

---

## 3. Qué hay dentro de cada documento

### [`01-identidad-acceso.md`](./01-identidad-acceso.md) — 13 procesos, 16 diagramas
Bloque 0 sub-flujos compartidos (emisión del par de tokens, handoff de sesión web) · Bloque 1 alta y
credenciales (registro, verificación de email, login, Google OIDC, recuperación `AS-IS`/`TO-BE`) ·
Bloque 2 ciclo de vida de la sesión (refresh con rotación, logout) · Bloque 3 cuenta del usuario ·
Bloque 4 RBAC y acceso multi-tenant.

### [`02-descubrimiento-confianza.md`](./02-descubrimiento-confianza.md) — 5 procesos, 12 diagramas
Bloque 0 sub-flujos (lectura pública con ISR, acción autenticada) · Bloque 1 descubrimiento (listados
con filtros, búsqueda global, locales por zona) · Bloque 2 fichas de detalle (evento, local, galería) ·
Bloque 3 confianza (reseñas verificadas por ticket, reportes, favoritos).

### [`03-empresas-locales.md`](./03-empresas-locales.md) — 6 procesos, 14 diagramas
Bloque 0 sub-flujos (aislamiento multi-tenant, subida de imágenes en dos pasos) · Bloque 1 afiliación
(solicitud pública, revisión y alta atómica de empresa + local) · Bloque 2 administrar empresa ·
Bloque 3 ciclo de vida del local · Bloque 4 galería · Bloque 5 verificación.

### [`04-eventos-inventario.md`](./04-eventos-inventario.md) — 3 procesos, 13 diagramas + 1 de estados
Bloque 0 sub-flujos (tenant en Events, flyer en staging: validar y promover) · Bloque 1 ciclo de vida
del evento (crear, editar, publicar, cancelar) · Bloque 2 inventario y tipos de entrada · Bloque 3
agenda y métricas · Bloque 4 diagrama de estados del evento.

### [`05-entradas-validacion.md`](./05-entradas-validacion.md) — 4 procesos, 13 diagramas
Bloque 0 sub-flujos (doble barrera anti-sobreventa y anti-doble-cobro, outbox → relay → worker) ·
Bloque 1 compra estándar (checkout, pago, idempotencia) · Bloque 2 código promocional, canje y entrada
gratuita · Bloque 3 generación y entrega de entradas (PDF, billetera) · Bloque 4 validación en puerta
con cola offline.

### [`06-promotores-atribucion.md`](./06-promotores-atribucion.md) — 5 procesos, 13 diagramas + 1 de estados
Bloque 0 sub-flujo (tenant y consentimiento) · Bloque 1 alta del promotor (postulación pública,
invitar, aceptar/rechazar) · Bloque 2 asignación de eventos y cuotas · Bloque 3 códigos del promotor ·
Bloque 4 clics, atribución en ventana de 7 días y liquidación · Bloque 5 estados.

### [`90-canales-moviles.md`](./90-canales-moviles.md) — 7 diagramas · **casi todo `AS-IS`**
`apps/mobile` implementa pestañas, catálogo público, sesión nativa con par de tokens, compra con
reserva de cupo e idempotencia persistida, entradas con QR sin red y el enlace profundo del código de
promotor: `SD-01` a `SD-06` documentan código existente. Solo el registro de dispositivos y push
(`SD-07`) sigue siendo diseño propuesto, y depende de backend que aún no existe.

---

## 4. Notación

Todos los documentos comparten el estándar definido en
[`01-identidad-acceso.md` §3](./01-identidad-acceso.md) y lo repiten en su propio §3 para ser legibles
de forma aislada. En resumen:

- Cada flecha rotula **método + ruta + código de estado + forma del payload**.
- Cada fase del pipeline (edge, aplicación, persistencia, async) lleva su **banner**.
- Los nombres de casos de uso, endpoints y columnas están **copiados tal cual del código**: un `grep`
  del nombre en el repo debe encontrarlo. Si no lo encuentra, el diagrama está desactualizado.
- Cada documento cierra con **Trazabilidad** (proceso → endpoint → código → estado) y **Brechas y
  riesgos** detectados al levantar los flujos.

---

## 5. Validación

Un documento suelto (véase el §3.x «Validación» de cada archivo):

```bash
npx -y @mermaid-js/mermaid-cli@11 \
  -i docs/diagramas-secuencia/04-eventos-inventario.md \
  -o /tmp/eventos.md
```

Toda la serie:

```bash
for f in docs/diagramas-secuencia/[0-9]*.md; do
  echo "== $f"
  npx -y @mermaid-js/mermaid-cli@11 -i "$f" -o "/tmp/$(basename "$f")" || echo "FALLA: $f"
done
```

---

## 6. Mantenimiento

- **Fuente de verdad funcional:** `../der_class/PROJECT_SPECS.md` (§N, ruta desde la raíz del repo). Toda desviación se
  registra como ADR en [`../adr/`](../adr/).
- Al cambiar un caso de uso, un endpoint o un componente que aparezca en un diagrama, actualizar el
  diagrama **en el mismo PR** y revisar la tabla de trazabilidad de ese documento.
- Antes de mergear, los diagramas deben renderizar (§5).
- **Documento nuevo:** nombrarlo `NN-<dominio>.md` con el número de §4.1 (o `9x` si es transversal),
  añadir la línea **Serie:** bajo el H1 y registrarlo en las tablas de §2 y §3 de este índice.
