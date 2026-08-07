import { z } from "zod";
import {
  DOCUMENT_TYPES,
  MIN_AGE,
  ageFrom,
  attendeeInputSchema,
  refineDocumentPair,
} from "@urnight/contracts";

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
  const attendeeFormSchema = z
    .object({
      // Nombre y apellido, igual que al crear la cuenta: en la puerta se compara
      // contra el documento y "Juan" a secas no sirve.
      fullName: z
        .string()
        .trim()
        .min(2, errors.fullName)
        .max(120)
        .refine(
          (value) =>
            value.split(/\s+/).filter((part) => part.length >= 2).length >= 2,
          errors.fullName,
        ),
      documentType: z.enum(DOCUMENT_TYPES),
      documentNumber: z.string().trim().min(1, errors.document),
      birthDate: z
        .string()
        .date(errors.birthDate)
        .refine((value) => ageFrom(new Date(value)) >= MIN_AGE, errors.adult),
      isBuyer: z.boolean().default(false),
    })
    // El largo del documento sale del contrato, no de este formulario: un CE y
    // un pasaporte no miden lo mismo que un DNI.
    .superRefine((values, ctx) =>
      refineDocumentPair(values, ctx, errors.document),
    );

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
