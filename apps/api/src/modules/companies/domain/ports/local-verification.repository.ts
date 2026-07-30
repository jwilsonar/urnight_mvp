import type { LocalVerification } from '../entities/local-verification.entity';

export interface LocalVerificationRepository {
  create(verification: LocalVerification): Promise<LocalVerification>;
  findById(id: string): Promise<LocalVerification | null>;
  findLatestByLocalId(localId: string): Promise<LocalVerification | null>;
  update(verification: LocalVerification): Promise<LocalVerification>;
}

export const LOCAL_VERIFICATION_REPOSITORY = Symbol('LOCAL_VERIFICATION_REPOSITORY');
