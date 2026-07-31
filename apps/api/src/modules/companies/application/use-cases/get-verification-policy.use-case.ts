import { Inject, Injectable } from '@nestjs/common';
import {
  VERIFICATION_POLICY_PORT,
  type VerificationPolicy,
  type VerificationPolicyPort,
} from '../../domain/ports/verification-policy.port';

@Injectable()
export class GetVerificationPolicyUseCase {
  constructor(
    @Inject(VERIFICATION_POLICY_PORT)
    private readonly policy: VerificationPolicyPort,
  ) {}

  execute(): Promise<VerificationPolicy> {
    return this.policy.getPolicy();
  }
}
