import { Module } from '@nestjs/common';
import { CancelEventUseCase } from './application/use-cases/cancel-event.use-case';
import { CreateEventUseCase } from './application/use-cases/create-event.use-case';
import { CreateTicketTypeUseCase } from './application/use-cases/create-ticket-type.use-case';
import { GetEventUseCase } from './application/use-cases/get-event.use-case';
import { GetLocalStatsUseCase } from './application/use-cases/get-local-stats.use-case';
import { GetMyEventUseCase } from './application/use-cases/get-my-event.use-case';
import { ListEventsUseCase } from './application/use-cases/list-events.use-case';
import { ListMyEventsUseCase } from './application/use-cases/list-my-events.use-case';
import { ListTicketTypesUseCase } from './application/use-cases/list-ticket-types.use-case';
import { ListTrendingEventsUseCase } from './application/use-cases/list-trending-events.use-case';
import { ListUpcomingEventsUseCase } from './application/use-cases/list-upcoming-events.use-case';
import { PublishEventUseCase } from './application/use-cases/publish-event.use-case';
import { UpdateEventUseCase } from './application/use-cases/update-event.use-case';
import { EVENT_TENANT_PORT } from './domain/ports/event-tenant.port';
import { EVENT_REPOSITORY } from './domain/ports/event.repository';
import { TICKET_TYPE_REPOSITORY } from './domain/ports/ticket-type.repository';
import { DrizzleEventTenantAdapter } from './infrastructure/persistence/drizzle-event-tenant.adapter';
import { DrizzleEventRepository } from './infrastructure/persistence/drizzle-event.repository';
import { DrizzleTicketTypeRepository } from './infrastructure/persistence/drizzle-ticket-type.repository';
import { EventsController } from './interfaces/http/events.controller';
import { TicketTypesController } from './interfaces/http/ticket-types.controller';

/** Bounded context Events & Ticket Types (§4.1). */
@Module({
  controllers: [EventsController, TicketTypesController],
  providers: [
    ListEventsUseCase,
    ListTrendingEventsUseCase,
    ListUpcomingEventsUseCase,
    ListMyEventsUseCase,
    GetEventUseCase,
    GetLocalStatsUseCase,
    GetMyEventUseCase,
    CreateEventUseCase,
    UpdateEventUseCase,
    PublishEventUseCase,
    CancelEventUseCase,
    CreateTicketTypeUseCase,
    ListTicketTypesUseCase,
    { provide: EVENT_REPOSITORY, useClass: DrizzleEventRepository },
    { provide: EVENT_TENANT_PORT, useClass: DrizzleEventTenantAdapter },
    { provide: TICKET_TYPE_REPOSITORY, useClass: DrizzleTicketTypeRepository },
  ],
})
export class EventsModule {}
