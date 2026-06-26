import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { AssignEventDto } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import {
  RESOURCE_TENANT_RESOLVER,
  type ResourceTenantResolver,
} from '../../../../shared/tenant/resource-tenant.port';
import { assertTenant, type TenantScope } from '../../../../shared/tenant/tenant-scope';
import { UnitOfWork } from '../../../../shared/unit-of-work/unit-of-work';
import { PromoterEvent } from '../../domain/entities/promoter-event.entity';
import {
  AllocationExceedsStockError,
  AssignmentForbiddenError,
  PromoterEventNotFoundError,
  PromoterNotFoundError,
} from '../../domain/errors/promoters.errors';
import {
  PROMOTER_EVENT_REPOSITORY,
  type AssignmentView,
  type PromoterEventRepository,
} from '../../domain/ports/promoter-event.repository';
import {
  PROMOTER_REPOSITORY,
  type PromoterRepository,
} from '../../domain/ports/promoter.repository';

export interface AssignEventInput {
  promoterId: string;
  assignedBy: string;
  dto: AssignEventDto;
  scope: TenantScope;
}

/**
 * Caso de uso: el admin asigna un evento a un promotor ACTIVO con descuento +
 * cupo por tipo de entrada. Aislado por tenant (promotor y evento deben ser de la
 * empresa del actor). Idempotente por (promotor, evento): re-asignar reemplaza.
 */
@Injectable()
export class AssignEventToPromoterUseCase {
  private readonly log = createLogger(AssignEventToPromoterUseCase.name);

  constructor(
    @Inject(PROMOTER_REPOSITORY) private readonly promoters: PromoterRepository,
    @Inject(PROMOTER_EVENT_REPOSITORY) private readonly promoterEvents: PromoterEventRepository,
    @Inject(RESOURCE_TENANT_RESOLVER) private readonly tenant: ResourceTenantResolver,
    private readonly uow: UnitOfWork,
  ) {}

  async execute(input: AssignEventInput): Promise<AssignmentView> {
    const promoter = await this.promoters.findById(input.promoterId);
    if (!promoter) throw new PromoterNotFoundError();
    assertTenant(input.scope, promoter.companyId);
    if (!promoter.isActive()) throw new AssignmentForbiddenError();

    const eventCompany = await this.tenant.companyIdForEvent(input.dto.eventId);
    if (!eventCompany) throw new AssignmentForbiddenError();
    assertTenant(input.scope, eventCompany);

    // El cupo se acota al stock disponible (stock − vendidas); el tipo de entrada
    // debe pertenecer al evento.
    const stocks = await this.promoterEvents.listTicketStocks(input.dto.eventId);
    const remainingByType = new Map(stocks.map((s) => [s.ticketTypeId, s.remaining]));
    for (const item of input.dto.items) {
      const remaining = remainingByType.get(item.ticketTypeId);
      if (remaining === undefined) throw new AssignmentForbiddenError();
      if (item.allocatedStock > remaining) throw new AllocationExceedsStockError();
    }

    const allocations = input.dto.items.map((i) => ({
      ticketTypeId: i.ticketTypeId,
      discountType: i.discountType,
      discountValue: i.discountValue,
      allocatedStock: i.allocatedStock,
    }));

    // Upsert idempotente por (promotor, evento): si ya existe, se reemplazan las
    // allocations conservando la cabecera (y por tanto los códigos ya generados).
    const existingId = await this.promoterEvents.findIdByPromoterAndEvent(
      input.promoterId,
      input.dto.eventId,
    );
    let targetId = existingId;

    await this.uow.run(async (tx) => {
      if (existingId) {
        await this.promoterEvents.replaceAllocations(existingId, allocations, tx);
      } else {
        const id = randomUUID();
        targetId = id;
        await this.promoterEvents.create(
          PromoterEvent.create({
            id,
            promoterId: input.promoterId,
            eventId: input.dto.eventId,
            assignedBy: input.assignedBy,
            allocations,
          }),
          tx,
        );
      }
    });

    const view = await this.promoterEvents.findView(targetId as string);
    if (!view) throw new PromoterEventNotFoundError();
    this.log.info(
      {
        promoterId: input.promoterId,
        eventId: input.dto.eventId,
        items: input.dto.items.length,
        edited: Boolean(existingId),
      },
      'promoters.assignment.upserted',
    );
    return view;
  }
}
