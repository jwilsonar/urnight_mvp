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
import { S3StorageAdapter } from './storage/s3-storage.adapter';
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
            // El path de la URL es el db-index (redis://host:6379/1); sin esto
            // BullMQ siempre cae al db 0 aunque REDIS_URL apunte a otro.
            db: Number(url.pathname.slice(1)) || 0,
            password: url.password || undefined,
          },
        };
      },
    }),
    // A4: retry/backoff + DLQ. `attempts`/`backoff` se aplican por defecto a todo
    // job encolado (incluido `queue.add(..., { jobId })` del OutboxRelay).
    // `removeOnFail` retiene los últimos N fallidos como DLQ inspeccionable.
    BullModule.registerQueue({
      name: 'notifications',
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    }),
    DbModule,
  ],
  providers: [
    NotificationsProcessor,
    OutboxRelay,
    TicketPdfService,
    { provide: EmailPort, useClass: LogEmailAdapter },
    { provide: PushPort, useClass: LogPushAdapter },
    // A5: storage real S3/LocalStack (no log). Email/Push siguen como stub (ADR 0004).
    { provide: StoragePort, useClass: S3StorageAdapter },
  ],
})
export class AppModule {}
