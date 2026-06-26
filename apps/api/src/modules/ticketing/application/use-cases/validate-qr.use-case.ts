import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { QrValidationResponse, ValidateQrDto } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import { UnitOfWork } from '../../../../shared/unit-of-work/unit-of-work';
import type { ValidationResult } from '../../domain/entities/ticket.entity';
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

/**
 * Caso de uso: validar QR en puerta (app validador). Si es válida: marca usada,
 * suma check-in y registra la validación (atómico). Si no, registra el intento.
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

  async execute(input: { dto: ValidateQrDto; validatorId: string }): Promise<QrValidationResponse> {
    this.log.debug(
      { validatorId: input.validatorId, localId: input.dto.localId ?? null },
      'ticketing.qr.started',
    );
    const ticket = await this.tickets.findByQr(input.dto.qrCode);
    if (!ticket) {
      this.log.warn(
        { validatorId: input.validatorId, localId: input.dto.localId ?? null },
        'ticketing.qr.invalid',
      );
      return { result: 'invalid', ticketId: null, attendeeName: null, message: MESSAGES.invalid };
    }

    const result = ticket.validate();

    if (result === 'already_used') {
      this.log.warn(
        { ticketId: ticket.id, eventId: ticket.eventId, validatorId: input.validatorId },
        'ticketing.qr.already_used',
      );
    } else if (result === 'cancelled') {
      this.log.warn(
        { ticketId: ticket.id, eventId: ticket.eventId, validatorId: input.validatorId },
        'ticketing.qr.cancelled',
      );
    }

    await this.uow.run(async (tx) => {
      if (result === 'valid') {
        ticket.markUsed();
        await this.tickets.update(ticket, tx);
        await this.inventory.incrementEventCheckins(ticket.eventId, tx);
      }
      await this.validations.create(
        {
          id: randomUUID(),
          ticketId: ticket.id,
          eventId: ticket.eventId,
          localId: input.dto.localId ?? null,
          validatedBy: input.validatorId,
          result,
          method: 'scan',
          deviceInfo: input.dto.deviceInfo ?? null,
        },
        tx,
      );
    });

    if (result === 'valid') {
      this.log.info(
        {
          ticketId: ticket.id,
          eventId: ticket.eventId,
          validatorId: input.validatorId,
          localId: input.dto.localId ?? null,
        },
        'ticketing.qr.validated',
      );
    }

    return { result, ticketId: ticket.id, attendeeName: null, message: MESSAGES[result] };
  }
}
