import { describe, expect, it } from "vitest";
import { EventBuilder } from "../../../../shared/testing/builders/events";
import { toEventResponse } from "./events.controller";

describe("toEventResponse catalogLabel", () => {
  it("marca pocas entradas solo cuando queda menos del 15% de un aforo real", () => {
    const low = new EventBuilder()
      .withTotalCapacity(100)
      .withTicketsSold(86)
      .asPublished()
      .build();
    const boundary = new EventBuilder()
      .withTotalCapacity(100)
      .withTicketsSold(85)
      .asPublished()
      .build();
    const openCapacity = new EventBuilder()
      .withTotalCapacity(0)
      .withTicketsSold(999)
      .asPublished()
      .build();

    expect(toEventResponse(low).catalogLabel).toBe("fewTickets");
    expect(toEventResponse(boundary).catalogLabel).toBeNull();
    expect(toEventResponse(openCapacity).catalogLabel).toBeNull();
  });

  it("permite una etiqueta de tendencia respaldada por el endpoint de ranking", () => {
    const event = new EventBuilder().asPublished().build();
    expect(toEventResponse(event, "trending").catalogLabel).toBe("trending");
  });

  it("incluye holds activos en el cupo disponible de catálogo y ficha", () => {
    const event = new EventBuilder()
      .withTotalCapacity(100)
      .withTicketsSold(80)
      .withActiveHolds(6)
      .asPublished()
      .build();

    const response = toEventResponse(event);

    expect(response.availableCapacity).toBe(14);
    expect(response.catalogLabel).toBe("fewTickets");
  });
});
