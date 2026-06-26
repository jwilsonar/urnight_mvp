import { z } from 'zod';

/** Entrada del registro de auditoría (AUDIT_LOG §4.1, #23). */
export const auditLogResponseSchema = z.object({
  id: z.string().uuid(),
  actorUserId: z.string().uuid().nullable(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string().uuid().nullable(),
  ipAddress: z.string().nullable(),
  deviceInfo: z.string().nullable(),
  createdAt: z.string(),
});
export type AuditLogResponse = z.infer<typeof auditLogResponseSchema>;
