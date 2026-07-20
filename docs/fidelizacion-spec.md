# Persistencia de fidelización — especificación para Wilson

## Objetivo

Persistir la configuración global que hoy administra el mock de
`/panel/superadmin/fidelizacion`: insignias, puntos por acción, umbrales de nivel y
multiplicadores. La implementación debe vivir en un módulo de backend propio y
mantener las respuestas HTTP en `camelCase`; las columnas de base de datos usan
`snake_case`.

## Modelo de datos

### `loyalty_config_version`

Agrupa una configuración publicable para que reglas y niveles cambien de forma
atómica.

| Campo                | Tipo                   | Reglas                           |
| -------------------- | ---------------------- | -------------------------------- |
| `id`                 | `uuid`                 | PK                               |
| `version`            | `integer`              | `UNIQUE`, mayor que 0            |
| `status`             | `varchar(16)`          | `draft`, `published`, `archived` |
| `published_at`       | `timestamptz` nullable | requerido al publicar            |
| `created_by_user_id` | `uuid`                 | FK a usuario                     |
| `created_at`         | `timestamptz`          | `NOT NULL`, default `now()`      |
| `updated_at`         | `timestamptz`          | `NOT NULL`, default `now()`      |

Debe existir como máximo una versión con `status = 'published'`.

### `loyalty_badge`

| Campo                   | Tipo           | Reglas                                                |
| ----------------------- | -------------- | ----------------------------------------------------- |
| `id`                    | `uuid`         | PK                                                    |
| `config_version_id`     | `uuid`         | FK a `loyalty_config_version.id`, `ON DELETE CASCADE` |
| `name`                  | `varchar(80)`  | `NOT NULL`                                            |
| `icon`                  | `varchar(32)`  | emoji o identificador de icono, `NOT NULL`            |
| `acquisition_criterion` | `varchar(240)` | descripción visible, `NOT NULL`                       |
| `criterion_code`        | `varchar(64)`  | código estable para evaluación automática             |
| `criterion_config`      | `jsonb`        | parámetros tipados por `criterion_code`               |
| `is_active`             | `boolean`      | default `true`                                        |
| `sort_order`            | `integer`      | default `0`, mayor o igual a 0                        |
| `created_at`            | `timestamptz`  | `NOT NULL`                                            |
| `updated_at`            | `timestamptz`  | `NOT NULL`                                            |

Índice único recomendado: `(config_version_id, lower(name))`.

### `loyalty_point_rule`

| Campo               | Tipo               | Reglas                                                   |
| ------------------- | ------------------ | -------------------------------------------------------- |
| `id`                | `uuid`             | PK                                                       |
| `config_version_id` | `uuid`             | FK a `loyalty_config_version.id`, `ON DELETE CASCADE`    |
| `action_code`       | `varchar(64)`      | código estable y único por versión                       |
| `display_name`      | `varchar(120)`     | nombre mostrado en el panel                              |
| `points`            | `integer`          | entre `0` y `10000`                                      |
| `amount_base_cents` | `integer` nullable | base monetaria cuando aplica, por ejemplo S/ 10 = `1000` |
| `is_active`         | `boolean`          | default `true`                                           |
| `created_at`        | `timestamptz`      | `NOT NULL`                                               |
| `updated_at`        | `timestamptz`      | `NOT NULL`                                               |

Índice único: `(config_version_id, action_code)`.

Acciones iniciales: `ticket_purchase`, `in_venue_order`, `referral_first_purchase`,
`event_check_in` y `approved_review`.

### `loyalty_level`

| Campo               | Tipo           | Reglas                                                |
| ------------------- | -------------- | ----------------------------------------------------- |
| `id`                | `uuid`         | PK                                                    |
| `config_version_id` | `uuid`         | FK a `loyalty_config_version.id`, `ON DELETE CASCADE` |
| `code`              | `varchar(32)`  | código estable y único por versión                    |
| `name`              | `varchar(80)`  | `NOT NULL`                                            |
| `threshold_points`  | `integer`      | mayor o igual a 0                                     |
| `points_multiplier` | `numeric(6,3)` | entre `1.000` y `5.000`                               |
| `sort_order`        | `integer`      | mayor o igual a 0                                     |
| `is_active`         | `boolean`      | default `true`                                        |
| `created_at`        | `timestamptz`  | `NOT NULL`                                            |
| `updated_at`        | `timestamptz`  | `NOT NULL`                                            |

Índices únicos: `(config_version_id, code)` y
`(config_version_id, threshold_points)`. Los umbrales activos deben aumentar en
el mismo orden que `sort_order`; el primer nivel debe empezar en `0`.

## Endpoints de Super Admin

Todas las rutas requieren sesión y rol `super_admin`.

| Método y ruta                                        | Uso                                                                      |
| ---------------------------------------------------- | ------------------------------------------------------------------------ |
| `GET /api/v1/admin/loyalty/config`                   | Devuelve el borrador editable; si no existe, clona la versión publicada. |
| `PUT /api/v1/admin/loyalty/config/point-rules`       | Reemplazo atómico de reglas de puntos del borrador.                      |
| `PUT /api/v1/admin/loyalty/config/levels`            | Reemplazo atómico de niveles y multiplicadores del borrador.             |
| `POST /api/v1/admin/loyalty/config/badges`           | Crea una insignia en el borrador.                                        |
| `PATCH /api/v1/admin/loyalty/config/badges/:badgeId` | Edita nombre, icono, criterio, orden o estado.                           |
| `POST /api/v1/admin/loyalty/config/publish`          | Valida y publica el borrador en una transacción.                         |

`GET /api/v1/loyalty/config` debe exponer solo la versión publicada a los
consumidores que calculan o muestran puntos, niveles e insignias.

## Contratos HTTP

Respuesta de lectura:

```json
{
  "id": "uuid",
  "version": 3,
  "status": "draft",
  "badges": [
    {
      "id": "uuid",
      "name": "Primera vez",
      "icon": "🎟️",
      "acquisitionCriterion": "Primera entrada comprada",
      "criterionCode": "first_ticket_purchase",
      "criterionConfig": {},
      "isActive": true,
      "sortOrder": 0
    }
  ],
  "pointRules": [
    {
      "id": "uuid",
      "actionCode": "ticket_purchase",
      "displayName": "Compra de entrada",
      "points": 10,
      "amountBaseCents": 1000,
      "isActive": true
    }
  ],
  "levels": [
    {
      "id": "uuid",
      "code": "bronze",
      "name": "Bronce",
      "thresholdPoints": 0,
      "pointsMultiplier": 1,
      "sortOrder": 0,
      "isActive": true
    }
  ],
  "updatedAt": "2026-07-20T12:00:00.000Z"
}
```

Los `PUT` reciben arreglos con la misma forma de `pointRules` o `levels`, sin
campos de auditoría. `POST` y `PATCH` de insignias reciben `name`, `icon`,
`acquisitionCriterion`, `criterionCode`, `criterionConfig`, `isActive` y
`sortOrder`.

## Validación y concurrencia

- Nombre de insignia: 2–80 caracteres; icono: 1–32; criterio: 8–240.
- Puntos: entero entre 0 y 10 000.
- Umbral: entero mayor o igual a 0 y estrictamente creciente.
- Multiplicador: decimal entre 1 y 5.
- Validar códigos de acción y criterio contra allowlists del dominio.
- Enviar `version` o `updatedAt` en mutaciones y responder `409` si el borrador
  cambió desde que el panel lo leyó.
- Responder errores de validación con el formato estándar del API y errores por
  campo para que el frontend pueda mapearlos con `useApiMutation`.
- Registrar publicación y cambios de configuración en auditoría con actor,
  versión anterior, versión nueva y timestamp.
