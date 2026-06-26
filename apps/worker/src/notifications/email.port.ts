export interface EmailMessage {
  readonly to: string;
  readonly subject: string;
  readonly body: string;
}

/**
 * Puerto de envío de correo (anti-corruption §3.2). El adapter real (Resend/SES)
 * se conecta sin tocar los processors.
 */
export abstract class EmailPort {
  abstract send(message: EmailMessage): Promise<void>;
}
