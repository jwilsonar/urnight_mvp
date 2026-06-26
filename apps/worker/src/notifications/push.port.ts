export interface PushMessage {
  readonly userId: string;
  readonly title: string;
  readonly body: string;
}

/**
 * Puerto de notificaciones push (anti-corruption §3.2). El adapter real
 * (FCM/APNs) se conecta sin tocar los processors.
 */
export abstract class PushPort {
  abstract send(message: PushMessage): Promise<void>;
}
