export interface EmailMessage {
  readonly to: string;
  readonly subject: string;
  readonly body: string;
}

export interface EmailPort {
  send(message: EmailMessage): Promise<void>;
}

export const EMAIL_PORT = Symbol('EMAIL_PORT');
