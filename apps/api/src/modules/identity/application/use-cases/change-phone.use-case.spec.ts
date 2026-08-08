import { describe, expect, it } from 'vitest';
import {
  FakePasswordHasher,
  InMemoryUserRepository,
  UserBuilder,
} from '../../../../shared/testing';
import { InvalidCredentialsError } from '../../domain/errors/identity.errors';
import { ChangePhoneUseCase } from './change-phone.use-case';

const USER_ID = '88888888-8888-4888-8888-888888888888';
const CURRENT_PASSWORD = 'supersecret';

async function build() {
  const users = new InMemoryUserRepository();
  await users.create(
    new UserBuilder()
      .withId(USER_ID)
      .withEmail('telefono@example.test')
      .withPasswordHash(`hashed:${CURRENT_PASSWORD}`)
      .build(),
  );
  const useCase = new ChangePhoneUseCase(users, new FakePasswordHasher());
  return { useCase, users };
}

describe('ChangePhoneUseCase', () => {
  it('rechaza una contrasena actual incorrecta', async () => {
    const { useCase } = await build();

    await expect(
      useCase.execute({
        userId: USER_ID,
        currentPassword: 'wrong',
        phone: '987654321',
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('aplica un telefono peruano valido', async () => {
    const { useCase, users } = await build();

    await useCase.execute({
      userId: USER_ID,
      currentPassword: CURRENT_PASSWORD,
      phone: '987654321',
    });

    expect((await users.findById(USER_ID))?.phone).toBe('987654321');
  });
});
