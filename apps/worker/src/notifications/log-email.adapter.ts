import { Injectable } from '@nestjs/common';
import { createLogger } from '../logging/logger';
import { EmailPort, type EmailMessage } from './email.port';

/**
 * Adapter mock de correo (§1.5, mismo criterio que MockPaymentAdapter): registra
 * el envío. Se sustituye por Resend/SES sin tocar processors ni dominio.
 */
@Injectable()
export class LogEmailAdapter extends EmailPort {
  private readonly log = createLogger(LogEmailAdapter.name);

  async send(message: EmailMessage): Promise<void> {
    this.log.info({ to: message.to, subject: message.subject }, 'worker.email.sent');
  }
}
