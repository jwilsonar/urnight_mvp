import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { validateEnv } from './config/env.schema';
import { buildPinoOptions } from './shared/logging/logging.config';
import { ProblemJsonFilter } from './edge/filters/problem-json.filter';
import { AuthGuard } from './edge/guards/auth.guard';
import { MfaEnrollmentGuard } from './edge/guards/mfa-enrollment.guard';
import { RateLimitGuard } from './edge/guards/rate-limit.guard';
import { RolesGuard } from './edge/guards/roles.guard';
import { AuditInterceptor } from './edge/interceptors/audit.interceptor';
import { HealthModule } from './health/health.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { EventsModule } from './modules/events/events.module';
import { IdentityModule } from './modules/identity/identity.module';
import { MenuModule } from './modules/menu/menu.module';
import { OpsModule } from './modules/ops/ops.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PromotersModule } from './modules/promoters/promoters.module';
import { TicketingModule } from './modules/ticketing/ticketing.module';
import { TrustModule } from './modules/trust/trust.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { StorageModule } from './shared/adapters/storage/storage.module';
import { DatabaseModule } from './shared/database/database.module';
import { RedisModule } from './shared/redis/redis.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: ['../../.env', '.env'],
    }),
    LoggerModule.forRoot(buildPinoOptions()),
    RedisModule,
    DatabaseModule,
    StorageModule,
    SharedModule,
    HealthModule,
    IdentityModule,
    CatalogModule,
    CompaniesModule,
    MenuModule,
    OrdersModule,
    EventsModule,
    TicketingModule,
    PromotersModule,
    TrustModule,
    OpsModule,
    UploadsModule,
  ],
  providers: [
    // Pipeline transversal (§2.2): RateLimit → Auth → MFA pendiente → Roles.
    { provide: APP_GUARD, useClass: RateLimitGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: MfaEnrollmentGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
    { provide: APP_FILTER, useClass: ProblemJsonFilter },
  ],
})
export class AppModule {}
