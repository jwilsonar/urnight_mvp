import { describe, expect, it } from "vitest";
import { EventBuilder } from "../../../../shared/testing/builders/events";
import { InMemoryEventRepository } from "../../../../shared/testing/in-memory/events";
import { InMemoryPlatformSettingRepository } from "../../../../shared/testing/in-memory/ops";
import { TrendingConfigProvider } from "../config/trending-config.provider";
import { ListTrendingEventsUseCase } from "./list-trending-events.use-case";

function build() {
  const events = new InMemoryEventRepository();
  const config = new TrendingConfigProvider(
    new InMemoryPlatformSettingRepository(),
  );
  return {
    events,
    useCase: new ListTrendingEventsUseCase(events, config),
  };
}

describe("ListTrendingEventsUseCase", () => {
  it("ordena por el score nuevo y no por tickets vendidos acumulados", async () => {
    const { events, useCase } = build();
    const startsAt = new Date(Date.now() + 30 * 86_400_000);
    await events.create(
      new EventBuilder()
        .withId("volumen-antiguo")
        .withSlug("volumen-antiguo")
        .withStartsAt(startsAt)
        .withTotalCapacity(1_000)
        .withTicketsSold(800)
        .asPublished()
        .build(),
    );
    await events.create(
      new EventBuilder()
        .withId("impulso-reciente")
        .withSlug("impulso-reciente")
        .withStartsAt(startsAt)
        .withTotalCapacity(1_000)
        .withTicketsSold(100)
        .asPublished()
        .build(),
    );
    events.setRecentSales("volumen-antiguo", 0);
    events.setRecentSales("impulso-reciente", 50);

    const result = await useCase.execute();

    expect(result.map(({ id }) => id)).toEqual([
      "impulso-reciente",
      "volumen-antiguo",
    ]);
  });

  it("excluye borradores, cancelados y eventos pasados", async () => {
    const { events, useCase } = build();
    const future = new Date(Date.now() + 86_400_000);
    const past = new Date(Date.now() - 86_400_000);
    const fixtures = [
      new EventBuilder()
        .withId("published")
        .withSlug("published")
        .withStartsAt(future)
        .asPublished()
        .build(),
      new EventBuilder()
        .withId("draft")
        .withSlug("draft")
        .withStartsAt(future)
        .build(),
      new EventBuilder()
        .withId("cancelled")
        .withSlug("cancelled")
        .withStartsAt(future)
        .asCancelled()
        .build(),
      new EventBuilder()
        .withId("past")
        .withSlug("past")
        .withStartsAt(past)
        .asPublished()
        .build(),
    ];
    for (const event of fixtures) await events.create(event);

    const result = await useCase.execute();

    expect(result.map(({ id }) => id)).toEqual(["published"]);
  });

  it("mantiene un orden determinista en empates exactos", async () => {
    const { events, useCase } = build();
    const startsAt = new Date(Date.now() + 10 * 86_400_000);
    for (const id of ["z-event", "a-event"]) {
      await events.create(
        new EventBuilder()
          .withId(id)
          .withSlug(id)
          .withStartsAt(startsAt)
          .withTotalCapacity(100)
          .withTicketsSold(50)
          .asPublished()
          .build(),
      );
      events.setRecentSales(id, 10);
    }

    const first = (await useCase.execute()).map(({ id }) => id);
    const second = (await useCase.execute()).map(({ id }) => id);

    expect(first).toEqual(["a-event", "z-event"]);
    expect(second).toEqual(first);
  });
});
