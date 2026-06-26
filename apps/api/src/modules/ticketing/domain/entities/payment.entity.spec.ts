import { describe, expect, it } from 'vitest';
import { PaymentBuilder } from '../../../../shared/testing/builders/ticketing';
import { PaymentMother } from '../../../../shared/testing/mothers/ticketing';

describe('Payment (entidad)', () => {
  it('inicia en estado pending sin referencia ni confirmación', () => {
    const payment = new PaymentBuilder().withAmount(120).build();
    expect(payment.status).toBe('pending');
    expect(payment.amount).toBe(120);
    expect(payment.gatewayReference).toBeNull();
    expect(payment.failureReason).toBeNull();
  });

  it('usa el gateway mock por defecto', () => {
    const payment = new PaymentBuilder().build();
    expect(payment.gateway).toBe('mock');
  });

  it('approve marca aprobado con referencia del gateway', () => {
    const payment = new PaymentBuilder().build();
    payment.approve('culqi-ref-9');
    expect(payment.status).toBe('approved');
    expect(payment.gatewayReference).toBe('culqi-ref-9');
    expect(payment.failureReason).toBeNull();
  });

  it('reject marca rechazado con la razón del fallo', () => {
    const payment = new PaymentBuilder().build();
    payment.reject('Fondos insuficientes');
    expect(payment.status).toBe('rejected');
    expect(payment.failureReason).toBe('Fondos insuficientes');
    expect(payment.gatewayReference).toBeNull();
  });

  it('Mother.approved y Mother.rejected exponen estados predefinidos', () => {
    expect(PaymentMother.approved().status).toBe('approved');
    expect(PaymentMother.rejected().status).toBe('rejected');
    expect(PaymentMother.pending().status).toBe('pending');
  });
});
