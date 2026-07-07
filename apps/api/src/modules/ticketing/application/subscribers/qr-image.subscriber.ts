import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { STORAGE_PORT, type StoragePort } from '../../../../shared/adapters/storage/storage.port';
import { EventBus } from '../../../../shared/event-bus/event-bus';
import { createLogger } from '../../../../shared/logging/logger';
import type { TicketIssuedPayload } from '../../domain/events/checkout.events';
import { QR_IMAGE_PORT, type QrImagePort } from '../../domain/ports/qr-image.port';
import { TICKET_REPOSITORY, type TicketRepository } from '../../domain/ports/ticket.repository';

/**
 * Suscriptor de `checkout.ticket_issued` (A8). Extrae del CheckoutUseCase el
 * rendering del PNG del QR + subida a S3: el caso de uso ya no orquesta imágenes
 * (SRP). Best-effort — si falla, la entrada sigue válida (el token `qrCode` es la
 * fuente de verdad en puerta; el cliente puede pintar el QR desde el token).
 */
@Injectable()
export class QrImageSubscriber implements OnModuleInit {
  private readonly log = createLogger(QrImageSubscriber.name);

  constructor(
    private readonly bus: EventBus,
    @Inject(TICKET_REPOSITORY) private readonly tickets: TicketRepository,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
    @Inject(QR_IMAGE_PORT) private readonly qrImage: QrImagePort,
  ) {}

  onModuleInit(): void {
    this.bus.subscribe('checkout.ticket_issued', async (event) => {
      const p = event.payload as TicketIssuedPayload;
      try {
        const png = await this.qrImage.render(p.qrCode);
        const key = `tickets/${p.ticketId}/qr.png`;
        await this.storage.putObject(key, png, 'image/png');
        await this.tickets.attachQrImage(p.ticketId, key);
        this.log.debug({ ticketId: p.ticketId, key }, 'ticketing.qr.image_stored');
      } catch (err) {
        this.log.warn({ ticketId: p.ticketId, err: (err as Error).message }, 'ticketing.qr.image_failed');
      }
    });
  }
}
