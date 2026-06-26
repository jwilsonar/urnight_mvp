import { describe, expect, it } from 'vitest';
import type { ApplyPromoterDto } from '@urnight/contracts';
import { InMemoryPromoterApplicationRepository } from '../../../../shared/testing/in-memory/promoters';
import { ApplyPromoterUseCase } from './apply-promoter.use-case';

function build() {
  const applications = new InMemoryPromoterApplicationRepository();
  const useCase = new ApplyPromoterUseCase(applications);
  return { applications, useCase };
}

const dto: ApplyPromoterDto = {
  name: 'Carla Ríos',
  localId: '11111111-1111-1111-1111-111111111111',
  contactEmail: 'carla@example.com',
};

describe('ApplyPromoterUseCase', () => {
  it('crea una postulación pending y la persiste en el repositorio', async () => {
    const { applications, useCase } = build();

    const result = await useCase.execute({ dto, applicantUserId: 'user-1' });

    expect(result.status).toBe('pending');
    expect(result.name).toBe('Carla Ríos');
    expect(result.applicantUserId).toBe('user-1');
    expect(applications.size).toBe(1);
    expect(applications.all[0]?.id).toBe(result.id);
  });

  it('aplica applicantUserId null cuando la postulación es anónima', async () => {
    const { useCase } = build();
    const result = await useCase.execute({ dto });
    expect(result.applicantUserId).toBeNull();
  });

  it('genera un id distinto por cada postulación', async () => {
    const { useCase } = build();
    const a = await useCase.execute({ dto });
    const b = await useCase.execute({ dto });
    expect(a.id).not.toBe(b.id);
  });
});
