import type { PlatformSetting } from "../entities/platform-setting.entity";
import type { SupportTicket } from "../entities/support-ticket.entity";

export interface PlatformSettingRepository {
  findByKey(key: string): Promise<PlatformSetting | null>;
  findByKeys(keys: readonly string[]): Promise<PlatformSetting[]>;
  upsert(setting: PlatformSetting): Promise<PlatformSetting>;
}
export const PLATFORM_SETTING_REPOSITORY = Symbol(
  "PLATFORM_SETTING_REPOSITORY",
);

export interface SupportTicketRepository {
  create(ticket: SupportTicket): Promise<SupportTicket>;
  findById(id: string): Promise<SupportTicket | null>;
  update(ticket: SupportTicket): Promise<SupportTicket>;
}
export const SUPPORT_TICKET_REPOSITORY = Symbol("SUPPORT_TICKET_REPOSITORY");

export interface NotificationRecord {
  id: string;
  channel: "email" | "push";
  type: string;
  subject: string | null;
  status: "queued" | "sent" | "failed";
  createdAt: Date;
}
export interface NotificationRepository {
  listByUser(userId: string): Promise<NotificationRecord[]>;
}
export const NOTIFICATION_REPOSITORY = Symbol("NOTIFICATION_REPOSITORY");

export interface AnalyticsEventInput {
  id: string;
  userId: string | null;
  sessionId: string | null;
  eventName: string;
  eventId: string | null;
  localId: string | null;
  zoneId: string | null;
  properties: Record<string, unknown> | null;
}
export interface AnalyticsEventRepository {
  record(event: AnalyticsEventInput): Promise<void>;
}
export const ANALYTICS_EVENT_REPOSITORY = Symbol("ANALYTICS_EVENT_REPOSITORY");

export interface AuditLogEntry {
  id: string;
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  ipAddress: string | null;
  deviceInfo: string | null;
}
export interface AuditLogRecord extends AuditLogEntry {
  createdAt: Date;
}
export interface AuditLogRepository {
  record(entry: AuditLogEntry): Promise<void>;
  list(limit: number): Promise<AuditLogRecord[]>;
}
export const AUDIT_LOG_REPOSITORY = Symbol("AUDIT_LOG_REPOSITORY");
