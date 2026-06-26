import { describe, expect, it } from 'vitest';
import { AffiliationRequest } from './affiliation-request.entity';
import { AffiliationRequestBuilder } from '../../../../shared/testing/builders/companies';
import { AffiliationRequestMother } from '../../../../shared/testing/mothers/companies';

describe('AffiliationRequest (solicitud de afiliación)', () => {
  it('se envía en estado pending sin vínculos a empresa/local', () => {
    const request = AffiliationRequest.submit({
      id: 'a1',
      legalName: '  Aurora S.A.C.  ',
      ruc: '20512345678',
      commercialName: '  Aurora  ',
      submittedBy: 'user-1',
    });
    expect(request.status).toBe('pending');
    expect(request.isPending()).toBe(true);
    expect(request.legalName).toBe('Aurora S.A.C.');
    expect(request.commercialName).toBe('Aurora');
    expect(request.companyId).toBeNull();
    expect(request.localId).toBeNull();
    expect(request.rejectionReason).toBeNull();
  });

  it('aprobar vincula empresa+local, fija revisor y deja de estar pending', () => {
    const request = new AffiliationRequestBuilder().build();
    request.approve('super-admin', 'company-1', 'local-1');
    expect(request.status).toBe('approved');
    expect(request.isPending()).toBe(false);
    expect(request.companyId).toBe('company-1');
    expect(request.localId).toBe('local-1');
  });

  it('rechazar fija el motivo y deja de estar pending sin crear empresa/local', () => {
    const request = new AffiliationRequestBuilder().build();
    request.reject('super-admin', 'RUC inválido');
    expect(request.status).toBe('rejected');
    expect(request.isPending()).toBe(false);
    expect(request.rejectionReason).toBe('RUC inválido');
    expect(request.companyId).toBeNull();
    expect(request.localId).toBeNull();
  });

  it('hidrata desde persistencia conservando status y vínculos', () => {
    const request = AffiliationRequest.fromPersistence({
      id: 'a9',
      legalName: 'Aurora',
      ruc: '20512345678',
      commercialName: 'Aurora',
      zoneId: null,
      address: null,
      socials: null,
      contactName: null,
      contactEmail: null,
      contactPhone: null,
      status: 'approved',
      rejectionReason: null,
      submittedBy: null,
      reviewedBy: 'admin',
      companyId: 'c1',
      localId: 'l1',
      createdAt: new Date(),
      reviewedAt: new Date(),
    });
    expect(request.isPending()).toBe(false);
    expect(request.companyId).toBe('c1');
    expect(request.localId).toBe('l1');
  });

  it('mother expone solicitudes por estado', () => {
    expect(AffiliationRequestMother.pending().isPending()).toBe(true);
    expect(AffiliationRequestMother.approved().status).toBe('approved');
    expect(AffiliationRequestMother.rejected().status).toBe('rejected');
  });
});
