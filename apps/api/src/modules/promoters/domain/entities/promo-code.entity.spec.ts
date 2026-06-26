import { describe, expect, it } from 'vitest';
import { PromoCode } from './promo-code.entity';
import { PromoCodeBuilder } from '../../../../shared/testing/builders/promoters';
import { PromoCodeMother } from '../../../../shared/testing/mothers/promoters';

/** Instante fijo para evaluar vigencia (no se confía en el reloj real). */
const NOW = new Date('2026-06-15T12:00:00Z');

describe('PromoCode (aggregate)', () => {
  describe('create', () => {
    it('nace activo, con 0 usos y conserva tipo/valor de descuento', () => {
      const promo = PromoCode.create({
        id: 'pc1',
        code: 'WELCOME10',
        discountType: 'percentage',
        discountValue: 10,
        scope: 'global',
      });
      expect(promo.code).toBe('WELCOME10');
      expect(promo.discountType).toBe('percentage');
      expect(promo.discountValue).toBe(10);
      expect(promo.usedCount).toBe(0);
      expect(promo.usageQuota).toBeNull();
      expect(promo.isActive).toBe(true);
      expect(promo.scope).toBe('global');
    });
  });

  describe('isValid (reglas de validez §4.1)', () => {
    it('un código global activo y sin vigencia es válido', () => {
      const promo = new PromoCodeBuilder().build();
      expect(promo.isValid({ subtotal: 100, now: NOW })).toEqual({ valid: true, reason: null });
    });

    it('un código inactivo es inválido (invariante: estado)', () => {
      const promo = new PromoCodeBuilder().asInactive().build();
      const check = promo.isValid({ subtotal: 100, now: NOW });
      expect(check.valid).toBe(false);
      expect(check.reason).toBe('Código inactivo');
    });

    it('rechaza un código aún no vigente (validFrom en el futuro)', () => {
      const promo = new PromoCodeBuilder()
        .withValidity(new Date('2026-07-01T00:00:00Z'), null)
        .build();
      const check = promo.isValid({ subtotal: 100, now: NOW });
      expect(check.valid).toBe(false);
      expect(check.reason).toBe('Aún no vigente');
    });

    it('rechaza un código expirado (validUntil en el pasado)', () => {
      const promo = new PromoCodeBuilder()
        .withValidity(null, new Date('2026-06-01T00:00:00Z'))
        .build();
      const check = promo.isValid({ subtotal: 100, now: NOW });
      expect(check.valid).toBe(false);
      expect(check.reason).toBe('Código expirado');
    });

    it('acepta dentro de la ventana de vigencia [validFrom, validUntil]', () => {
      const promo = new PromoCodeBuilder()
        .withValidity(new Date('2026-06-01T00:00:00Z'), new Date('2026-06-30T00:00:00Z'))
        .build();
      expect(promo.isValid({ subtotal: 100, now: NOW }).valid).toBe(true);
    });

    it('rechaza cuando el cupo está agotado (usedCount >= usageQuota)', () => {
      const promo = new PromoCodeBuilder().withUsageQuota(5).withUsedCount(5).build();
      const check = promo.isValid({ subtotal: 100, now: NOW });
      expect(check.valid).toBe(false);
      expect(check.reason).toBe('Cupo agotado');
    });

    it('acepta cuando aún queda cupo disponible (usedCount < usageQuota)', () => {
      const promo = new PromoCodeBuilder().withUsageQuota(5).withUsedCount(4).build();
      expect(promo.isValid({ subtotal: 100, now: NOW }).valid).toBe(true);
    });

    it('scope event: rechaza si el evento del contexto no coincide', () => {
      const promo = new PromoCodeBuilder().forEvent('e1').build();
      const check = promo.isValid({ subtotal: 100, eventId: 'e2', now: NOW });
      expect(check.valid).toBe(false);
      expect(check.reason).toBe('No aplica a este evento');
    });

    it('scope event: acepta si el evento del contexto coincide', () => {
      const promo = new PromoCodeBuilder().forEvent('e1').build();
      expect(promo.isValid({ subtotal: 100, eventId: 'e1', now: NOW }).valid).toBe(true);
    });

    it('scope local: rechaza si el local del contexto no coincide', () => {
      const promo = new PromoCodeBuilder().forLocal('l1').build();
      const check = promo.isValid({ subtotal: 100, localId: 'l2', now: NOW });
      expect(check.valid).toBe(false);
      expect(check.reason).toBe('No aplica a este local');
    });

    it('scope local: acepta si el local del contexto coincide', () => {
      const promo = new PromoCodeBuilder().forLocal('l1').build();
      expect(promo.isValid({ subtotal: 100, localId: 'l1', now: NOW }).valid).toBe(true);
    });
  });

  describe('computeDiscount', () => {
    it('porcentaje: calcula el descuento proporcional redondeado a 2 decimales', () => {
      const promo = new PromoCodeBuilder().asPercentage(10).build();
      expect(promo.computeDiscount({ subtotal: 33.33 })).toBe(3.33); // 3.333 -> 3.33
    });

    it('monto fijo: aplica el valor pero nunca supera el subtotal', () => {
      const promo = new PromoCodeBuilder().asFixedAmount(50).build();
      expect(promo.computeDiscount({ subtotal: 100 })).toBe(50);
      expect(promo.computeDiscount({ subtotal: 30 })).toBe(30); // tope = subtotal
    });

    it('porcentaje del 100% no excede el subtotal', () => {
      const promo = new PromoCodeBuilder().asPercentage(100).build();
      expect(promo.computeDiscount({ subtotal: 80 })).toBe(80);
    });
  });

  it('mother expone variantes inactivas/agotadas/expiradas inválidas', () => {
    expect(PromoCodeMother.inactive().isValid({ subtotal: 100, now: NOW }).valid).toBe(false);
    expect(PromoCodeMother.exhausted().isValid({ subtotal: 100, now: NOW }).valid).toBe(false);
    expect(PromoCodeMother.expired().isValid({ subtotal: 100, now: NOW }).valid).toBe(false);
    expect(PromoCodeMother.percentage().isValid({ subtotal: 100, now: NOW }).valid).toBe(true);
  });
});
