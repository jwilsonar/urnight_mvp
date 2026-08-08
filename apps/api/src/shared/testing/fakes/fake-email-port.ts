import type { EmailMessage, EmailPort } from '../../adapters/email/email.port';

/** EmailPort en memoria; captura mensajes sin producir efectos externos. */
export class FakeEmailPort implements EmailPort {
  readonly messages: EmailMessage[] = [];

  async send(message: EmailMessage): Promise<void> {
    this.messages.push({ ...message });
  }
}
