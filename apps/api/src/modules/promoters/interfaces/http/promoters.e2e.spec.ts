import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { INestApplication } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import {
  type DbClient,
  company,
  event,
  local,
  order,
  promoter,
  referralLink,
  role,
  saleAttribution,
  user,
  userRole,
} from "@urnight/db";
import request from "supertest";
import {
  createE2EApp,
  seedRoles,
  signAccessToken,
} from "../../../../shared/testing/integration/e2e-app";
import {
  createNamedTestDb,
  ensureNamedDbMigrated,
  truncateAll,
} from "../../../../shared/testing/integration/test-db";

// E2E de todo el HTTP del BC Promoters en UN archivo, con BD privada (paralelo
// seguro): promoter-applications, promoters, promo-codes, referrals y ventas.

const DB = "urnight_test_e2e_promoters";

let app: INestApplication;
let client: DbClient;

beforeAll(async () => {
  await ensureNamedDbMigrated(DB);
  client = createNamedTestDb(DB);
  app = await createE2EApp(client);
}, 60000);

beforeEach(async () => {
  await truncateAll(client);
  await seedRoles(client);
});

afterAll(async () => {
  await app.close();
  await client.sql.end({ timeout: 5 });
});

const http = () => request(app.getHttpServer());

let seq = 0;

/** Siembra una company y devuelve su id (FK promoter.company_id, promo_code, etc.). */
async function seedCompany(): Promise<string> {
  const companyId = randomUUID();
  await client.db.insert(company).values({
    id: companyId,
    legalName: "Compania Demo SAC",
    ruc: `2010000000${(seq++ % 10).toString()}`,
    commercialName: "Demo",
  });
  return companyId;
}

/** Siembra un local dentro de una company y devuelve su id. */
async function seedLocal(companyId: string): Promise<string> {
  const localId = randomUUID();
  await client.db.insert(local).values({
    id: localId,
    companyId,
    name: "Local Demo",
    slug: `local-demo-${localId}`,
  });
  return localId;
}

/** Registra un usuario real en la BD (FK reviewed_by/applicant_user_id/order.user). */
async function seedUser(): Promise<string> {
  const userId = randomUUID();
  await client.db.insert(user).values({
    id: userId,
    fullName: "Usuario Demo",
    email: `user-${userId}@example.com`,
  });
  return userId;
}

/** Siembra un promotor + su referral link, devolviendo los ids. */
async function seedPromoter(
  companyId: string,
  code: string,
  userId: string | null = null,
): Promise<{ promoterId: string; referralLinkId: string }> {
  const promoterId = randomUUID();
  const referralLinkId = randomUUID();
  await client.db
    .insert(promoter)
    .values({ id: promoterId, companyId, userId, name: "Promotor Demo" });
  await client.db.insert(referralLink).values({
    id: referralLinkId,
    promoterId,
    code,
    url: `https://urnight.pe/r/${code}`,
  });
  return { promoterId, referralLinkId };
}

/** Siembra una venta atribuida a un promotor (company → local → event → user → order). */
async function seedAttributedSale(
  companyId: string,
  promoterId: string,
  referralLinkId: string,
  commissionAmount: string,
): Promise<string> {
  const localId = await seedLocal(companyId);
  const eventId = randomUUID();
  const buyerId = await seedUser();
  const orderId = randomUUID();
  await client.db.insert(event).values({
    id: eventId,
    localId,
    name: "Evento Demo",
    slug: `evento-demo-${eventId}`,
    startsAt: new Date("2026-02-01T22:00:00Z"),
  });
  await client.db.insert(order).values({
    id: orderId,
    orderCode: `ORD-${(seq++).toString().padStart(8, "0")}`,
    userId: buyerId,
    eventId,
    subtotal: "100.00",
    total: "100.00",
  });
  await client.db.insert(saleAttribution).values({
    id: randomUUID(),
    orderId,
    promoterId,
    referralLinkId,
    commissionRate: "0.0500",
    commissionAmount,
  });
  return orderId;
}

describe("Promoters HTTP (e2e)", () => {
  describe("PromoterApplicationsController (/promoter-applications)", () => {
    const APPLY = {
      name: "Postulante Promo",
      contactEmail: "promo@example.com",
    };

    it("POST /promoter-applications → 201 público crea la postulación", async () => {
      const res = await http()
        .post("/api/v1/promoter-applications")
        .send(APPLY);
      expect(res.status).toBe(201);
      expect(typeof res.body.id).toBe("string");
      expect(res.body.name).toBe("Postulante Promo");
      expect(res.body.status).toBe("pending");
      expect(res.body.createdPromoterId).toBeNull();
    });

    it("POST /promoter-applications → 422 Problem+JSON con body inválido", async () => {
      const res = await http()
        .post("/api/v1/promoter-applications")
        .send({ name: "a" });
      expect(res.status).toBe(422);
      expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
      expect(res.body.status).toBe(422);
      expect(res.body.errors).toBeDefined();
    });

    it("POST /:id/review → 401 sin token", async () => {
      const res = await http()
        .post(`/api/v1/promoter-applications/${randomUUID()}/review`)
        .send({ decision: "rejected" });
      expect(res.status).toBe(401);
    });

    it("POST /:id/review → 403 con rol insuficiente (user)", async () => {
      const token = await signAccessToken(app, randomUUID(), ["user"]);
      const res = await http()
        .post(`/api/v1/promoter-applications/${randomUUID()}/review`)
        .set("Authorization", `Bearer ${token}`)
        .send({ decision: "rejected" });
      expect(res.status).toBe(403);
    });

    it("POST /:id/review → 422 con decisión inválida", async () => {
      const reviewerId = await seedUser();
      const token = await signAccessToken(app, reviewerId, ["admin_local"]);
      const res = await http()
        .post(`/api/v1/promoter-applications/${randomUUID()}/review`)
        .set("Authorization", `Bearer ${token}`)
        .send({ decision: "maybe" });
      expect(res.status).toBe(422);
      expect(res.body.status).toBe(422);
    });

    it("POST /:id/review → 403 al aprobar sin company scope en el token", async () => {
      const application = await http()
        .post("/api/v1/promoter-applications")
        .send(APPLY);
      const reviewerId = await seedUser();
      const token = await signAccessToken(app, reviewerId, ["admin_local"]);
      const res = await http()
        .post(`/api/v1/promoter-applications/${application.body.id}/review`)
        .set("Authorization", `Bearer ${token}`)
        .send({ decision: "approved" });
      expect(res.status).toBe(403);
    });

    it("POST /:id/review → 404 Problem+JSON si la postulación no existe", async () => {
      const reviewerId = await seedUser();
      const token = await signAccessToken(app, reviewerId, ["admin_local"]);
      const res = await http()
        .post(`/api/v1/promoter-applications/${randomUUID()}/review`)
        .set("Authorization", `Bearer ${token}`)
        .send({ decision: "rejected" });
      expect(res.status).toBe(404);
      expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
      expect(res.body.code).toBe("promoters/application-not-found");
    });

    it("POST /:id/review → 200 rechaza una postulación pendiente", async () => {
      const application = await http()
        .post("/api/v1/promoter-applications")
        .send(APPLY);
      const reviewerId = await seedUser();
      const token = await signAccessToken(app, reviewerId, ["admin_local"]);
      const res = await http()
        .post(`/api/v1/promoter-applications/${application.body.id}/review`)
        .set("Authorization", `Bearer ${token}`)
        .send({ decision: "rejected" });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("rejected");
      expect(res.body.createdPromoterId).toBeNull();
    });

    it("POST /:id/review → 200 aprueba y crea el promotor", async () => {
      const companyId = await seedCompany();
      const application = await http()
        .post("/api/v1/promoter-applications")
        .send(APPLY);
      const reviewerId = await seedUser();
      const token = await signAccessToken(app, reviewerId, ["admin_local"], {
        companyId,
      });
      const res = await http()
        .post(`/api/v1/promoter-applications/${application.body.id}/review`)
        .set("Authorization", `Bearer ${token}`)
        .send({ decision: "approved", companyId });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("approved");
      expect(typeof res.body.createdPromoterId).toBe("string");
    });

    it("POST /:id/review → 409 si la postulación ya fue revisada", async () => {
      const application = await http()
        .post("/api/v1/promoter-applications")
        .send(APPLY);
      const reviewerId = await seedUser();
      const token = await signAccessToken(app, reviewerId, ["admin_local"]);
      await http()
        .post(`/api/v1/promoter-applications/${application.body.id}/review`)
        .set("Authorization", `Bearer ${token}`)
        .send({ decision: "rejected" });
      const res = await http()
        .post(`/api/v1/promoter-applications/${application.body.id}/review`)
        .set("Authorization", `Bearer ${token}`)
        .send({ decision: "rejected" });
      expect(res.status).toBe(409);
      expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
      expect(res.body.code).toBe("promoters/application-already-reviewed");
    });
  });

  describe("PromotersController (/promoters)", () => {
    it("POST /promoters → 401 sin token", async () => {
      const res = await http()
        .post("/api/v1/promoters")
        .send({ name: "X", companyId: randomUUID() });
      expect(res.status).toBe(401);
    });

    it("POST /promoters → 403 con rol insuficiente (user)", async () => {
      const token = await signAccessToken(app, randomUUID(), ["user"]);
      const res = await http()
        .post("/api/v1/promoters")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "X", companyId: randomUUID() });
      expect(res.status).toBe(403);
    });

    it("POST /promoters → 422 Problem+JSON con body inválido", async () => {
      const token = await signAccessToken(app, randomUUID(), ["admin_local"]);
      const res = await http()
        .post("/api/v1/promoters")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "a", companyId: "no-es-uuid" });
      expect(res.status).toBe(422);
      expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
      expect(res.body.status).toBe(422);
      expect(res.body.errors).toBeDefined();
    });

    it("POST /promoters → 201 admin_local invita a un promotor (pending, sin link)", async () => {
      const companyId = await seedCompany();
      const token = await signAccessToken(app, randomUUID(), ["admin_local"], {
        companyId,
      });
      const res = await http()
        .post("/api/v1/promoters")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Promotor Nuevo", email: "nuevo@correo.com" });
      expect(res.status).toBe(201);
      expect(res.body.companyId).toBe(companyId);
      expect(res.body.name).toBe("Promotor Nuevo");
      expect(res.body.status).toBe("pending");
      expect(res.body.invitedEmail).toBe("nuevo@correo.com");
      expect(res.body.referralLink).toBeNull();
    });

    it("POST /promoters → 422 si falta el correo de la persona invitada", async () => {
      const companyId = await seedCompany();
      const token = await signAccessToken(app, randomUUID(), ["admin_local"], {
        companyId,
      });
      const res = await http()
        .post("/api/v1/promoters")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Sin Correo" });
      expect(res.status).toBe(422);
      expect(res.body.errors).toBeDefined();
    });

    it("GET /:id/sales → 401 sin token", async () => {
      const res = await http().get(`/api/v1/promoters/${randomUUID()}/sales`);
      expect(res.status).toBe(401);
    });

    it("GET /:id/sales → 403 con rol insuficiente (user)", async () => {
      const token = await signAccessToken(app, randomUUID(), ["user"]);
      const res = await http()
        .get(`/api/v1/promoters/${randomUUID()}/sales`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it("GET /:id/sales → 400 con id no-UUID (ParseUUIDPipe)", async () => {
      const token = await signAccessToken(app, randomUUID(), ["promoter"]);
      const res = await http()
        .get("/api/v1/promoters/no-es-uuid/sales")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(400);
    });

    it("GET /:id/sales → 404 Problem+JSON si el promotor no existe", async () => {
      const token = await signAccessToken(app, randomUUID(), ["promoter"]);
      const res = await http()
        .get(`/api/v1/promoters/${randomUUID()}/sales`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(404);
      expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
      expect(res.body.code).toBe("promoters/promoter-not-found");
    });

    it("GET /:id/sales → 200 devuelve el resumen de ventas/comisiones", async () => {
      const companyId = await seedCompany();
      const actorId = await seedUser();
      const { promoterId, referralLinkId } = await seedPromoter(
        companyId,
        "SALESC01",
        actorId,
      );
      await seedAttributedSale(companyId, promoterId, referralLinkId, "5.00");
      const token = await signAccessToken(app, actorId, ["promoter"], {
        companyId,
      });
      const res = await http()
        .get(`/api/v1/promoters/${promoterId}/sales`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.promoterId).toBe(promoterId);
      expect(res.body.totalAttributions).toBe(1);
      expect(res.body.totalCommission).toBe(5);
      expect(res.body.attributions).toHaveLength(1);
      expect(res.body.attributions[0]?.commissionAmount).toBe(5);
      expect(res.body.attributions[0]?.status).toBe("estimated");
    });

    it("GET /me/metrics resuelve solo el promotor ligado al usuario autenticado", async () => {
      const companyId = await seedCompany();
      const actorId = await seedUser();
      const own = await seedPromoter(companyId, "METRIC01", actorId);
      await seedPromoter(companyId, "METRIC02", await seedUser());
      const token = await signAccessToken(app, actorId, ["promoter"], {
        companyId,
      });

      const res = await http()
        .get("/api/v1/promoters/me/metrics")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.promoterId).toBe(own.promoterId);
      expect(res.body.totals.invitedCount).toBe(0);
      expect(res.body.totals.redeemedCount).toBe(0);
      expect(res.body.totals.attendanceRate).toBe(0);
    });

    it("un promotor NO puede pedir métricas de otro promotor por ID", async () => {
      const companyId = await seedCompany();
      const actorId = await seedUser();
      await seedPromoter(companyId, "METRIC03", actorId);
      const other = await seedPromoter(companyId, "METRIC04", await seedUser());
      const token = await signAccessToken(app, actorId, ["promoter"], {
        companyId,
      });

      const res = await http()
        .get(`/api/v1/promoters/${other.promoterId}/metrics`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it("un admin NO puede leer métricas de un promotor de otra compañía", async () => {
      const ownCompanyId = await seedCompany();
      const otherCompanyId = await seedCompany();
      const other = await seedPromoter(otherCompanyId, "METRIC05");
      const token = await signAccessToken(
        app,
        await seedUser(),
        ["admin_local"],
        {
          companyId: ownCompanyId,
        },
      );

      const res = await http()
        .get(`/api/v1/promoters/${other.promoterId}/metrics`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("auth/tenant-forbidden");
    });

    it("ranking de admin_local contiene solo promotores de su compañía", async () => {
      const ownCompanyId = await seedCompany();
      const otherCompanyId = await seedCompany();
      const own = await seedPromoter(ownCompanyId, "METRIC06");
      await seedPromoter(otherCompanyId, "METRIC07");
      const token = await signAccessToken(
        app,
        await seedUser(),
        ["admin_local"],
        {
          companyId: ownCompanyId,
        },
      );

      const res = await http()
        .get("/api/v1/promoters/ranking?sortBy=attendance_rate")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.minimumVolume).toBe(10);
      expect(
        res.body.rows.map((row: { promoterId: string }) => row.promoterId),
      ).toEqual([own.promoterId]);
    });

    it("POST /referrals/:code/click → 204 público registra el clic", async () => {
      const companyId = await seedCompany();
      await seedPromoter(companyId, "CLICK001");
      const res = await http().post(
        "/api/v1/promoters/referrals/CLICK001/click",
      );
      expect(res.status).toBe(204);
    });

    it("POST /referrals/:code/click → 204 aun con código inexistente (idempotente)", async () => {
      const res = await http().post(
        "/api/v1/promoters/referrals/NOPE9999/click",
      );
      expect(res.status).toBe(204);
    });
  });

  describe("Asociación de promotor (confirmación in-app)", () => {
    /** Invita (pending) y devuelve el id del promotor. */
    async function invite(companyId: string, email: string): Promise<string> {
      const token = await signAccessToken(app, randomUUID(), ["admin_local"], {
        companyId,
      });
      const res = await http()
        .post("/api/v1/promoters")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Promotor Invitado", email });
      return res.body.id as string;
    }

    it("GET /promoters/me/associations lista las invitaciones por correo del actor", async () => {
      const companyId = await seedCompany();
      const userId = await seedUser();
      const email = `${userId}@e2e.test`; // = email del token (signAccessToken)
      const promoterId = await invite(companyId, email);
      const token = await signAccessToken(app, userId, ["user"]);

      const res = await http()
        .get("/api/v1/promoters/me/associations")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].id).toBe(promoterId);
      expect(res.body[0].status).toBe("pending");
    });

    it("POST /:id/confirm activa el promotor, liga el userId y crea el link", async () => {
      const companyId = await seedCompany();
      const userId = await seedUser();
      const promoterId = await invite(companyId, `${userId}@e2e.test`);
      const token = await signAccessToken(app, userId, ["user"]);

      const res = await http()
        .post(`/api/v1/promoters/${promoterId}/confirm`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("active");
      expect(res.body.userId).toBe(userId);
      expect(typeof res.body.referralLink?.code).toBe("string");
      expect(res.body.referralLink?.isActive).toBe(true);

      // El evento de confirmación otorga el rol `promoter` con scope de la empresa.
      const grants = await client.db
        .select()
        .from(userRole)
        .innerJoin(role, eq(userRole.roleId, role.id))
        .where(and(eq(userRole.userId, userId), eq(role.code, "promoter")));
      expect(grants).toHaveLength(1);
      expect(grants[0]?.user_role.companyId).toBe(companyId);
    });

    it("POST /:id/confirm → 403 si el actor no es la persona invitada", async () => {
      const companyId = await seedCompany();
      const invitedUserId = await seedUser();
      const promoterId = await invite(companyId, `${invitedUserId}@e2e.test`);
      const otherUserId = await seedUser();
      const token = await signAccessToken(app, otherUserId, ["user"]);

      const res = await http()
        .post(`/api/v1/promoters/${promoterId}/confirm`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe("promoters/association-forbidden");
    });

    it("POST /:id/confirm → 409 si ya no está pendiente", async () => {
      const companyId = await seedCompany();
      const userId = await seedUser();
      const promoterId = await invite(companyId, `${userId}@e2e.test`);
      const token = await signAccessToken(app, userId, ["user"]);
      await http()
        .post(`/api/v1/promoters/${promoterId}/confirm`)
        .set("Authorization", `Bearer ${token}`);

      const res = await http()
        .post(`/api/v1/promoters/${promoterId}/confirm`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(409);
      expect(res.body.code).toBe("promoters/association-not-pending");
    });

    it("POST /:id/reject deja el promotor inactivo", async () => {
      const companyId = await seedCompany();
      const userId = await seedUser();
      const promoterId = await invite(companyId, `${userId}@e2e.test`);
      const token = await signAccessToken(app, userId, ["user"]);

      const res = await http()
        .post(`/api/v1/promoters/${promoterId}/reject`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("inactive");
    });
  });

  describe("PromoCodesController (/promo-codes)", () => {
    const CREATE = {
      code: "VERANO20",
      discountType: "percentage",
      discountValue: 20,
      scope: "global",
    };

    it("POST /promo-codes → 401 sin token", async () => {
      const res = await http().post("/api/v1/promo-codes").send(CREATE);
      expect(res.status).toBe(401);
    });

    it("POST /promo-codes → 403 con rol insuficiente (user)", async () => {
      const token = await signAccessToken(app, randomUUID(), ["user"]);
      const res = await http()
        .post("/api/v1/promo-codes")
        .set("Authorization", `Bearer ${token}`)
        .send(CREATE);
      expect(res.status).toBe(403);
    });

    it("POST /promo-codes → 422 Problem+JSON con body inválido", async () => {
      const token = await signAccessToken(app, randomUUID(), ["admin_local"]);
      const res = await http()
        .post("/api/v1/promo-codes")
        .set("Authorization", `Bearer ${token}`)
        .send({ code: "AB", discountType: "percentage", discountValue: -5 });
      expect(res.status).toBe(422);
      expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
      expect(res.body.status).toBe(422);
      expect(res.body.errors).toBeDefined();
    });

    it("POST /promo-codes → 201 super_admin crea un código global", async () => {
      const token = await signAccessToken(app, randomUUID(), ["super_admin"]);
      const res = await http()
        .post("/api/v1/promo-codes")
        .set("Authorization", `Bearer ${token}`)
        .send(CREATE);
      expect(res.status).toBe(201);
      expect(res.body.code).toBe("VERANO20");
      expect(res.body.discountType).toBe("percentage");
      expect(res.body.discountValue).toBe(20);
      expect(res.body.scope).toBe("global");
      expect(res.body.usedCount).toBe(0);
      expect(res.body.isActive).toBe(true);
    });

    it("POST /promo-codes → 409 Problem+JSON si el código ya existe", async () => {
      const token = await signAccessToken(app, randomUUID(), ["super_admin"]);
      await http()
        .post("/api/v1/promo-codes")
        .set("Authorization", `Bearer ${token}`)
        .send(CREATE);
      const res = await http()
        .post("/api/v1/promo-codes")
        .set("Authorization", `Bearer ${token}`)
        .send(CREATE);
      expect(res.status).toBe(409);
      expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
      expect(res.body.code).toBe("promoters/promo-code-code-taken");
    });

    it("POST /promo-codes/validate → 422 Problem+JSON con body inválido", async () => {
      const res = await http()
        .post("/api/v1/promo-codes/validate")
        .send({ code: "AB", subtotal: -1 });
      expect(res.status).toBe(422);
      expect(res.body.status).toBe(422);
      expect(res.body.errors).toBeDefined();
    });

    it("POST /promo-codes/validate → 200 público con código inexistente devuelve valid:false", async () => {
      const res = await http()
        .post("/api/v1/promo-codes/validate")
        .send({ code: "NOEXISTE", subtotal: 100 });
      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(false);
      expect(res.body.discount).toBe(0);
      expect(res.body.reason).toBe("Código no encontrado");
    });

    it("POST /promo-codes/validate → 200 con código válido calcula el descuento", async () => {
      const token = await signAccessToken(app, randomUUID(), ["super_admin"]);
      await http()
        .post("/api/v1/promo-codes")
        .set("Authorization", `Bearer ${token}`)
        .send(CREATE);
      const res = await http()
        .post("/api/v1/promo-codes/validate")
        .send({ code: "VERANO20", subtotal: 100 });
      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(true);
      expect(res.body.discount).toBe(20);
      expect(res.body.discountType).toBe("percentage");
      expect(res.body.reason).toBeNull();
    });
  });
});
