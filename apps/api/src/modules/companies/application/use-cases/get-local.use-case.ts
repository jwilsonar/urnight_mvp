import { Inject, Injectable } from '@nestjs/common';
import type { Local } from '../../domain/entities/local.entity';
import { LocalNotFoundError } from '../../domain/errors/companies.errors';
import { LOCAL_REPOSITORY, type LocalRepository } from '../../domain/ports/local.repository';

/** Caso de uso (lectura pública): detalle de local por slug. */
@Injectable()
export class GetLocalUseCase {
  constructor(@Inject(LOCAL_REPOSITORY) private readonly locals: LocalRepository) {}

  async execute(slug: string): Promise<Local> {
    const local = await this.locals.findBySlug(slug);
    if (!local) throw new LocalNotFoundError();
    return local;
  }
}
