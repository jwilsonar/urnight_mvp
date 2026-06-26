import { describe, expect, it } from 'vitest';
import { LocalVerification } from './local-verification.entity';
import { LocalVerificationBuilder } from '../../../../shared/testing/builders/companies';
import { LocalVerificationMother } from '../../../../shared/testing/mothers/companies';

describe('LocalVerification (ITSE / licencia)', () => {
  it('se solicita en estado pending sin revisor y no otorga verificación', () => {
    const verification = LocalVerification.request({
      id: 'v1',
      localId: 'l1',
      licenseReference: 'ITSE-001',
      validUntil: '2027-01-01',
    });
    expect(verification.status).toBe('pending');
    expect(verification.localId).toBe('l1');
    expect(verification.licenseReference).toBe('ITSE-001');
    expect(verification.validUntil).toBe('2027-01-01');
    expect(verification.grantsVerification()).toBe(false);
  });

  it('aprobar otorga verificación (grantsVerification=true)', () => {
    const verification = new LocalVerificationBuilder().build();
    verification.review('approved', 'super-admin');
    expect(verification.status).toBe('approved');
    expect(verification.grantsVerification()).toBe(true);
  });

  it('observar NO otorga verificación (transición de estado válida)', () => {
    const verification = new LocalVerificationBuilder().build();
    verification.review('observed', 'super-admin', 'Falta plano de evacuación');
    expect(verification.status).toBe('observed');
    expect(verification.grantsVerification()).toBe(false);
  });

  it('expirar NO otorga verificación', () => {
    const verification = new LocalVerificationBuilder().build();
    verification.review('expired', 'super-admin');
    expect(verification.status).toBe('expired');
    expect(verification.grantsVerification()).toBe(false);
  });

  it('hidrata desde persistencia conservando el status almacenado', () => {
    const verification = LocalVerification.fromPersistence({
      id: 'v9',
      localId: 'l9',
      status: 'approved',
      licenseReference: null,
      documentUrl: null,
      notes: null,
      verifiedBy: 'admin',
      validUntil: null,
      createdAt: new Date(),
    });
    expect(verification.status).toBe('approved');
    expect(verification.grantsVerification()).toBe(true);
  });

  it('mother expone verificaciones por estado y solo approved otorga', () => {
    expect(LocalVerificationMother.pending().grantsVerification()).toBe(false);
    expect(LocalVerificationMother.approved().grantsVerification()).toBe(true);
    expect(LocalVerificationMother.observed().grantsVerification()).toBe(false);
    expect(LocalVerificationMother.expired().grantsVerification()).toBe(false);
  });
});
