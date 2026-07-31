import { describe, expect, it } from 'vitest';
import {
  deriveLocalVerification,
  LocalVerificationDocument,
  type LocalVerificationDocumentProps,
} from './local-verification-document.entity';

const NOW = new Date('2026-07-30T12:00:00.000Z');
const REQUIRED = ['municipal_license', 'itse_certificate'] as const;

function document(
  overrides: Partial<LocalVerificationDocumentProps> = {},
): LocalVerificationDocument {
  return LocalVerificationDocument.fromPersistence({
    id: crypto.randomUUID(),
    verificationId: crypto.randomUUID(),
    documentType: 'municipal_license',
    storageKey: 'locals/demo/verification/license.pdf',
    issuedAt: '2026-01-01',
    expiresAt: '2027-07-30',
    reviewStatus: 'approved',
    reviewedBy: crypto.randomUUID(),
    reviewedAt: NOW,
    reviewNotes: null,
    expiryWarningSentAt: null,
    createdAt: new Date('2026-01-02T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  });
}

describe('deriveLocalVerification', () => {
  it('vigente: todos los documentos requeridos aprobados y no vencidos', () => {
    const result = deriveLocalVerification(
      [
        document(),
        document({ documentType: 'itse_certificate' }),
      ],
      REQUIRED,
      NOW,
    );
    expect(result).toEqual({
      verified: true,
      expiringSoon: false,
      blocker: null,
    });
  });

  it('por vencer: conserva verificación y expone la advertencia', () => {
    const result = deriveLocalVerification(
      [
        document({ expiresAt: '2026-08-10' }),
        document({ documentType: 'itse_certificate' }),
      ],
      REQUIRED,
      NOW,
    );
    expect(result.verified).toBe(true);
    expect(result.expiringSoon).toBe(true);
  });

  it('vencido: degrada cuando no existe una versión aprobada vigente', () => {
    const result = deriveLocalVerification(
      [
        document({ expiresAt: '2026-07-29' }),
        document({ documentType: 'itse_certificate' }),
      ],
      REQUIRED,
      NOW,
    );
    expect(result).toEqual({
      verified: false,
      expiringSoon: false,
      blocker: 'expired',
    });
  });

  it('rechazado: no concede verificación', () => {
    const result = deriveLocalVerification(
      [
        document({ reviewStatus: 'rejected' }),
        document({ documentType: 'itse_certificate' }),
      ],
      REQUIRED,
      NOW,
    );
    expect(result.blocker).toBe('rejected');
    expect(result.verified).toBe(false);
  });

  it('falta documento requerido: no concede verificación', () => {
    const result = deriveLocalVerification([document()], REQUIRED, NOW);
    expect(result.blocker).toBe('missing_required_document');
    expect(result.verified).toBe(false);
  });

  it('renovación pendiente no degrada mientras la versión anterior siga vigente', () => {
    const result = deriveLocalVerification(
      [
        document(),
        document({
          reviewStatus: 'pending',
          reviewedBy: null,
          reviewedAt: null,
          createdAt: new Date('2026-07-29T00:00:00.000Z'),
        }),
        document({ documentType: 'itse_certificate' }),
      ],
      REQUIRED,
      NOW,
    );
    expect(result.verified).toBe(true);
  });
});
