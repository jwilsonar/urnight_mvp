import { describe, expect, it } from 'vitest';
import { LegalDocument } from './legal-document.entity';

describe('LegalDocument', () => {
  describe('publish', () => {
    it('crea un documento vigente (isCurrent=true) con publishedAt', () => {
      const d = LegalDocument.publish({
        id: 'd1',
        docType: 'terms',
        version: '1.0',
        contentUrl: 'https://cdn.urnight.pe/terms-1.0.pdf',
      });
      expect(d.id).toBe('d1');
      expect(d.docType).toBe('terms');
      expect(d.version).toBe('1.0');
      expect(d.contentUrl).toBe('https://cdn.urnight.pe/terms-1.0.pdf');
      expect(d.isCurrent).toBe(true);
      expect(d.publishedAt).toBeInstanceOf(Date);
    });
  });

  describe('supersede', () => {
    it('deja de ser la versión vigente', () => {
      const d = LegalDocument.publish({ id: 'd2', docType: 'privacy', version: '1.0', contentUrl: 'u' });
      expect(d.isCurrent).toBe(true);
      d.supersede();
      expect(d.isCurrent).toBe(false);
    });
  });

  it('hidrata desde persistencia', () => {
    const d = LegalDocument.fromPersistence({
      id: 'd3',
      docType: 'refund_policy',
      version: '2.1',
      contentUrl: 'u',
      isCurrent: false,
      publishedAt: new Date(),
    });
    expect(d.docType).toBe('refund_policy');
    expect(d.version).toBe('2.1');
    expect(d.isCurrent).toBe(false);
  });
});
