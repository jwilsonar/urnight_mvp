import { z } from "zod";
import { attendeeInputSchema } from "@urnight/contracts";

/** Esquema, tipos y constantes compartidos del formulario de checkout. */

export const PAYMENT_METHODS = [
  { value: "card" },
  { value: "yape" },
  { value: "plin" },
] as const;

export const checkoutFormSchema = z.object({
  ticketTypeId: z.string().uuid(),
  method: z.enum(["card", "yape", "plin"]),
  promoCode: z.string().optional(),
  attendees: z.array(attendeeInputSchema).min(1).max(10),
});

export function createCheckoutFormSchema(errors: {
  ticketType: string;
  fullName: string;
  document: string;
  birthDate: string;
  adult: string;
}) {
  const attendeeFormSchema = z.object({
    fullName: z.string().trim().min(2, errors.fullName).max(120),
    documentType: z.enum(["dni", "ce", "passport"]),
    documentNumber: z
      .string()
      .trim()
      .min(8, errors.document)
      .max(20, errors.document)
      .regex(/^[A-Za-z0-9]+$/, errors.document),
    birthDate: z
      .string()
      .date(errors.birthDate)
      .refine((value) => {
        const birthDate = new Date(value);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const month = today.getMonth() - birthDate.getMonth();
        if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate()))
          age -= 1;
        return age >= 18;
      }, errors.adult),
    isBuyer: z.boolean().default(false),
  });

  return checkoutFormSchema.extend({
    ticketTypeId: z.string().uuid({ message: errors.ticketType }),
    attendees: z.array(attendeeFormSchema).min(1).max(10),
  });
}

export type CheckoutFormInput = z.input<typeof checkoutFormSchema>;
export type CheckoutFormValues = z.output<typeof checkoutFormSchema>;

export function emptyAttendee(
  isBuyer = false,
): CheckoutFormInput["attendees"][number] {
  return {
    fullName: "",
    documentType: "dni",
    documentNumber: "",
    birthDate: "",
    isBuyer,
  };
}
