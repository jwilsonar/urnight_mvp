import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { EventBus } from '../../../../shared/event-bus/event-bus';
import { GrantRoleUseCase } from '../use-cases/grant-role.use-case';

interface AssociationConfirmedShape {
  promoterId: string;
  userId: string;
  companyId: string;
  localId: string | null;
}

/**
 * Suscriptor de `promoters.association_confirmed` (§3.2). Cuando un promotor
 * confirma su asociación, Identity le otorga el rol `promoter` con scope
 * multi-tenant (company/local). Desacopla: el módulo Promoters no conoce RBAC,
 * solo publica el evento. Idempotente: si ya tiene el rol con ese scope, ignora.
 */
@Injectable()
export class PromoterConfirmedSubscriber implements OnModuleInit {
  private readonly logger = new Logger(PromoterConfirmedSubscriber.name);

  constructor(
    private readonly bus: EventBus,
    private readonly grantRole: GrantRoleUseCase,
  ) {}

  onModuleInit(): void {
    this.bus.subscribe('promoters.association_confirmed', async (event) => {
      const p = event.payload as AssociationConfirmedShape;
      try {
        await this.grantRole.execute({
          actorUserId: p.userId,
          targetUserId: p.userId,
          roleCode: 'promoter',
          companyId: p.companyId,
          localId: p.localId,
        });
      } catch (err) {
        this.logger.warn(`Otorgar rol promoter omitido: ${(err as Error).message}`);
      }
    });
  }
}
