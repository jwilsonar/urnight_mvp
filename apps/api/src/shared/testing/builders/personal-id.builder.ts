import {
  PersonalId,
  type DocumentType,
} from '../../../modules/identity/domain/value-objects/personal-id.value-object';

/** Fecha de nacimiento a `years` años atrás desde hoy. */
export function yearsAgo(years: number): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d;
}

export interface PersonalIdProps {
  documentType: DocumentType;
  documentNumber: string;
  birthDate: Date;
}

/** Builder fluido para PersonalId. `buildProps()` para casos inválidos (esperan throw). */
export class PersonalIdBuilder {
  private documentType: DocumentType = 'dni';
  private documentNumber = '12345678';
  private birthDate: Date = yearsAgo(25);

  withType(documentType: DocumentType): this {
    this.documentType = documentType;
    return this;
  }

  withNumber(documentNumber: string): this {
    this.documentNumber = documentNumber;
    return this;
  }

  withBirthDate(birthDate: Date): this {
    this.birthDate = birthDate;
    return this;
  }

  asAdult(age = 25): this {
    this.birthDate = yearsAgo(age);
    return this;
  }

  asMinor(age = 16): this {
    this.birthDate = yearsAgo(age);
    return this;
  }

  /** Input crudo, sin validar — para tests que esperan que `create` lance. */
  buildProps(): PersonalIdProps {
    return {
      documentType: this.documentType,
      documentNumber: this.documentNumber,
      birthDate: this.birthDate,
    };
  }

  build(): PersonalId {
    return PersonalId.create(this.buildProps());
  }
}
