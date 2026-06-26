import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import type { Job } from 'bullmq';
import { createLogger } from '../logging/logger';
import { EmailPort } from '../notifications/email.port';
import { PushPort } from '../notifications/push.port';
import { TicketPdfService } from '../pdf/ticket-pdf.service';
import { StoragePort } from '../storage/storage.port';

interface OrderTicketsData {
  orderId: string;
  userId: string;
  ticketIds: string[];
}
interface EmailJobData {
  userId: string;
  email: string;
  token?: string;
}

/**
 * Consumidor de la cola 'notifications' (alimentada por el OutboxRelay). Despacha
 * por `job.name`. Envío vía EmailPort/PushPort (mock log en MVP; el proveedor
 * real se conecta sin tocar este processor). El PDF de entradas se añade en P0.6.
 */
@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  private readonly log = createLogger(NotificationsProcessor.name);

  constructor(
    @Inject(EmailPort) private readonly email: EmailPort,
    @Inject(PushPort) private readonly push: PushPort,
    private readonly pdf: TicketPdfService,
    @Inject(StoragePort) private readonly storage: StoragePort,
  ) {
    super();
  }

  async process(job: Job): Promise<{ ok: true }> {
    switch (job.name) {
      case 'send-order-tickets':
        await this.handleOrderTickets(job.data as OrderTicketsData);
        break;
      case 'send-verification-email':
        await this.handleVerificationEmail(job.data as EmailJobData);
        break;
      case 'send-welcome-email':
        await this.handleWelcomeEmail(job.data as EmailJobData);
        break;
      default:
        this.log.warn({ name: job.name }, 'worker.job.unknown');
    }
    return { ok: true };
  }

  private async handleOrderTickets(data: OrderTicketsData): Promise<void> {
    // PDF de entradas (§1.1, async) → storage (key) → correo + push.
    const pdf = await this.pdf.generate({ orderId: data.orderId, ticketIds: data.ticketIds ?? [] });
    const key = await this.storage.putObject(
      `tickets/${data.orderId}.pdf`,
      pdf,
      'application/pdf',
    );
    await this.email.send({
      to: `user:${data.userId}`,
      subject: 'Tus entradas UrNight',
      body: `Orden ${data.orderId}: ${data.ticketIds?.length ?? 0} entrada(s). PDF: ${key}`,
    });
    await this.push.send({
      userId: data.userId,
      title: 'Entradas listas',
      body: `Tu orden ${data.orderId} fue confirmada.`,
    });
  }

  private async handleVerificationEmail(data: EmailJobData): Promise<void> {
    await this.email.send({
      to: data.email,
      subject: 'Verifica tu correo — UrNight',
      body: `Tu código de verificación: ${data.token ?? ''}`,
    });
  }

  private async handleWelcomeEmail(data: EmailJobData): Promise<void> {
    await this.email.send({
      to: data.email,
      subject: 'Bienvenido a UrNight',
      body: 'Tu cuenta está lista. ¡Descubre la noche!',
    });
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.log.info({ jobId: job.id, name: job.name }, 'worker.job.completed');
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error): void {
    this.log.error({ jobId: job.id, name: job.name, err }, 'worker.job.failed');
  }
}
