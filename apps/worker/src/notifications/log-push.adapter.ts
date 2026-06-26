import { Injectable } from '@nestjs/common';
import { createLogger } from '../logging/logger';
import { PushPort, type PushMessage } from './push.port';

/** Adapter mock de push: registra el envío. Se sustituye por FCM/APNs sin tocar processors. */
@Injectable()
export class LogPushAdapter extends PushPort {
  private readonly log = createLogger(LogPushAdapter.name);

  async send(message: PushMessage): Promise<void> {
    this.log.info({ userId: message.userId, title: message.title }, 'worker.push.sent');
  }
}
