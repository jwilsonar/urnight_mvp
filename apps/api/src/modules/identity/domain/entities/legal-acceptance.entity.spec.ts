import { describe, expect, it } from 'vitest';
import { LegalAcceptance } from './legal-acceptance.entity';

describe('LegalAcceptance', () => {
  it('record crea la constancia con el snapshot de versión e IP', () => {
    const a = LegalAcceptance.record({
      id: 'la1',
      userId: 'u1',
      legalDocumentId: 'd1',
      versionAccepted: '1.0',
      ipAddress: '1.2.3.4',
    });
    expect(a.id).toBe('la1');
    expect(a.userId).toBe('u1');
    expect(a.legalDocumentId).toBe('d1');
    expect(a.versionAccepted).toBe('1.0');
    expect(a.ipAddress).toBe('1.2.3.4');
    expect(a.acceptedAt).toBeInstanceOf(Date);
  });

  it('ipAddress es opcional (null por defecto)', () => {
    const a = LegalAcceptance.record({
      id: 'la2',
      userId: 'u2',
      legalDocumentId: 'd2',
      versionAccepted: '2.0',
    });
    expect(a.ipAddress).toBeNull();
  });

  it('hidrata desde persistencia', () => {
    const a = LegalAcceptance.fromPersistence({
      id: 'la3',
      userId: 'u3',
      legalDocumentId: 'd3',
      versionAccepted: '3.0',
      ipAddress: null,
      acceptedAt: new Date(),
    });
    expect(a.id).toBe('la3');
    expect(a.versionAccepted).toBe('3.0');
  });
});
