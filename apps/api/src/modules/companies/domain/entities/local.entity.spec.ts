import { describe, expect, it } from 'vitest';
import { Local } from './local.entity';
import { LocalBuilder } from '../../../../shared/testing/builders/companies';
import { LocalMother } from '../../../../shared/testing/mothers/companies';

describe('Local (multi-tenant por companyId)', () => {
  it('se crea en borrador (draft), no visible y sin verificar', () => {
    const local = Local.create({
      id: 'l1',
      companyId: 'c1',
      name: '  Aurora Barranco  ',
      slug: 'aurora-barranco',
    });
    expect(local.id).toBe('l1');
    expect(local.companyId).toBe('c1');
    expect(local.name).toBe('Aurora Barranco');
    expect(local.status).toBe('draft');
    expect(local.isVerified).toBe(false);
    expect(local.isVisible()).toBe(false);
    expect(local.zoneId).toBeNull();
  });

  it('publicar lo hace visible (status=active) y limpia el motivo de suspensión', () => {
    const local = new LocalBuilder().suspended('spam').build();
    expect(local.status).toBe('suspended');
    local.publish();
    expect(local.status).toBe('active');
    expect(local.isVisible()).toBe(true);
  });

  it('suspender lo oculta (status=suspended) con motivo y deja de ser visible', () => {
    const local = new LocalBuilder().asActive().build();
    expect(local.isVisible()).toBe(true);
    local.suspend('Reportado por usuarios');
    expect(local.status).toBe('suspended');
    expect(local.isVisible()).toBe(false);
  });

  it('un local en borrador no es visible (invariante visibilidad = active)', () => {
    const local = new LocalBuilder().build();
    expect(local.status).toBe('draft');
    expect(local.isVisible()).toBe(false);
  });

  it('setVerified alterna el flag de verificación derivado', () => {
    const local = new LocalBuilder().build();
    local.setVerified(true);
    expect(local.isVerified).toBe(true);
    local.setVerified(false);
    expect(local.isVerified).toBe(false);
  });

  it('hidrata desde persistencia conservando status, verificación y companyId', () => {
    const now = new Date();
    const local = Local.fromPersistence({
      id: 'l9',
      companyId: 'c9',
      zoneId: 'z1',
      name: 'Aurora',
      slug: 'aurora',
      description: null,
      address: null,
      latitude: null,
      longitude: null,
      googleMapsUrl: null,
      socials: null,
      mainImageKey: null,
      status: 'active',
      suspensionReason: null,
      isVerified: true,
      createdAt: now,
      updatedAt: now,
    });
    expect(local.status).toBe('active');
    expect(local.isVerified).toBe(true);
    expect(local.companyId).toBe('c9');
    expect(local.zoneId).toBe('z1');
  });

  it('mother expone locales por estado', () => {
    expect(LocalMother.draft().isVisible()).toBe(false);
    expect(LocalMother.active().isVisible()).toBe(true);
    expect(LocalMother.suspended().status).toBe('suspended');
    expect(LocalMother.verified().isVerified).toBe(true);
  });
});
