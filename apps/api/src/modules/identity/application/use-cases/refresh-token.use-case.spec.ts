import { describe, expect, it } from 'vitest';
import {
  FakeTokenService,
  InMemoryRoleAssignmentRepository,
  InMemoryRoleRepository,
  InMemoryUserRepository,
  RoleMother,
  UserBuilder,
} from '../../../../shared/testing';
import { AccountDisabledError, InvalidTokenError } from '../../domain/errors/identity.errors';
import { TokenIssuer } from '../services/token-issuer.service';
import { RefreshTokenUseCase } from './refresh-token.use-case';

function build() {
  const users = new InMemoryUserRepository();
  const tokens = new FakeTokenService();
  const assignments = new InMemoryRoleAssignmentRepository();
  const roles = new InMemoryRoleRepository().seed(RoleMother.user());
  const issuer = new TokenIssuer(assignments, roles, tokens);
  const useCase = new RefreshTokenUseCase(users, tokens, issuer);
  return { users, tokens, assignments, roles, useCase };
}

describe('RefreshTokenUseCase', () => {
  it('renueva el par de tokens para un usuario activo', async () => {
    const { users, tokens, useCase } = build();
    const user = new UserBuilder().withId('u1').build();
    await users.create(user);
    const refreshToken = (await tokens.signRefresh(user.id)).token;

    const result = await useCase.execute({ refreshToken });

    expect(result.user.id).toBe('u1');
    expect(result.access.token).toBe('access:u1');
    expect(result.refresh.token).toBe('refresh:u1');
  });

  it('refresh válido pero usuario inexistente → InvalidTokenError', async () => {
    const { tokens, useCase } = build();
    const refreshToken = (await tokens.signRefresh('ghost')).token;
    await expect(useCase.execute({ refreshToken })).rejects.toBeInstanceOf(InvalidTokenError);
  });

  it('cuenta deshabilitada → AccountDisabledError', async () => {
    const { users, tokens, useCase } = build();
    const user = new UserBuilder().withId('u3').asInactive().build();
    await users.create(user);
    const refreshToken = (await tokens.signRefresh(user.id)).token;
    await expect(useCase.execute({ refreshToken })).rejects.toBeInstanceOf(AccountDisabledError);
  });

  it('token criptográficamente inválido propaga el fallo de verificación', async () => {
    const { tokens, useCase } = build();
    tokens.failVerify = true;
    await expect(useCase.execute({ refreshToken: 'whatever' })).rejects.toThrow();
  });
});
