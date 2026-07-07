import { describe, expect, it } from 'vitest';
import type { ValidateQrDto } from '@urnight/contracts';
import { fakeUnitOfWork } from '../../../../shared/testing/fakes';
import {
  AttendeeBuilder,
  SaleEventBuilder,
  TicketBuilder,
} from '../../../../shared/testing/builders/ticketing';
import {
  InMemoryInventoryRepository,
  InMemoryQrValidationRepository,
  InMemoryTicketRepository,
} from '../../../../shared/testing/in-memory/ticketing';
import { ValidatorScopeError } from '../../domain/errors/checkout.errors';
import { ValidateQrUseCase, type ValidatorContext } from './validate-qr.use-case';

const EVENT_ID = 'event-1';
const LOCAL_ID = 'local-1';
const COMPANY_ID = 'company-1';

function build() {
  const tickets = new InMemoryTicketRepository();
  const validations = new InMemoryQrValidationRepository();
  const inventory = new InMemoryInventoryRepository();
  // C1: el evento aporta el local/empresa que el use-case deriva del ticket.
  inventory.seedEvent(
    new SaleEventBuilder().withId(EVENT_ID).withLocal(LOCAL_ID).withCompany(COMPANY_ID).build(),
  );
  const uow = fakeUnitOfWork();
  const useCase = new ValidateQrUseCase(tickets, validations, inventory, uow);
  return { useCase, tickets, validations, inventory };
}

const dto = (qrCode: string): ValidateQrDto => ({ qrCode, deviceInfo: 'gate-1' });

/** Validador con scope en el local del evento (deriva del JWT en producción). */
const scopedValidator = (over: Partial<ValidatorContext> = {}): ValidatorContext => ({
  id: 'val-1',
  isSuperAdmin: false,
  companyId: COMPANY_ID,
  localId: LOCAL_ID,
  ...over,
});

describe('ValidateQrUseCase', () => {
  it('QR válido: marca usado, suma check-in y registra la validación', async () => {
    const { useCase, tickets, validations, inventory } = build();
    tickets.seed(
      'user-1',
      new TicketBuilder().withId('t1').withEvent(EVENT_ID).withQr('qr-valid').build(),
      new AttendeeBuilder().build(),
    );

    const res = await useCase.execute({ dto: dto('qr-valid'), validator: scopedValidator() });

    expect(res.result).toBe('valid');
    expect(res.ticketId).toBe('t1');
    expect(res.message).toBe('Acceso permitido.');
    expect((await tickets.findByQr('qr-valid'))?.status).toBe('used');
    expect(inventory.countersOf(EVENT_ID).checkins).toBe(1);
    expect(validations.last()?.result).toBe('valid');
    expect(validations.last()?.validatedBy).toBe('val-1');
    // C1: el localId registrado se deriva del evento del ticket, no del body.
    expect(validations.last()?.localId).toBe(LOCAL_ID);
  });

  it('C2: marca ATÓMICA — si pierde la carrera (markUsedIfValid=false) → already_used sin doble check-in', async () => {
    const { useCase, tickets, validations, inventory } = build();
    tickets.seed(
      'user-1',
      new TicketBuilder().withId('t1').withEvent(EVENT_ID).withQr('qr-race').build(),
      new AttendeeBuilder().build(),
    );
    // Simula el escaneo concurrente: el ticket se ve 'valid' pero el UPDATE
    // condicional no toca fila (otro validador lo quemó primero).
    tickets.markUsedIfValid = async () => false;

    const res = await useCase.execute({ dto: dto('qr-race'), validator: scopedValidator() });

    expect(res.result).toBe('already_used');
    expect(res.ticketId).toBe('t1');
    expect(inventory.countersOf(EVENT_ID).checkins).toBe(0);
    expect(validations.last()?.result).toBe('already_used');
  });

  it('C1: validador de otro local/empresa → ValidatorScopeError (no valida)', async () => {
    const { useCase, tickets, validations, inventory } = build();
    tickets.seed(
      'user-1',
      new TicketBuilder().withId('t1').withEvent(EVENT_ID).withQr('qr-cross').build(),
      new AttendeeBuilder().build(),
    );

    await expect(
      useCase.execute({
        dto: dto('qr-cross'),
        validator: scopedValidator({ localId: 'local-OTRO', companyId: 'company-OTRA' }),
      }),
    ).rejects.toBeInstanceOf(ValidatorScopeError);

    // No se quemó la entrada ni se registró check-in.
    expect((await tickets.findByQr('qr-cross'))?.status).toBe('valid');
    expect(inventory.countersOf(EVENT_ID).checkins).toBe(0);
    expect(validations.size).toBe(0);
  });

  it('C1: super_admin puede validar cualquier local', async () => {
    const { useCase, tickets } = build();
    tickets.seed(
      'user-1',
      new TicketBuilder().withId('t1').withEvent(EVENT_ID).withQr('qr-sa').build(),
      new AttendeeBuilder().build(),
    );

    const res = await useCase.execute({
      dto: dto('qr-sa'),
      validator: { id: 'root', isSuperAdmin: true, companyId: null, localId: null },
    });

    expect(res.result).toBe('valid');
  });

  it('QR ya usado: devuelve already_used, registra el intento y no suma check-in', async () => {
    const { useCase, tickets, validations, inventory } = build();
    tickets.seed(
      'user-1',
      new TicketBuilder().withId('t1').withEvent(EVENT_ID).withQr('qr-used').buildUsed(),
      new AttendeeBuilder().build(),
    );

    const res = await useCase.execute({ dto: dto('qr-used'), validator: scopedValidator() });

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

    const res = await useCase.execute({ dto: dto('qr-cxl'), validator: scopedValidator() });

    expect(res.result).toBe('cancelled');
    expect(validations.last()?.result).toBe('cancelled');
  });

  it('QR desconocido: devuelve invalid sin registrar validación (antes del scope check)', async () => {
    const { useCase, validations } = build();
    const res = await useCase.execute({ dto: dto('qr-nope'), validator: scopedValidator() });

    expect(res.result).toBe('invalid');
    expect(res.ticketId).toBeNull();
    expect(res.attendeeName).toBeNull();
    expect(validations.size).toBe(0);
  });
});
