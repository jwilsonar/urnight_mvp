import { describe, expect, it } from "vitest";
import { eventListQuerySchema } from "@urnight/contracts";
import { InMemoryEventRepository } from "../../../../shared/testing/in-memory/events";
import { EventBuilder } from "../../../../shared/testing/builders/events";
import { ListEventsUseCase } from "./list-events.use-case";

function build() {
  const events = new InMemoryEventRepository();
  const useCase = new ListEventsUseCase(events);
  return { events, useCase };
}

describe("ListEventsUseCase", () => {
  const genreA = "11111111-1111-4111-8111-111111111111";
  const genreB = "22222222-2222-4222-8222-222222222222";
  const tagA = "33333333-3333-4333-8333-333333333333";

  it("solo devuelve eventos publicados", async () => {
    const { events, useCase } = build();
    await events.create(
      new EventBuilder().withId("e1").withSlug("pub").asPublished().build(),
    );
    await events.create(
      new EventBuilder()
        .withId("e2")
        .withSlug("draft")
        .withStatus("draft")
        .build(),
    );

    const result = await useCase.execute();

    expect(result).toHaveLength(1);
    expect(result[0]?.event.id).toBe("e1");
  });

  it("excluye eventos pasados y agotados, y ordena los próximos por vencimiento", async () => {
    const { events, useCase } = build();
    const now = Date.now();
    const fixtures = [
      new EventBuilder()
        .withId("far")
        .withSlug("far")
        .withStartsAt(new Date(now + 120_000))
        .asPublished()
        .build(),
      new EventBuilder()
        .withId("past")
        .withSlug("past")
        .withStartsAt(new Date(now - 60_000))
        .asPublished()
        .build(),
      new EventBuilder()
        .withId("sold-out")
        .withSlug("sold-out")
        .withStartsAt(new Date(now + 30_000))
        .withTotalCapacity(100)
        .withTicketsSold(100)
        .asPublished()
        .build(),
      new EventBuilder()
        .withId("near")
        .withSlug("near")
        .withStartsAt(new Date(now + 60_000))
        .asPublished()
        .build(),
    ];
    for (const event of fixtures) await events.create(event);

    const result = await useCase.executePage();

    expect(result.events.map((item) => item.event.id)).toEqual([
      "near",
      "far",
    ]);
    expect(result.total).toBe(2);
  });

  it("filtra eventos publicados por local", async () => {
    const { events, useCase } = build();
    await events.create(
      new EventBuilder()
        .withId("e1")
        .withSlug("a")
        .withLocalId("l1")
        .asPublished()
        .build(),
    );
    await events.create(
      new EventBuilder()
        .withId("e2")
        .withSlug("b")
        .withLocalId("l2")
        .asPublished()
        .build(),
    );

    const result = await useCase.execute({ localId: "l1" });

    expect(result).toHaveLength(1);
    expect(result[0]?.event.localId).toBe("l1");
  });

  it("devuelve lista vacía cuando no hay eventos publicados", async () => {
    const { useCase } = build();
    const result = await useCase.execute();
    expect(result).toHaveLength(0);
  });

  it("aplica limit/offset (paginación opcional)", async () => {
    const { events, useCase } = build();
    for (const id of ["e1", "e2", "e3"]) {
      await events.create(
        new EventBuilder().withId(id).withSlug(id).asPublished().build(),
      );
    }

    const firstPage = await useCase.execute({ limit: 2, offset: 0 });
    const secondPage = await useCase.execute({ limit: 2, offset: 2 });

    expect(firstPage).toHaveLength(2);
    expect(secondPage).toHaveLength(1);
    const ids = [...firstPage, ...secondPage]
      .map((item) => item.event.id)
      .sort();
    expect(ids).toEqual(["e1", "e2", "e3"]);
  });

  it("devuelve el total exacto separado de la página solicitada", async () => {
    const { events, useCase } = build();
    for (const id of ["e1", "e2", "e3"]) {
      await events.create(
        new EventBuilder().withId(id).withSlug(id).asPublished().build(),
      );
    }

    const result = await useCase.executePage({ limit: 2, offset: 0 });

    expect(result.events).toHaveLength(2);
    expect(result.total).toBe(3);
  });

  it("incluye coincidencias parciales pero coloca primero el evento con los dos géneros", async () => {
    const { events, useCase } = build();
    for (const id of ["solo-a", "ambos", "solo-b", "ninguno"]) {
      await events.create(
        new EventBuilder().withId(id).withSlug(id).asPublished().build(),
      );
    }
    await events.setGenres("solo-a", [genreA]);
    await events.setGenres("ambos", [genreA, genreB]);
    await events.setGenres("solo-b", [genreB]);

    const result = await useCase.execute({ genreIds: [genreA, genreB] });

    expect(
      result.map((item) => [
        item.event.id,
        item.matchScore,
        item.matchesAll,
      ]),
    ).toEqual([
      ["ambos", 2, true],
      ["solo-a", 1, false],
      ["solo-b", 1, false],
    ]);
  });

  it("suma coincidencias de géneros y tags en un único matchScore", async () => {
    const { events, useCase } = build();
    for (const id of ["completo", "dos-de-tres", "solo-tag"]) {
      await events.create(
        new EventBuilder().withId(id).withSlug(id).asPublished().build(),
      );
    }
    await events.setGenres("completo", [genreA, genreB]);
    await events.setTags("completo", [tagA]);
    await events.setGenres("dos-de-tres", [genreA, genreB]);
    await events.setTags("solo-tag", [tagA]);

    const result = await useCase.execute({
      genreIds: [genreA, genreB],
      tagIds: [tagA],
    });

    expect(
      result.map((item) => ({
        id: item.event.id,
        score: item.matchScore,
        all: item.matchesAll,
      })),
    ).toEqual([
      { id: "completo", score: 3, all: true },
      { id: "dos-de-tres", score: 2, all: false },
      { id: "solo-tag", score: 1, all: false },
    ]);
  });

  it("trata arrays vacíos como ausencia de filtro", async () => {
    const { events, useCase } = build();
    for (const id of ["e1", "e2"]) {
      await events.create(
        new EventBuilder().withId(id).withSlug(id).asPublished().build(),
      );
    }

    const result = await useCase.execute({ genreIds: [], tagIds: [] });

    expect(result).toHaveLength(2);
    expect(
      result.every((item) => item.matchScore === 0 && item.matchesAll),
    ).toBe(true);
  });

  it("ordena por ranking antes de aplicar limit/offset", async () => {
    const { events, useCase } = build();
    await events.create(
      new EventBuilder()
        .withId("parcial-temprano")
        .withSlug("parcial-temprano")
        .withStartsAt(new Date("2026-09-01T22:00:00.000Z"))
        .asPublished()
        .build(),
    );
    await events.create(
      new EventBuilder()
        .withId("completo-tardio")
        .withSlug("completo-tardio")
        .withStartsAt(new Date("2026-10-01T22:00:00.000Z"))
        .asPublished()
        .build(),
    );
    await events.setGenres("parcial-temprano", [genreA]);
    await events.setGenres("completo-tardio", [genreA, genreB]);

    const page = await useCase.executePage({
      genreIds: [genreA, genreB],
      limit: 1,
      offset: 0,
    });

    expect(page.events.map((item) => item.event.id)).toEqual([
      "completo-tardio",
    ]);
    expect(page.total).toBe(2);
  });

  it("excluye un evento sin tipos de entrada cuando hay filtro de precio", async () => {
    const { events, useCase } = build();
    await events.create(
      new EventBuilder()
        .withId("e1")
        .withSlug("sin-entradas")
        .asPublished()
        .build(),
    );

    const result = await useCase.execute({ minPrice: 0, maxPrice: 50 });

    expect(result).toHaveLength(0);
  });

  it("incluye un evento con un solo tipo cuyo precio cae exactamente en los bordes", async () => {
    const { events, useCase } = build();
    await events.create(
      new EventBuilder().withId("e1").withSlug("general").asPublished().build(),
    );
    events.setTicketPrices("e1", [50]);

    const result = await useCase.execute({ minPrice: 50, maxPrice: 50 });

    expect(result.map((item) => item.event.id)).toEqual(["e1"]);
  });

  it("incluye un evento si alguno de sus tipos de entrada cae en el rango", async () => {
    const { events, useCase } = build();
    await events.create(
      new EventBuilder()
        .withId("e1")
        .withSlug("general-y-vip")
        .asPublished()
        .build(),
    );
    events.setTicketPrices("e1", [30, 300]);

    const result = await useCase.execute({ maxPrice: 50 });

    expect(result.map((item) => item.event.id)).toEqual(["e1"]);
  });

  it("excluye un evento cuando ninguno de sus tipos de entrada cae en el rango", async () => {
    const { events, useCase } = build();
    await events.create(
      new EventBuilder()
        .withId("e1")
        .withSlug("fuera-de-rango")
        .asPublished()
        .build(),
    );
    events.setTicketPrices("e1", [30, 300]);

    const result = await useCase.execute({ minPrice: 50, maxPrice: 200 });

    expect(result).toHaveLength(0);
  });

  it("valida minPrice/maxPrice como enteros no negativos y ordenados", () => {
    expect(
      eventListQuerySchema.parse({ minPrice: "0", maxPrice: "50" }),
    ).toMatchObject({
      minPrice: 0,
      maxPrice: 50,
    });
    expect(eventListQuerySchema.safeParse({ minPrice: -1 }).success).toBe(
      false,
    );
    expect(
      eventListQuerySchema.safeParse({ minPrice: 51, maxPrice: 50 }).success,
    ).toBe(false);
  });

  it("trata minPrice/maxPrice vacíos como filtros ausentes", () => {
    expect(
      eventListQuerySchema.parse({ minPrice: "", maxPrice: "" }),
    ).toMatchObject({
      minPrice: undefined,
      maxPrice: undefined,
    });
  });

  it("parsea CSV/repetición y normaliza los filtros singulares retrocompatibles", () => {
    expect(
      eventListQuerySchema.parse({
        genreIds: `${genreA},${genreB}`,
        tagIds: [tagA],
      }),
    ).toMatchObject({ genreIds: [genreA, genreB], tagIds: [tagA] });

    expect(eventListQuerySchema.parse({ genreId: genreA })).toMatchObject({
      genreId: genreA,
      genreIds: [genreA],
    });
    expect(
      eventListQuerySchema.parse({ genreId: genreA, genreIds: genreB }),
    ).toMatchObject({ genreIds: [genreB] });
  });

  it("conserva arrays vacíos aunque también llegue el filtro singular", () => {
    expect(
      eventListQuerySchema.parse({ genreId: genreA, genreIds: "" }),
    ).toMatchObject({ genreIds: [] });
    expect(eventListQuerySchema.parse({ tagIds: [] })).toMatchObject({
      tagIds: [],
    });
  });
});
