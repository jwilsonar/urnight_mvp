import { z } from 'zod';

/**
 * Esquemas Zod de los payloads de cada job de la cola 'notifications' (BAJA:
 * validar `job.data`). Reflejan lo que la API encola en el outbox
 * (`checkout.use-case.ts`, `register.use-case.ts`, `google-login.use-case.ts`).
 * Definidos localmente en el worker (no depende de @urnight/contracts). Si el
 * payload no valida, el processor lanza `UnrecoverableError` (no reintentar).
 */

export const orderTicketsJobSchema = z.object({
  orderId: z.string().uuid(),
  userId: z.string().uuid(),
  ticketIds: z.array(z.string().uuid()).default([]),
});

export const verificationEmailJobSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  token: z.string().optional(),
});

export const welcomeEmailJobSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
});

export const localDocumentExpiryWarningJobSchema = z.object({
  documentId: z.string().uuid(),
  userId: z.string().uuid(),
  email: z.string().email(),
  localName: z.string().min(1),
  documentType: z.enum([
    'municipal_license',
    'itse_certificate',
    'health_certificate',
    'other',
  ]),
  expiresAt: z.string().date(),
});

export type OrderTicketsJob = z.infer<typeof orderTicketsJobSchema>;
export type VerificationEmailJob = z.infer<typeof verificationEmailJobSchema>;
export type WelcomeEmailJob = z.infer<typeof welcomeEmailJobSchema>;
export type LocalDocumentExpiryWarningJob = z.infer<
  typeof localDocumentExpiryWarningJobSchema
>;
