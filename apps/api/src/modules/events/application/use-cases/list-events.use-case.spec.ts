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
    expect(result[0]?.id).toBe("e1");
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
    expect(result[0]?.localId).toBe("l1");
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
    const ids = [...firstPage, ...secondPage].map((e) => e.id).sort();
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

    expect(result.map((event) => event.id)).toEqual(["e1"]);
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

    expect(result.map((event) => event.id)).toEqual(["e1"]);
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
});
