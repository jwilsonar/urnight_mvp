import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import {
  cancelEventSchema,
  createEventSchema,
  eventListQuerySchema,
  updateEventSchema,
  type CancelEventDto,
  type CreateEventDto,
  type EventCatalogLabel,
  type EventListQuery,
  type EventResponse,
  type LocalStatsResponse,
  type TicketTypeResponse,
  type UpdateEventDto,
} from "@urnight/contracts";
import {
  CurrentUser,
  type AuthUser,
} from "../../../../edge/decorators/current-user.decorator";
import { Public } from "../../../../edge/decorators/public.decorator";
import { Roles } from "../../../../edge/decorators/roles.decorator";
import { tenantScopeOf } from "../../../../edge/tenant/tenant-scope.helper";
import { ZodValidationPipe } from "../../../../edge/pipes/zod-validation.pipe";
import { CancelEventUseCase } from "../../application/use-cases/cancel-event.use-case";
import { CreateEventUseCase } from "../../application/use-cases/create-event.use-case";
import { GetEventUseCase } from "../../application/use-cases/get-event.use-case";
import { GetLocalStatsUseCase } from "../../application/use-cases/get-local-stats.use-case";
import { GetMyEventUseCase } from "../../application/use-cases/get-my-event.use-case";
import { ListEventsUseCase } from "../../application/use-cases/list-events.use-case";
import { ListMyEventsUseCase } from "../../application/use-cases/list-my-events.use-case";
import { ListTrendingEventsUseCase } from "../../application/use-cases/list-trending-events.use-case";
import { ListUpcomingEventsUseCase } from "../../application/use-cases/list-upcoming-events.use-case";
import { ListTicketTypesUseCase } from "../../application/use-cases/list-ticket-types.use-case";
import { PublishEventUseCase } from "../../application/use-cases/publish-event.use-case";
import { UpdateEventUseCase } from "../../application/use-cases/update-event.use-case";
import type { Event } from "../../domain/entities/event.entity";
import type { EventListFilter } from "../../domain/ports/event.repository";
import type { TicketType } from "../../domain/entities/ticket-type.entity";

/** Eventos (EVENT). /api/v1/events. Lectura pública; escritura admin_local. */
@Controller("events")
export class EventsController {
  constructor(
    private readonly listEvents: ListEventsUseCase,
    private readonly listTrending: ListTrendingEventsUseCase,
    private readonly listUpcoming: ListUpcomingEventsUseCase,
    private readonly listMyEvents: ListMyEventsUseCase,
    private readonly getEvent: GetEventUseCase,
    private readonly getLocalStats: GetLocalStatsUseCase,
    private readonly getMyEvent: GetMyEventUseCase,
    private readonly createEvent: CreateEventUseCase,
    private readonly updateEvent: UpdateEventUseCase,
    private readonly publishEvent: PublishEventUseCase,
    private readonly cancelEvent: CancelEventUseCase,
    private readonly listTicketTypes: ListTicketTypesUseCase,
  ) {}

  @Public()
  @Get()
  async list(
    @Res({ passthrough: true }) response: Response,
    @Query(new ZodValidationPipe(eventListQuerySchema)) query: EventListQuery,
  ): Promise<EventResponse[]> {
    const result = await this.listEvents.executePage(toEventFilter(query));
    response.setHeader("X-Total-Count", String(result.total));
    return result.events.map((event) => toEventResponse(event));
  }

  /** Eventos de un local de MI empresa (todos los estados). Aislado por tenant. */
  @Roles("admin_local")
  @Get("mine")
  async mine(
    @CurrentUser() actor: AuthUser,
    @Query("localId", ParseUUIDPipe) localId: string,
  ): Promise<EventResponse[]> {
    return (
      await this.listMyEvents.execute({ localId, scope: tenantScopeOf(actor) })
    ).map((event) => toEventResponse(event));
  }

  /** Detalle admin de un evento de MI empresa por id (cualquier estado). */
  @Roles("admin_local")
  @Get("manage/:id")
  async manage(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<EventResponse> {
    return toEventResponse(
      await this.getMyEvent.execute({
        eventId: id,
        scope: tenantScopeOf(actor),
      }),
    );
  }

  /** KPIs agregados de un local de MI empresa (#19/#22). */
  @Roles("admin_local")
  @Get("stats/:localId")
  async localStats(
    @CurrentUser() actor: AuthUser,
    @Param("localId", ParseUUIDPipe) localId: string,
  ): Promise<LocalStatsResponse> {
    return this.getLocalStats.execute({ localId, scope: tenantScopeOf(actor) });
  }

  @Public()
  @Get("trending")
  async trending(): Promise<EventResponse[]> {
    return (await this.listTrending.execute()).map((event) =>
      toEventResponse(event, "trending"),
    );
  }

  @Public()
  @Get("upcoming")
  async upcoming(): Promise<EventResponse[]> {
    return (await this.listUpcoming.execute()).map((event) =>
      toEventResponse(event),
    );
  }

  @Public()
  @Get(":slug")
  async detail(@Param("slug") slug: string): Promise<EventResponse> {
    return toEventResponse(await this.getEvent.execute(slug));
  }

  @Public()
  @Get(":id/ticket-types")
  async ticketTypes(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<TicketTypeResponse[]> {
    return (await this.listTicketTypes.execute(id)).map(toTicketTypeResponse);
  }

  @Roles("admin_local")
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() actor: AuthUser,
    @Body(new ZodValidationPipe(createEventSchema)) dto: CreateEventDto,
  ): Promise<EventResponse> {
    return toEventResponse(
      await this.createEvent.execute({
        dto,
        createdBy: actor.id,
        scope: tenantScopeOf(actor),
      }),
    );
  }

  /** Editar un evento de MI empresa (datos + flyer). Aislado por tenant. */
  @Roles("admin_local")
  @Patch(":id")
  @HttpCode(HttpStatus.OK)
  async update(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateEventSchema)) dto: UpdateEventDto,
  ): Promise<EventResponse> {
    return toEventResponse(
      await this.updateEvent.execute({
        eventId: id,
        dto,
        scope: tenantScopeOf(actor),
      }),
    );
  }

  @Roles("admin_local")
  @Post(":id/publish")
  @HttpCode(HttpStatus.OK)
  async publish(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<EventResponse> {
    return toEventResponse(
      await this.publishEvent.execute({
        eventId: id,
        scope: tenantScopeOf(actor),
      }),
    );
  }

  @Roles("admin_local")
  @Post(":id/cancel")
  @HttpCode(HttpStatus.OK)
  async cancel(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(cancelEventSchema)) _dto: CancelEventDto,
  ): Promise<EventResponse> {
    return toEventResponse(
      await this.cancelEvent.execute({
        eventId: id,
        scope: tenantScopeOf(actor),
      }),
    );
  }
}

/** Mapea el query validado (#3) al filtro del dominio (fechas → Date). */
function toEventFilter(query: EventListQuery): EventListFilter {
  return {
    q: query.q,
    localId: query.localId,
    zoneId: query.zoneId,
    genreId: query.genreId,
    tagId: query.tagId,
    from: query.from ? new Date(query.from) : undefined,
    to: query.to ? new Date(query.to) : undefined,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    limit: query.limit,
    offset: query.offset,
  };
}

export function toEventResponse(
  e: Event,
  label?: EventCatalogLabel,
): EventResponse {
  const remaining = Math.max(e.totalCapacity - e.ticketsSold, 0);
  const fewTickets =
    e.totalCapacity > 0 && remaining > 0 && remaining / e.totalCapacity < 0.15;

  return {
    id: e.id,
    localId: e.localId,
    name: e.name,
    slug: e.slug,
    description: e.description,
    startsAt: e.startsAt.toISOString(),
    endsAt: e.endsAt ? e.endsAt.toISOString() : null,
    flyerUrl: e.flyerUrl,
    totalCapacity: e.totalCapacity,
    ticketsSold: e.ticketsSold,
    status: e.status,
    minAgeNote: e.minAgeNote,
    dressCode: e.dressCode,
    publishedAt: e.publishedAt ? e.publishedAt.toISOString() : null,
    createdAt: e.createdAt.toISOString(),
    genreIds: e.genreIds,
    tagIds: e.tagIds,
    customTags: e.customTags,
    catalogLabel: label ?? (fewTickets ? "fewTickets" : null),
  };
}

export function toTicketTypeResponse(t: TicketType): TicketTypeResponse {
  return {
    id: t.id,
    eventId: t.eventId,
    name: t.name,
    tierCode: t.tierCode,
    price: t.price,
    currency: t.currency,
    stock: t.stock,
    sold: t.sold,
    remaining: t.remaining(),
    maxPerUser: t.maxPerUser,
    status: t.status,
  };
}
