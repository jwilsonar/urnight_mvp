import { UnderageError } from '../errors/identity.errors';

/** Tipo de documento (§4.1 DocumentType). lowercase canónico. */
export type DocumentType = 'dni' | 'ce' | 'passport';

/** Edad mínima legal del MVP (§4.3). Duplicado intencional: el dominio es puro. */
const MIN_AGE = 18;
const DOCUMENT_TYPES: readonly DocumentType[] = ['dni', 'ce', 'passport'];
const DOCUMENT_NUMBER_RE = /^[A-Za-z0-9]{8,20}$/;

/**
 * Value Object PersonalId — identidad documental + fecha de nacimiento (§4.1).
 * Inmutable y autovalidado: garantiza formato de documento y, como última
 * barrera de dominio, mayoría de edad. NO depende de NestJS/Zod (Dependency Rule).
 */
export class PersonalId {
  private constructor(
    readonly documentType: DocumentType,
    readonly documentNumber: string,
    readonly birthDate: Date,
  ) {}

  static create(input: {
    documentType: DocumentType;
    documentNumber: string;
    birthDate: Date;
  }): PersonalId {
    if (!DOCUMENT_TYPES.includes(input.documentType)) {
      throw new Error(`PersonalId: documentType inválido (${input.documentType})`);
    }
    const number = input.documentNumber.trim();
    if (!DOCUMENT_NUMBER_RE.test(number)) {
      throw new Error('PersonalId: documentNumber inválido');
    }
    if (Number.isNaN(input.birthDate.getTime())) {
      throw new Error('PersonalId: birthDate inválida');
    }
    const vo = new PersonalId(input.documentType, number, input.birthDate);
    if (!vo.isAdult()) {
      // Invariante 18+ tipada (§4.3): mapea a 422 vía ProblemJsonFilter, no 500.
      throw new UnderageError();
    }
    return vo;
  }

  /** Mayoría de edad respecto a `now` (default: ahora). */
  isAdult(now: Date = new Date()): boolean {
    return this.ageAt(now) >= MIN_AGE;
  }

  ageAt(now: Date = new Date()): number {
    let age = now.getFullYear() - this.birthDate.getFullYear();
    const m = now.getMonth() - this.birthDate.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < this.birthDate.getDate())) age--;
    return age;
  }

  equals(other: PersonalId): boolean {
    return (
      this.documentType === other.documentType &&
      this.documentNumber === other.documentNumber
    );
  }
}
