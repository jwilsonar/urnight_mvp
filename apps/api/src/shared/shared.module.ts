import { Global, Module } from '@nestjs/common';
import { EventBus } from './event-bus/event-bus';
import { LockPort } from './locking/lock.port';
import { RedisLockAdapter } from './locking/redis-lock.adapter';
import { DrizzleOutboxAdapter } from './outbox/drizzle-outbox.adapter';
import { OutboxPort } from './outbox/outbox.port';
import { DrizzleResourceTenantResolver } from './tenant/drizzle-resource-tenant.adapter';
import { RESOURCE_TENANT_RESOLVER } from './tenant/resource-tenant.port';
import { DrizzleUnitOfWork } from './unit-of-work/drizzle-unit-of-work';
import { UnitOfWork } from './unit-of-work/unit-of-work';

/**
 * Shared Kernel + Ports OUT (§7). Global: UoW, EventBus, Outbox, LockPort y el
 * resolutor de aislamiento tenant disponibles para todos los módulos.
 */
@Global()
@Module({
  providers: [
    { provide: UnitOfWork, useClass: DrizzleUnitOfWork },
    EventBus,
    { provide: OutboxPort, useClass: DrizzleOutboxAdapter },
    { provide: LockPort, useClass: RedisLockAdapter },
    { provide: RESOURCE_TENANT_RESOLVER, useClass: DrizzleResourceTenantResolver },
  ],
  exports: [UnitOfWork, EventBus, OutboxPort, LockPort, RESOURCE_TENANT_RESOLVER],
})
export class SharedModule {}
