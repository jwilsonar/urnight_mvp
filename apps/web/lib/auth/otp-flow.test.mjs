import assert from "node:assert/strict";
import test from "node:test";

import {
  autoSubmitOtpCode,
  secondsUntil,
} from "./otp-flow.ts";

test("autoSubmitOtpCode devuelve el codigo completo una sola vez", () => {
  const digits = ["1", "2", "3", "4", "5", "6"];

  assert.equal(autoSubmitOtpCode(digits, null, false), "123456");
  assert.equal(autoSubmitOtpCode(digits, "123456", false), null);
});

test("autoSubmitOtpCode no envia codigos incompletos ni estados bloqueados", () => {
  assert.equal(autoSubmitOtpCode(["1", "2", "", "4", "5", "6"], null, false), null);
  assert.equal(autoSubmitOtpCode(["1", "2", "3", "4", "5", "6"], null, true), null);
});

test("secondsUntil redondea hacia arriba y nunca devuelve negativos", () => {
  assert.equal(secondsUntil("2026-08-07T12:01:00.001Z", Date.parse("2026-08-07T12:00:00Z")), 61);
  assert.equal(secondsUntil("2026-08-07T11:59:00Z", Date.parse("2026-08-07T12:00:00Z")), 0);
});
