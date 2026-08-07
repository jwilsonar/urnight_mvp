import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../../config/env.schema';
import { BrevoEmailAdapter } from './brevo-email.adapter';
import { EMAIL_PORT } from './email.port';
import { LogEmailAdapter } from './log-email.adapter';

/** Selecciona el proveedor sin instanciar Brevo cuando el adapter local esta activo. */
@Module({
  providers: [
    {
      provide: EMAIL_PORT,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        config.getOrThrow('EMAIL_PROVIDER', { infer: true }) === 'brevo'
          ? new BrevoEmailAdapter(config)
          : new LogEmailAdapter(),
    },
  ],
  exports: [EMAIL_PORT],
})
export class EmailModule {}
