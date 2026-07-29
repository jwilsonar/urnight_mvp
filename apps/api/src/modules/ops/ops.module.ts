import { Module } from "@nestjs/common";
import { CreateSupportTicketUseCase } from "./application/use-cases/create-support-ticket.use-case";
import { GetPlatformSettingUseCase } from "./application/use-cases/get-platform-setting.use-case";
import { ListAuditLogsUseCase } from "./application/use-cases/list-audit-logs.use-case";
import { ListMyNotificationsUseCase } from "./application/use-cases/list-my-notifications.use-case";
import { RecordAnalyticsUseCase } from "./application/use-cases/record-analytics.use-case";
import { ResolveSupportTicketUseCase } from "./application/use-cases/resolve-support-ticket.use-case";
import { UpsertPlatformSettingUseCase } from "./application/use-cases/upsert-platform-setting.use-case";
import {
  ANALYTICS_EVENT_REPOSITORY,
  AUDIT_LOG_REPOSITORY,
  NOTIFICATION_REPOSITORY,
  PLATFORM_SETTING_REPOSITORY,
  SUPPORT_TICKET_REPOSITORY,
} from "./domain/ports/ops.ports";
import { DrizzleAnalyticsEventRepository } from "./infrastructure/persistence/drizzle-analytics-event.repository";
import { DrizzleAuditLogRepository } from "./infrastructure/persistence/drizzle-audit-log.repository";
import { DrizzleNotificationRepository } from "./infrastructure/persistence/drizzle-notification.repository";
import { DrizzlePlatformSettingRepository } from "./infrastructure/persistence/drizzle-platform-setting.repository";
import { DrizzleSupportTicketRepository } from "./infrastructure/persistence/drizzle-support-ticket.repository";
import { AnalyticsController } from "./interfaces/http/analytics.controller";
import { AuditLogsController } from "./interfaces/http/audit-logs.controller";
import { NotificationsController } from "./interfaces/http/notifications.controller";
import { PlatformSettingsController } from "./interfaces/http/platform-settings.controller";
import { SupportTicketsController } from "./interfaces/http/support-tickets.controller";

/** Bounded context Ops & Platform (§4.1). */
@Module({
  controllers: [
    PlatformSettingsController,
    SupportTicketsController,
    NotificationsController,
    AnalyticsController,
    AuditLogsController,
  ],
  providers: [
    GetPlatformSettingUseCase,
    ListAuditLogsUseCase,
    UpsertPlatformSettingUseCase,
    CreateSupportTicketUseCase,
    ResolveSupportTicketUseCase,
    ListMyNotificationsUseCase,
    RecordAnalyticsUseCase,
    {
      provide: PLATFORM_SETTING_REPOSITORY,
      useClass: DrizzlePlatformSettingRepository,
    },
    {
      provide: SUPPORT_TICKET_REPOSITORY,
      useClass: DrizzleSupportTicketRepository,
    },
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: DrizzleNotificationRepository,
    },
    {
      provide: ANALYTICS_EVENT_REPOSITORY,
      useClass: DrizzleAnalyticsEventRepository,
    },
    { provide: AUDIT_LOG_REPOSITORY, useClass: DrizzleAuditLogRepository },
  ],
  exports: [AUDIT_LOG_REPOSITORY, PLATFORM_SETTING_REPOSITORY],
})
export class OpsModule {}
