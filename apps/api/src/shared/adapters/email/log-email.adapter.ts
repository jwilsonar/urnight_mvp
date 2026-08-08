import { Injectable } from '@nestjs/common';
import { createLogger } from '../../logging/logger';
import type { EmailMessage, EmailPort } from './email.port';

/** Adapter local: confirma el envio sin registrar destinatario, cuerpo ni codigo. */
@Injectable()
export class LogEmailAdapter implements EmailPort {
  private readonly log = createLogger(LogEmailAdapter.name);

  async send(_message: EmailMessage): Promise<void> {
    this.log.info({}, 'identity.email.sent');
  }
}
