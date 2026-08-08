import { describe, expect, it } from 'vitest';
import {
  FakePasswordHasher,
  FakeTokenService,
  InMemoryUserRepository,
  RecordingOutbox,
  UserBuilder,
} from '../../../../shared/testing';
import {
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
} from '../../domain/errors/identity.errors';
import { RequestEmailChangeUseCase } from './request-email-change.use-case';

const USER_ID = '55555555-5555-4555-8555-555555555555';
const CURRENT_PASSWORD = 'supersecret';

async function build() {
  const users = new InMemoryUserRepository();
  const user = new UserBuilder()
    .withId(USER_ID)
    .withEmail('actual@example.test')
    .withPasswordHash(`hashed:${CURRENT_PASSWORD}`)
    .build();
  await users.create(user);
  const tokens = new FakeTokenService();
  const outbox = new RecordingOutbox();
  const useCase = new RequestEmailChangeUseCase(
    users,
    new FakePasswordHasher(),
    tokens,
    outbox,
  );
  return { outbox, tokens, useCase, users };
}

describe('RequestEmailChangeUseCase', () => {
  it('rechaza una contrasena actual incorrecta', async () => {
    const { useCase } = await build();

    await expect(
      useCase.execute({
        userId: USER_ID,
        currentPassword: 'wrong',
        newEmail: 'nuevo@example.test',
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('rechaza un correo que ya pertenece a otro usuario', async () => {
    const { useCase, users } = await build();
    await users.create(
      new UserBuilder()
        .withId('66666666-6666-4666-8666-666666666666')
        .withEmail('ocupado@example.test')
        .build(),
    );

    await expect(
      useCase.execute({
        userId: USER_ID,
        currentPassword: CURRENT_PASSWORD,
        newEmail: 'ocupado@example.test',
      }),
    ).rejects.toBeInstanceOf(EmailAlreadyRegisteredError);
  });

  it('firma el correo nuevo y encola la verificacion en el outbox', async () => {
    const { outbox, useCase } = await build();

    await useCase.execute({
      userId: USER_ID,
      currentPassword: CURRENT_PASSWORD,
      newEmail: 'nuevo@example.test',
    });

    expect(outbox.byName('send-email-change-verification')).toMatchObject({
      queue: 'notifications',
      data: {
        userId: USER_ID,
        newEmail: 'nuevo@example.test',
        // El enlace lo arma la API: el worker no debe conocer la base pública.
        verificationUrl: expect.stringMatching(
          /\/verify-email\?token=.+&type=email-change$/,
        ),
      },
    });
  });
});
