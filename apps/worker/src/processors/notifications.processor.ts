import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { Job, UnrecoverableError } from 'bullmq';
import { eq, inArray } from 'drizzle-orm';
import { notification, ticket, outbox, type Database } from '@urnight/db';
import type { z } from 'zod';
import { DB } from '../db/db.module';
import { createLogger } from '../logging/logger';
import { EmailPort } from '../notifications/email.port';
import { PushPort } from '../notifications/push.port';
import { TicketPdfService } from '../pdf/ticket-pdf.service';
import { StoragePort } from '../storage/storage.port';
import {
  orderTicketsJobSchema,
  verificationEmailJobSchema,
  welcomeEmailJobSchema,
} from './job-schemas';

/**
 * Consumidor de la cola 'notifications' (alimentada por el OutboxRelay). Despacha
 * por `job.name`. Envío vía EmailPort/PushPort (stub log en el piloto — ver ADR
 * 0004; el proveedor real se conecta sin tocar este processor). El PDF de entradas
 * se sube a S3 real (StoragePort) y se persisten los efectos (ticket.pdf_url +
 * filas NOTIFICATION), con idempotencia por `ticket.pdf_url` para reprocesos.
 */
@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  private readonly log = createLogger(NotificationsProcessor.name);

  constructor(
    @Inject(EmailPort) private readonly email: EmailPort,
    @Inject(PushPort) private readonly push: PushPort,
    private readonly pdf: TicketPdfService,
    @Inject(StoragePort) private readonly storage: StoragePort,
    @Inject(DB) private readonly db: Database,
  ) {
    super();
  }

  async process(job: Job): Promise<{ ok: true }> {
    switch (job.name) {
      case 'send-order-tickets':
        await this.handleOrderTickets(this.parse(job, orderTicketsJobSchema));
        break;
      case 'send-verification-email':
        await this.handleVerificationEmail(this.parse(job, verificationEmailJobSchema));
        break;
      case 'send-welcome-email':
        await this.handleWelcomeEmail(this.parse(job, welcomeEmailJobSchema));
        break;
      default:
        // MEDIA: un job de nombre desconocido NO debe marcarse `completed` en
        // silencio. `UnrecoverableError` lo lleva a 'failed' sin reintentar.
        this.log.error({ name: job.name }, 'worker.job.unknown');
        throw new UnrecoverableError(`Job desconocido: ${job.name}`);
    }
    return { ok: true };
  }

  /** BAJA: valida `job.data` con Zod. Payload inválido = irreparable (no reintentar). */
  private parse<T>(job: Job, schema: z.ZodType<T, z.ZodTypeDef, unknown>): T {
    const result = schema.safeParse(job.data);
    if (!result.success) {
      this.log.error(
        { jobId: job.id, name: job.name, issues: result.error.flatten().fieldErrors },
        'worker.job.invalid_payload',
      );
      throw new UnrecoverableError(`Payload inválido para ${job.name}`);
    }
    return result.data;
  }

  private async handleOrderTickets(
    data: z.infer<typeof orderTicketsJobSchema>,
  ): Promise<void> {
    const ticketIds = data.ticketIds;

    // Idempotencia (MEDIA): `ticket.pdf_url` es la marca de "ya procesado". Si todas
    // las entradas ya la tienen, un reproceso (retry) no regenera el PDF ni reinserta
    // notificaciones. Estrategia at-least-once: en el primer run se sube el PDF (paso
    // falible) → se insertan NOTIFICATION → se setea pdf_url como ÚLTIMA escritura, de
    // modo que un fallo antes de fijar la marca dispara un reintento completo. La única
    // ventana de duplicado es un crash entre el insert de NOTIFICATION y el UPDATE de
    // pdf_url (raro; aceptable en el piloto, y email/push son stub sin efecto externo).
    const rows = ticketIds.length
      ? await this.db
          .select({ id: ticket.id, pdfUrl: ticket.pdfUrl })
          .from(ticket)
          .where(inArray(ticket.id, ticketIds))
      : [];
    if (rows.length > 0 && rows.every((r) => r.pdfUrl)) {
      this.log.info({ orderId: data.orderId }, 'worker.order_tickets.idempotent_skip');
      return;
    }

    // PDF de entradas (§1.1, async) → S3 real (key) → efectos persistidos + envío.
    const pdf = await this.pdf.generate({ orderId: data.orderId, ticketIds });
    const key = await this.storage.putObject(`tickets/${data.orderId}.pdf`, pdf, 'application/pdf');

    // Persiste NOTIFICATION (B2): así `GET /notifications/me` sirve datos reales, no
    // solo el seed. Canal email + push; estado 'sent' (stub log = entrega inmediata).
    await this.db.insert(notification).values([
      {
        userId: data.userId,
        channel: 'email',
        type: 'ticket_issued',
        subject: 'Tus entradas UrNight',
        body: `Orden ${data.orderId}: ${ticketIds.length} entrada(s). PDF adjunto.`,
        isTransactional: true,
        status: 'sent',
        sentAt: new Date(),
      },
      {
        userId: data.userId,
        channel: 'push',
        type: 'ticket_issued',
        subject: 'Entradas listas',
        body: `Tu orden ${data.orderId} fue confirmada.`,
        isTransactional: true,
        status: 'sent',
        sentAt: new Date(),
      },
    ]);

    // Persiste la key del PDF en ticket.pdf_url (B2). Marca de idempotencia (última escritura).
    if (ticketIds.length) {
      await this.db.update(ticket).set({ pdfUrl: key }).where(inArray(ticket.id, ticketIds));
    }

    await this.email.send({
      to: `user:${data.userId}`,
      subject: 'Tus entradas UrNight',
      body: `Orden ${data.orderId}: ${ticketIds.length} entrada(s). PDF: ${key}`,
    });
    await this.push.send({
      userId: data.userId,
      title: 'Entradas listas',
      body: `Tu orden ${data.orderId} fue confirmada.`,
    });
  }

  private async handleVerificationEmail(
    data: z.infer<typeof verificationEmailJobSchema>,
  ): Promise<void> {
    await this.email.send({
      to: data.email,
      subject: 'Verifica tu correo — UrNight',
      body: `Tu código de verificación: ${data.token ?? ''}`,
    });
    await this.recordEmailNotification(data.userId, 'email_verification', 'Verifica tu correo — UrNight');
  }

  private async handleWelcomeEmail(
    data: z.infer<typeof welcomeEmailJobSchema>,
  ): Promise<void> {
    await this.email.send({
      to: data.email,
      subject: 'Bienvenido a UrNight',
      body: 'Tu cuenta está lista. ¡Descubre la noche!',
    });
    await this.recordEmailNotification(data.userId, 'welcome', 'Bienvenido a UrNight');
  }

  /** Persiste una fila NOTIFICATION de canal email marcada 'sent' (B2). */
  private async recordEmailNotification(
    userId: string,
    type: string,
    subject: string,
  ): Promise<void> {
    await this.db.insert(notification).values({
      userId,
      channel: 'email',
      type,
      subject,
      isTransactional: true,
      status: 'sent',
      sentAt: new Date(),
    });
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.log.info({ jobId: job.id, name: job.name }, 'worker.job.completed');
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error): void {
    this.log.error({ jobId: job.id, name: job.name, err }, 'worker.job.failed');
    // A4: tras agotar los reintentos (o error irrecuperable), persiste el fallo en
    // la fila outbox (jobId === outbox.id) marcándola 'failed'. La fila la había
    // dejado 'done' el relay al encolar; aquí registramos el desenlace terminal para
    // trazabilidad/DLQ. BullMQ retiene además el job en el set de fallidos (removeOnFail).
    const maxAttempts = job.opts.attempts ?? 1;
    const terminal = err.name === 'UnrecoverableError' || job.attemptsMade >= maxAttempts;
    if (!terminal || !job.id) return;
    void this.db
      .update(outbox)
      .set({ status: 'failed', lastError: err.message, processedAt: new Date() })
      .where(eq(outbox.id, job.id))
      .catch((dbErr) =>
        this.log.error({ jobId: job.id, err: dbErr }, 'worker.job.failed_persist_error'),
      );
  }
}
