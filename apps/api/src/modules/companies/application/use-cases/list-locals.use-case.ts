import { Inject, Injectable } from '@nestjs/common';
import type { Local } from '../../domain/entities/local.entity';
import {
  LOCAL_REPOSITORY,
  type LocalListFilter,
  type LocalRepository,
} from '../../domain/ports/local.repository';

/** Caso de uso (lectura pública): listar locales visibles con filtros (#3). */
@Injectable()
export class ListLocalsUseCase {
  constructor(@Inject(LOCAL_REPOSITORY) private readonly locals: LocalRepository) {}

  execute(filter?: LocalListFilter): Promise<Local[]> {
    return this.locals.listVisible(filter);
  }
}
