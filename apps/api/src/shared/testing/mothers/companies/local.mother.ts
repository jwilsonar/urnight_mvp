import type { Local } from '../../../../modules/companies/domain/entities/local.entity';
import { LocalBuilder } from '../../builders/companies/local.builder';

/** Casos predefinidos de Local. */
export const LocalMother = {
  draft: (): Local => new LocalBuilder().build(),
  active: (): Local => new LocalBuilder().asActive().build(),
  suspended: (): Local => new LocalBuilder().suspended().build(),
  verified: (): Local => new LocalBuilder().asActive().asVerified().build(),
};
