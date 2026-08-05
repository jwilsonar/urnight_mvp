import { describe, expect, it } from "vitest";
import {
  DEFAULT_TRENDING_CONFIG,
  calculateTrendingScore,
  compareTrendingCandidates,
} from "./trending-score";

const now = new Date("2026-08-05T12:00:00.000Z");

function score(input: {
  recentSales: number;
  maxRecentSales: number;
  startsInDays?: number;
  ticketsSold: number;
  capacity: number;
}): number {
  return calculateTrendingScore(
    {
      recentSales: input.recentSales,
      maxRecentSales: input.maxRecentSales,
      startsAt: new Date(
        now.getTime() + (input.startsInDays ?? 30) * 86_400_000,
      ),
      ticketsSold: input.ticketsSold,
      capacity: input.capacity,
    },
    DEFAULT_TRENDING_CONFIG,
    now,
  );
}

describe("trending score", () => {
  it("prioriza ventas recientes sobre un acumulado historico mayor", () => {
    const recentMomentum = score({
      recentSales: 50,
      maxRecentSales: 50,
      ticketsSold: 100,
      capacity: 1_000,
    });
    const oldVolume = score({
      recentSales: 0,
      maxRecentSales: 50,
      ticketsSold: 800,
      capacity: 1_000,
    });

    expect(recentMomentum).toBeGreaterThan(oldVolume);
  });

  it("prioriza un evento inminente frente a otro lejano con las mismas senales", () => {
    const imminent = score({
      recentSales: 20,
      maxRecentSales: 20,
      startsInDays: 1,
      ticketsSold: 50,
      capacity: 100,
    });
    const distant = score({
      recentSales: 20,
      maxRecentSales: 20,
      startsInDays: 90,
      ticketsSold: 50,
      capacity: 100,
    });

    expect(imminent).toBeGreaterThan(distant);
  });

  it("permite que un local chico casi lleno compita con uno grande a medio llenar", () => {
    const smallVenue = score({
      recentSales: 20,
      maxRecentSales: 40,
      ticketsSold: 90,
      capacity: 100,
    });
    const largeVenue = score({
      recentSales: 40,
      maxRecentSales: 40,
      ticketsSold: 500,
      capacity: 1_000,
    });

    expect(Math.abs(smallVenue - largeVenue)).toBeLessThan(0.02);
  });

  it("desempata por inicio y luego por id de forma determinista", () => {
    const sameStart = new Date("2026-09-01T22:00:00.000Z");
    const later = new Date("2026-09-02T22:00:00.000Z");
    const candidates = [
      { id: "z-event", startsAt: sameStart, score: 0.5 },
      { id: "later-event", startsAt: later, score: 0.5 },
      { id: "a-event", startsAt: sameStart, score: 0.5 },
    ];

    expect(
      candidates.sort(compareTrendingCandidates).map(({ id }) => id),
    ).toEqual(["a-event", "z-event", "later-event"]);
  });
});
