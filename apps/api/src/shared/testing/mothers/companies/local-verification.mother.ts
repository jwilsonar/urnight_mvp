import type { LocalVerification } from '../../../../modules/companies/domain/entities/local-verification.entity';
import { LocalVerificationBuilder } from '../../builders/companies/local-verification.builder';

/** Casos predefinidos de LocalVerification. */
export const LocalVerificationMother = {
  pending: (): LocalVerification => new LocalVerificationBuilder().build(),
  approved: (): LocalVerification => new LocalVerificationBuilder().reviewed('approved').build(),
  observed: (): LocalVerification => new LocalVerificationBuilder().reviewed('observed').build(),
  expired: (): LocalVerification => new LocalVerificationBuilder().reviewed('expired').build(),
};
