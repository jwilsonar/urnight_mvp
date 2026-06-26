import { Inject, Injectable } from '@nestjs/common';
import { createLogger } from '../../../../shared/logging/logger';
import { EventBus } from '../../../../shared/event-bus/event-bus';
import type { Local } from '../../domain/entities/local.entity';
import { LocalNotFoundError, TenantForbiddenError } from '../../domain/errors/companies.errors';
import { LocalPublishedEvent } from '../../domain/events/companies.events';
import { LOCAL_REPOSITORY, type LocalRepository } from '../../domain/ports/local.repository';

/** Caso de uso: publicar local (pasa a visible). */
@Injectable()
export class PublishLocalUseCase {
  private readonly log = createLogger(PublishLocalUseCase.name);

  constructor(
    @Inject(LOCAL_REPOSITORY) private readonly locals: LocalRepository,
    private readonly events: EventBus,
  ) {}

  async execute(input: {
    localId: string;
    isSuperAdmin: boolean;
    actorCompanyId?: string | null;
  }): Promise<Local> {
    const local = await this.locals.findById(input.localId);
    if (!local) {
      this.log.warn({ localId: input.localId }, 'companies.local.not_found');
      throw new LocalNotFoundError();
    }
    if (!input.isSuperAdmin && input.actorCompanyId !== local.companyId) {
      throw new TenantForbiddenError();
    }
    local.publish();
    const saved = await this.locals.update(local);
    await this.events.publish(
      new LocalPublishedEvent({ localId: saved.id, companyId: saved.companyId }),
    );
    this.log.info({ localId: saved.id }, 'companies.local.published');
    return saved;
  }
}
