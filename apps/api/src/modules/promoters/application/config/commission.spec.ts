import { describe, expect, it } from "vitest";
import { upsertPlatformSettingSchema } from "@urnight/contracts";
import { PlatformSettingBuilder } from "../../../../shared/testing/builders/ops";
import { parsePromoterCommissionRate } from "./commission";

describe("parsePromoterCommissionRate", () => {
  it("acepta una tasa numérica persistida entre 0 y 1", () => {
    const setting = new PlatformSettingBuilder()
      .withKey("default_commission_rate")
      .withTypedValue("0.075", "number")
      .build();

    expect(parsePromoterCommissionRate(setting)).toBe(0.075);
  });

  it.each(["", "   ", "no-numero"])(
    "rechaza el valor inválido %j en vez de convertirlo silenciosamente a cero",
    (value) => {
      const setting = new PlatformSettingBuilder()
        .withKey("default_commission_rate")
        .withTypedValue(value, "number")
        .build();

      expect(() => parsePromoterCommissionRate(setting)).toThrow();
    },
  );

  it("rechaza el valor vacío también en el contrato de PLATFORM_SETTING", () => {
    const result = upsertPlatformSettingSchema.safeParse({
      key: "default_commission_rate",
      value: "",
      valueType: "number",
    });

    expect(result.success).toBe(false);
  });
});
