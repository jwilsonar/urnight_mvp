import { z } from "zod";

/** Política financiera usada al tomar el snapshot de cada venta atribuida. */
export const DEFAULT_COMMISSION_RATE_SETTING_KEY = "default_commission_rate";
export const SESSION_IDLE_TIMEOUT_SETTING_KEY = "session.idle_timeout_minutes";
export const DEFAULT_SESSION_IDLE_TIMEOUT_MINUTES = 30;
export const MIN_SESSION_IDLE_TIMEOUT_MINUTES = 5;
export const MAX_SESSION_IDLE_TIMEOUT_MINUTES = 1440;

/** Crear/actualizar un ajuste de plataforma (super_admin). */
export const upsertPlatformSettingSchema = z
  .object({
    key: z.string().trim().min(2).max(80),
    value: z.string().max(2000),
    valueType: z
      .enum(["string", "number", "boolean", "json"])
      .default("string"),
  })
  .superRefine((input, ctx) => {
    if (input.key === SESSION_IDLE_TIMEOUT_SETTING_KEY) {
      const value = input.value.trim();
      const minutes = Number(value);
      if (
        input.valueType !== "number" ||
        value === "" ||
        !Number.isInteger(minutes) ||
        minutes < MIN_SESSION_IDLE_TIMEOUT_MINUTES ||
        minutes > MAX_SESSION_IDLE_TIMEOUT_MINUTES
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["value"],
          message:
            "session.idle_timeout_minutes debe ser un entero entre 5 y 1440",
        });
      }
      return;
    }
    if (input.key !== DEFAULT_COMMISSION_RATE_SETTING_KEY) return;
    const value = input.value.trim();
    const rate = Number(value);
    if (
      input.valueType !== "number" ||
      value === "" ||
      !Number.isFinite(rate) ||
      rate < 0 ||
      rate > 1
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "default_commission_rate debe ser un número entre 0 y 1",
      });
    }
  });
export type UpsertPlatformSettingDto = z.infer<
  typeof upsertPlatformSettingSchema
>;

export const platformSettingResponseSchema = z.object({
  key: z.string(),
  value: z.string(),
  valueType: z.enum(["string", "number", "boolean", "json"]),
  updatedAt: z.string(),
});
export type PlatformSettingResponse = z.infer<
  typeof platformSettingResponseSchema
>;
