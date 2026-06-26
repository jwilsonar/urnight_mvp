import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { validateEnv, type Env } from './config/env.schema';
import { buildPinoOptions } from './logging/logging.config';
import { DbModule } from './db/db.module';
import { EmailPort } from './notifications/email.port';
import { LogEmailAdapter } from './notifications/log-email.adapter';
import { LogPushAdapter } from './notifications/log-push.adapter';
import { PushPort } from './notifications/push.port';
import { OutboxRelay } from './outbox/outbox-relay.service';
import { TicketPdfService } from './pdf/ticket-pdf.service';
import { NotificationsProcessor } from './processors/notifications.processor';
import { LogStorageAdapter } from './storage/log-storage.adapter';
import { StoragePort } from './storage/storage.port';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: ['../../.env', '.env'],
    }),
    LoggerModule.forRoot(buildPinoOptions()),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => {
        const url = new URL(config.getOrThrow('REDIS_URL', { infer: true }));
        return {
          connection: {
            host: url.hostname,
            port: Number(url.port) || 6379,
          },
        };
      },
    }),
    BullModule.registerQueue({ name: 'notifications' }),
    DbModule,
  ],
  providers: [
    NotificationsProcessor,
    OutboxRelay,
    TicketPdfService,
    { provide: EmailPort, useClass: LogEmailAdapter },
    { provide: PushPort, useClass: LogPushAdapter },
    { provide: StoragePort, useClass: LogStorageAdapter },
  ],
})
export class AppModule {}
