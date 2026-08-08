import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../../config/env.schema';
import type { EmailMessage, EmailPort } from './email.port';

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

/** Adapter transaccional de Brevo. La configuracion invalida falla al construirlo. */
@Injectable()
export class BrevoEmailAdapter implements EmailPort {
  private readonly apiKey: string;
  private readonly from: string;
  private readonly fromName: string | undefined;

  constructor(config: ConfigService<Env, true>) {
    const apiKey = config.get('BREVO_API_KEY', { infer: true });
    if (!apiKey) {
      throw new Error('BREVO_API_KEY es obligatorio cuando EMAIL_PROVIDER=brevo.');
    }
    this.apiKey = apiKey;
    this.from = config.getOrThrow('EMAIL_FROM', { infer: true });
    this.fromName = config.get('EMAIL_FROM_NAME', { infer: true });
  }

  async send(message: EmailMessage): Promise<void> {
    const response = await fetch(BREVO_ENDPOINT, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': this.apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { email: this.from, ...(this.fromName ? { name: this.fromName } : {}) },
        to: [{ email: message.to }],
        subject: message.subject,
        textContent: message.body,
      }),
    });
    if (!response.ok) throw new Error('Brevo rechazo el envio de correo.');
  }
}
