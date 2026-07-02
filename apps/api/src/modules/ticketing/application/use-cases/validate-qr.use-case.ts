import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { QrValidationResponse, ValidateQrDto } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import { UnitOfWork } from '../../../../shared/unit-of-work/unit-of-work';
import type { ValidationResult } from '../../domain/entities/ticket.entity';
import { ValidatorScopeError } from '../../domain/errors/checkout.errors';
import { INVENTORY_PORT, type InventoryPort } from '../../domain/ports/inventory.repository';
import {
  QR_VALIDATION_REPOSITORY,
  type QrValidationRepository,
} from '../../domain/ports/qr-validation.repository';
import { TICKET_REPOSITORY, type TicketRepository } from '../../domain/ports/ticket.repository';

const MESSAGES: Record<ValidationResult, string> = {
  valid: 'Acceso permitido.',
  already_used: 'La entrada ya fue usada.',
  cancelled: 'Entrada cancelada.',
  invalid: 'QR no válido.',
};

/** Identidad y scope del validador (derivados del JWT, no del body del cliente). */
export interface ValidatorContext {
  id: string;
  isSuperAdmin: boolean;
  companyId: string | null;
  localId: string | null;
}

/**
 * Caso de uso: validar QR en puerta (app validador). Si es válida: marca usada
 * de forma ATÓMICA (C2), suma check-in y registra la validación. Si no, registra
 * el intento. Control multi-tenant (C1): el local/empresa se derivan del EVENTO
 * del ticket (nunca del body) y se exige que el validador tenga scope allí.
 */
@Injectable()
export class ValidateQrUseCase {
  private readonly log = createLogger(ValidateQrUseCase.name);

  constructor(
    @Inject(TICKET_REPOSITORY) private readonly tickets: TicketRepository,
    @Inject(QR_VALIDATION_REPOSITORY) private readonly validations: QrValidationRepository,
    @Inject(INVENTORY_PORT) private readonly inventory: InventoryPort,
    private readonly uow: UnitOfWork,
  ) {}

  async execute(input: { dto: ValidateQrDto; validator: ValidatorContext }): Promise<QrValidationResponse> {
    this.log.debug({ validatorId: input.validator.id }, 'ticketing.qr.started');

    const ticket = await this.tickets.findByQr(input.dto.qrCode);
    if (!ticket) {
      this.log.warn({ validatorId: input.validator.id }, 'ticketing.qr.invalid');
      return { result: 'invalid', ticketId: null, attendeeName: null, message: MESSAGES.invalid };
    }

    // C1: local/empresa derivados del EVENTO del ticket (se IGNORA dto.localId).
    const ev = await this.inventory.getEvent(ticket.eventId);
    const localId = ev?.localId ?? null;
    const companyId = ev?.companyId ?? null;

    // C1: el validador debe tener scope (local o empresa) en el evento del ticket.
    this.assertValidatorScope(input.validator, ticket.id, localId, companyId);

    const domainResult = ticket.validate();
    if (domainResult === 'already_used' || domainResult === 'cancelled') {
      this.log.warn(
        { ticketId: ticket.id, eventId: ticket.eventId, validatorId: input.validator.id, result: domainResult },
        `ticketing.qr.${domainResult}`,
      );
    }

    let result: ValidationResult = domainResult;

    await this.uow.run(async (tx) => {
      if (domainResult === 'valid') {
        // C2: marca atómica condicionada a status='valid'. Si no toca fila, otro
        // escaneo concurrente ya la quemó → already_used, sin doble check-in.
        const marked = await this.tickets.markUsedIfValid(ticket.id, tx);
        if (marked) {
          ticket.markUsed();
          await this.inventory.incrementEventCheckins(ticket.eventId, tx);
        } else {
          result = 'already_used';
          this.log.warn(
            { ticketId: ticket.id, eventId: ticket.eventId, validatorId: input.validator.id },
            'ticketing.qr.race_already_used',
          );
        }
      }
      await this.validations.create(
        {
          id: randomUUID(),
          ticketId: ticket.id,
          eventId: ticket.eventId,
          localId,
          validatedBy: input.validator.id,
          result,
          method: 'scan',
          deviceInfo: input.dto.deviceInfo ?? null,
        },
        tx,
      );
    });

    if (result === 'valid') {
      this.log.info(
        { ticketId: ticket.id, eventId: ticket.eventId, validatorId: input.validator.id, localId },
        'ticketing.qr.validated',
      );
    }

    return { result, ticketId: ticket.id, attendeeName: null, message: MESSAGES[result] };
  }

  /**
   * C1: verifica el scope multi-tenant del validador contra el local/empresa del
   * ticket. `super_admin` pasa; el resto debe coincidir en local o empresa. El
   * scope proviene del JWT firmado por la API (canónico, §"Multi-tenant"), no del
   * cliente.
   *
   * TODO(C1): cuando exista una asignación por-evento del validador (tabla de
   * asignaciones o `ValidatorAccessPort` implementado por Identity), reforzar
   * aquí el chequeo fino de "validador asignado a ESTE evento", no solo al local.
   */
  private assertValidatorScope(
    validator: ValidatorContext,
    ticketId: string,
    localId: string | null,
    companyId: string | null,
  ): void {
    if (validator.isSuperAdmin) return;
    const matchesLocal = validator.localId !== null && validator.localId === localId;
    const matchesCompany = validator.companyId !== null && validator.companyId === companyId;
    if (!matchesLocal && !matchesCompany) {
      this.log.warn(
        { ticketId, validatorId: validator.id, ticketLocalId: localId, ticketCompanyId: companyId },
        'ticketing.qr.forbidden_scope',
      );
      throw new ValidatorScopeError();
    }
  }
}
