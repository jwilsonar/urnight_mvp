import { Inject, Injectable } from '@nestjs/common';
import {
  MFA_REPOSITORY,
  type MfaRepository,
} from '../../domain/ports/mfa.repository';

export type MfaStatusResult =
  | { enrolled: false; type: null; confirmedAt: null; recoveryCodesLeft: 0 }
  | {
      enrolled: true;
      type: 'totp';
      confirmedAt: string;
      recoveryCodesLeft: number;
    };

@Injectable()
export class GetMfaStatusUseCase {
  constructor(@Inject(MFA_REPOSITORY) private readonly mfa: MfaRepository) {}

  async execute(input: { userId: string }): Promise<MfaStatusResult> {
    const factor = await this.mfa.findActiveFactor(input.userId);
    if (!factor || !factor.confirmedAt) {
      return { enrolled: false, type: null, confirmedAt: null, recoveryCodesLeft: 0 };
    }
    return {
      enrolled: true,
      type: factor.type,
      confirmedAt: factor.confirmedAt.toISOString(),
      recoveryCodesLeft: await this.mfa.countUnusedRecoveryCodes(input.userId),
    };
  }
}
