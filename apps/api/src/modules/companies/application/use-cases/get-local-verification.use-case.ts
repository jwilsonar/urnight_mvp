import { Inject, Injectable } from '@nestjs/common';
import type { LocalVerification } from '../../domain/entities/local-verification.entity';
import {
  LOCAL_VERIFICATION_REPOSITORY,
  type LocalVerificationRepository,
} from '../../domain/ports/local-verification.repository';

/** Lectura pública acotada: estado y fecha de la revisión más reciente del local. */
@Injectable()
export class GetLocalVerificationUseCase {
  constructor(
    @Inject(LOCAL_VERIFICATION_REPOSITORY)
    private readonly verifications: LocalVerificationRepository,
  ) {}

  execute(localId: string): Promise<LocalVerification | null> {
    return this.verifications.findLatestByLocalId(localId);
  }
}
