import type { PersonalId } from '../../../modules/identity/domain/value-objects/personal-id.value-object';
import { PersonalIdBuilder, type PersonalIdProps } from '../builders/personal-id.builder';

/** Casos predefinidos de PersonalId. `*Props` devuelven input crudo (esperan throw). */
export const PersonalIdMother = {
  adult: (): PersonalId => new PersonalIdBuilder().asAdult().build(),
  /** Input de un menor de edad — `PersonalId.create` debe lanzar. */
  minorProps: (): PersonalIdProps => new PersonalIdBuilder().asMinor().buildProps(),
  /** Input con documento de formato inválido — `PersonalId.create` debe lanzar. */
  invalidDocumentProps: (): PersonalIdProps =>
    new PersonalIdBuilder().withNumber('abc').buildProps(),
};
