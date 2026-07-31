import { Inject, Injectable } from '@nestjs/common';
import { EventBus } from '../../../../shared/event-bus/event-bus';
import { LocalNotFoundError } from '../../domain/errors/companies.errors';
import { LocalVerifiedEvent } from '../../domain/events/companies.events';
import {
  LOCAL_REPOSITORY,
  type LocalRepository,
} from '../../domain/ports/local.repository';
import { GetLocalVerificationStatusUseCase } from './get-local-verification-status.use-case';

@Injectable()
export class RefreshLocalVerificationUseCase {
  constructor(
    @Inject(LOCAL_REPOSITORY) private readonly locals: LocalRepository,
    private readonly getStatus: GetLocalVerificationStatusUseCase,
    private readonly events: EventBus,
  ) {}

  async execute(localId: string): Promise<boolean> {
    const local = await this.locals.findById(localId);
    if (!local) throw new LocalNotFoundError();
    const status = await this.getStatus.execute(localId);
    const verified = status?.verified ?? false;
    if (local.isVerified !== verified) {
      local.setVerified(verified);
      await this.locals.update(local);
      await this.events.publish(
        new LocalVerifiedEvent({ localId: local.id, verified }),
      );
    }
    return verified;
  }
}
