import { describe, expect, it } from 'vitest';
import { Company } from './company.entity';
import { CompanyBuilder } from '../../../../shared/testing/builders/companies';
import { CompanyMother } from '../../../../shared/testing/mothers/companies';

describe('Company (tenant raíz)', () => {
  it('se crea activa con razón social y nombre comercial recortados', () => {
    const company = Company.create({
      id: 'c1',
      legalName: '  Discoteca Aurora S.A.C.  ',
      ruc: '20512345678',
      commercialName: '  Aurora Club  ',
    });
    expect(company.id).toBe('c1');
    expect(company.legalName).toBe('Discoteca Aurora S.A.C.');
    expect(company.commercialName).toBe('Aurora Club');
    expect(company.ruc).toBe('20512345678');
    expect(company.status).toBe('active');
    expect(company.contactEmail).toBeNull();
    expect(company.contactPhone).toBeNull();
    expect(company.createdAt).toBeInstanceOf(Date);
  });

  it('conserva los datos de contacto cuando se proporcionan', () => {
    const company = Company.create({
      id: 'c1',
      legalName: 'Aurora S.A.C.',
      ruc: '20512345678',
      commercialName: 'Aurora',
      contactEmail: 'contacto@aurora.pe',
      contactPhone: '+51999888777',
    });
    expect(company.contactEmail).toBe('contacto@aurora.pe');
    expect(company.contactPhone).toBe('+51999888777');
  });

  it('suspende la empresa (status=suspended)', () => {
    const company = new CompanyBuilder().build();
    company.suspend();
    expect(company.status).toBe('suspended');
  });

  it('reactiva una empresa suspendida (status=active)', () => {
    const company = new CompanyBuilder().suspended().build();
    expect(company.status).toBe('suspended');
    company.activate();
    expect(company.status).toBe('active');
  });

  it('hidrata desde persistencia conservando el status almacenado', () => {
    const now = new Date();
    const company = Company.fromPersistence({
      id: 'c9',
      legalName: 'Aurora S.A.C.',
      ruc: '20512345678',
      commercialName: 'Aurora',
      contactEmail: null,
      contactPhone: null,
      status: 'suspended',
      createdAt: now,
      updatedAt: now,
    });
    expect(company.status).toBe('suspended');
    expect(company.createdAt).toBe(now);
  });

  it('mother expone empresa válida y suspendida', () => {
    expect(CompanyMother.valid().status).toBe('active');
    expect(CompanyMother.suspended().status).toBe('suspended');
  });
});
