import { Global, Module } from '@nestjs/common';
import { DRIZZLE } from './drizzle.constants';
import { DrizzleService } from './drizzle.service';

/**
 * Módulo global de persistencia. Expone:
 *  - DrizzleService (posee db + sql, gestiona shutdown)
 *  - DRIZZLE (token → instancia `db`) para inyectar en repositorios.
 */
@Global()
@Module({
  providers: [
    DrizzleService,
    {
      provide: DRIZZLE,
      useFactory: (drizzle: DrizzleService) => drizzle.db,
      inject: [DrizzleService],
    },
  ],
  exports: [DRIZZLE, DrizzleService],
})
export class DatabaseModule {}
