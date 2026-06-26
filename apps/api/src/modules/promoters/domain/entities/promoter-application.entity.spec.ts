import { describe, expect, it } from 'vitest';
import { PromoterApplication } from './promoter-application.entity';
import { PromoterApplicationBuilder } from '../../../../shared/testing/builders/promoters';
import { PromoterApplicationMother } from '../../../../shared/testing/mothers/promoters';

describe('PromoterApplication (entity)', () => {
  it('submit nace en estado pending y normaliza el nombre (trim)', () => {
    const app = PromoterApplication.submit({ id: 'a1', name: '  Juan Pérez  ' });
    expect(app.id).toBe('a1');
    expect(app.name).toBe('Juan Pérez');
    expect(app.status).toBe('pending');
    expect(app.isPending()).toBe(true);
    expect(app.createdPromoterId).toBeNull();
  });

  it('submit aplica null en los campos opcionales no provistos', () => {
    const app = PromoterApplication.submit({ id: 'a2', name: 'Sin Datos' });
    expect(app.localId).toBeNull();
    expect(app.contactEmail).toBeNull();
    expect(app.contactPhone).toBeNull();
    expect(app.applicantUserId).toBeNull();
  });

  it('approve transiciona a approved, fija revisor y vincula al promotor creado', () => {
    const app = PromoterApplication.submit({ id: 'a3', name: 'Aprobable' });
    app.approve('reviewer-1', 'promoter-9');
    expect(app.status).toBe('approved');
    expect(app.isPending()).toBe(false);
    expect(app.createdPromoterId).toBe('promoter-9');
  });

  it('reject transiciona a rejected sin crear promotor', () => {
    const app = PromoterApplication.submit({ id: 'a4', name: 'Rechazable' });
    app.reject('reviewer-2');
    expect(app.status).toBe('rejected');
    expect(app.isPending()).toBe(false);
    expect(app.createdPromoterId).toBeNull();
  });

  it('una postulación ya revisada deja de estar pendiente (invariante de transición)', () => {
    expect(PromoterApplicationMother.pending().isPending()).toBe(true);
    expect(PromoterApplicationMother.approved().isPending()).toBe(false);
    expect(PromoterApplicationMother.rejected().isPending()).toBe(false);
  });

  it('builder asApproved hidrata el promotor creado', () => {
    const app = new PromoterApplicationBuilder().asApproved('rev', 'prom-1').build();
    expect(app.status).toBe('approved');
    expect(app.createdPromoterId).toBe('prom-1');
  });
});
