import { describe, expect, it } from 'vitest';
import type { ValidateQrDto } from '@urnight/contracts';
import { fakeUnitOfWork } from '../../../../shared/testing/fakes';
import { AttendeeBuilder, TicketBuilder } from '../../../../shared/testing/builders/ticketing';
import {
  InMemoryInventoryRepository,
  InMemoryQrValidationRepository,
  InMemoryTicketRepository,
} from '../../../../shared/testing/in-memory/ticketing';
import { ValidateQrUseCase } from './validate-qr.use-case';

const EVENT_ID = 'event-1';

function build() {
  const tickets = new InMemoryTicketRepository();
  const validations = new InMemoryQrValidationRepository();
  const inventory = new InMemoryInventoryRepository();
  const uow = fakeUnitOfWork();
  const useCase = new ValidateQrUseCase(tickets, validations, inventory, uow);
  return { useCase, tickets, validations, inventory };
}

const dto = (qrCode: string): ValidateQrDto => ({ qrCode, deviceInfo: 'gate-1' });

describe('ValidateQrUseCase', () => {
  it('QR válido: marca usado, suma check-in y registra la validación', async () => {
    const { useCase, tickets, validations, inventory } = build();
    tickets.seed(
      'user-1',
      new TicketBuilder().withId('t1').withEvent(EVENT_ID).withQr('qr-valid').build(),
      new AttendeeBuilder().build(),
    );

    const res = await useCase.execute({ dto: dto('qr-valid'), validatorId: 'val-1' });

    expect(res.result).toBe('valid');
    expect(res.ticketId).toBe('t1');
    expect(res.message).toBe('Acceso permitido.');
    expect((await tickets.findByQr('qr-valid'))?.status).toBe('used');
    expect(inventory.countersOf(EVENT_ID).checkins).toBe(1);
    expect(validations.last()?.result).toBe('valid');
    expect(validations.last()?.validatedBy).toBe('val-1');
  });

  it('QR ya usado: devuelve already_used, registra el intento y no suma check-in', async () => {
    const { useCase, tickets, validations, inventory } = build();
    tickets.seed(
      'user-1',
      new TicketBuilder().withId('t1').withEvent(EVENT_ID).withQr('qr-used').buildUsed(),
      new AttendeeBuilder().build(),
    );

    const res = await useCase.execute({ dto: dto('qr-used'), validatorId: 'val-1' });

    expect(res.result).toBe('already_used');
    expect(res.ticketId).toBe('t1');
    expect(inventory.countersOf(EVENT_ID).checkins).toBe(0);
    expect(validations.last()?.result).toBe('already_used');
  });

  it('QR de ticket cancelado: devuelve cancelled y registra el intento', async () => {
    const { useCase, tickets, validations } = build();
    tickets.seed(
      'user-1',
      new TicketBuilder().withId('t1').withEvent(EVENT_ID).withQr('qr-cxl').buildCancelled(),
      new AttendeeBuilder().build(),
    );

    const res = await useCase.execute({ dto: dto('qr-cxl'), validatorId: 'val-1' });

    expect(res.result).toBe('cancelled');
    expect(validations.last()?.result).toBe('cancelled');
  });

  it('QR desconocido: devuelve invalid sin registrar validación', async () => {
    const { useCase, validations } = build();
    const res = await useCase.execute({ dto: dto('qr-nope'), validatorId: 'val-1' });

    expect(res.result).toBe('invalid');
    expect(res.ticketId).toBeNull();
    expect(res.attendeeName).toBeNull();
    expect(validations.size).toBe(0);
  });
});
