import assert from "node:assert/strict";
import test from "node:test";
import {
  formatLocalOrderWindows,
  isWithinLocalOrderWindow,
} from "./order-windows.ts";

const windowFor = (dayOfWeek, startsAt, endsAt) => ({
  id: "11111111-1111-4111-8111-111111111111",
  localId: "22222222-2222-4222-8222-222222222222",
  dayOfWeek,
  startsAt,
  endsAt,
});

test("reconoce una ventana regular en hora de Lima", () => {
  const windows = [windowFor(1, "18:00", "23:00")];

  assert.equal(
    isWithinLocalOrderWindow(windows, new Date("2026-08-04T01:00:00.000Z")),
    true,
  );
  assert.equal(
    isWithinLocalOrderWindow(windows, new Date("2026-08-04T04:00:00.000Z")),
    false,
  );
});

test("mantiene abierta una ventana que cruza medianoche", () => {
  const windows = [windowFor(5, "20:00", "02:00")];

  assert.equal(
    isWithinLocalOrderWindow(windows, new Date("2026-08-08T06:30:00.000Z")),
    true,
  );
  assert.equal(
    isWithinLocalOrderWindow(windows, new Date("2026-08-08T07:00:00.000Z")),
    false,
  );
});

test("ordena y muestra todas las ventanas en el horario legible", () => {
  const formatted = formatLocalOrderWindows(
    [windowFor(5, "20:00", "02:00"), windowFor(1, "18:00", "23:00")],
    "es-PE",
  );

  assert.match(formatted, /18:00–23:00/);
  assert.match(formatted, /20:00–02:00/);
  assert.ok(formatted.indexOf("18:00") < formatted.indexOf("20:00"));
});
