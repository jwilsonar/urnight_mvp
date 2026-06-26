import { z } from 'zod';
import { attendeeInputSchema } from '@urnight/contracts';

/** Esquema, tipos y constantes compartidos del formulario de checkout. */

type DocumentType = z.infer<typeof attendeeInputSchema>['documentType'];

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  dni: 'DNI',
  ce: 'Carné de extranjería',
  passport: 'Pasaporte',
};

export const PAYMENT_METHODS = [
  { value: 'card', label: 'Tarjeta' },
  { value: 'yape', label: 'Yape' },
  { value: 'plin', label: 'Plin' },
] as const;

export const checkoutFormSchema = z.object({
  ticketTypeId: z.string().uuid({ message: 'Selecciona un tipo de entrada' }),
  method: z.enum(['card', 'yape', 'plin']),
  promoCode: z.string().optional(),
  attendees: z.array(attendeeInputSchema).min(1).max(10),
});

export type CheckoutFormInput = z.input<typeof checkoutFormSchema>;
export type CheckoutFormValues = z.output<typeof checkoutFormSchema>;

export function emptyAttendee(isBuyer = false): CheckoutFormInput['attendees'][number] {
  return { fullName: '', documentType: 'dni', documentNumber: '', birthDate: '', isBuyer };
}
