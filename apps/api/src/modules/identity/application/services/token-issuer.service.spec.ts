import { describe, expect, it } from 'vitest';
import {
  FakeTokenService,
  InMemoryRoleAssignmentRepository,
  InMemoryRoleRepository,
  RoleAssignmentBuilder,
  RoleMother,
  UserBuilder,
} from '../../../../shared/testing';
import type { AccessTokenClaims } from '../../domain/ports/token.port';
import { InMemoryRefreshTokenStore } from './__testing__/in-memory-refresh-token-store';
import { InMemoryMfaRepository } from './__testing__/in-memory-mfa-repository';
import { RoleResolver } from './role-resolver.service';
import { TokenIssuer } from './token-issuer.service';

function build() {
  const assignments = new InMemoryRoleAssignmentRepository();
  const roles = new InMemoryRoleRepository();
  const tokens = new FakeTokenService();
  const refreshStore = new InMemoryRefreshTokenStore();
  const mfa = new InMemoryMfaRepository();
  const issuer = new TokenIssuer(
    new RoleResolver(assignments, roles),
    tokens,
    refreshStore,
    mfa,
  );
  return { assignments, roles, tokens, refreshStore, mfa, issuer };
}

describe('TokenIssuer', () => {
  it('mapea las asignaciones activas a roleCodes y firma access+refresh', async () => {
    const { assignments, roles, issuer } = build();
    const user = new UserBuilder().withId('u1').build();
    const adminRole = RoleMother.adminLocal();
    const userRole = RoleMother.user();
    roles.seed(adminRole).seed(userRole);
    await assignments.create(
      new RoleAssignmentBuilder().withUserId('u1').withRoleId(userRole.id).build(),
    );
    await assignments.create(
      new RoleAssignmentBuilder()
        .withUserId('u1')
        .withRoleId(adminRole.id)
        .withScope('c1', 'l1')
        .build(),
    );

    const result = await issuer.issueFor(user);

    expect(result.roleCodes).toEqual(expect.arrayContaining(['user', 'admin_local']));
    expect(result.access.token).toBe('access:u1');
    expect(result.refresh.token).toBe('refresh:u1');
  });

  it('propaga al access token el scope de la primera asignación con company/local', async () => {
    const { assignments, roles, tokens, issuer } = build();
    const user = new UserBuilder().withId('u2').build();
    const role = RoleMother.adminLocal();
    roles.seed(role);
    await assignments.create(
      new RoleAssignmentBuilder()
        .withUserId('u2')
        .withRoleId(role.id)
        .withScope('comp-9', 'loc-9')
        .build(),
    );

    const calls: AccessTokenClaims[] = [];
    const original = tokens.signAccess.bind(tokens);
    tokens.signAccess = async (claims: AccessTokenClaims) => {
      calls.push(claims);
      return original(claims);
    };

    await issuer.issueFor(user);

    expect(calls[0]?.companyId).toBe('comp-9');
    expect(calls[0]?.localId).toBe('loc-9');
  });

  it('sin asignaciones activas: roleCodes vacío', async () => {
    const { issuer } = build();
    const user = new UserBuilder().withId('u3').build();

    const result = await issuer.issueFor(user);

    expect(result.roleCodes).toHaveLength(0);
  });

  it('registra el jti del refresh en el store (rotación/revocación, A2)', async () => {
    const { issuer, refreshStore } = build();
    const user = new UserBuilder().withId('u4').build();

    await issuer.issueFor(user);

    expect(refreshStore.countFor('u4')).toBe(1);
  });

  it('marca mfaPending para admin_local sin factor activo', async () => {
    const { assignments, roles, tokens, issuer } = build();
    const user = new UserBuilder().withId('u5').build();
    const role = RoleMother.adminLocal();
    roles.seed(role);
    await assignments.create(
      new RoleAssignmentBuilder().withUserId(user.id).withRoleId(role.id).build(),
    );

    await issuer.issueFor(user);

    expect(tokens.accessClaims.at(-1)?.mfaPending).toBe(true);
  });

  it('no bloquea a promoter sin factor activo', async () => {
    const { assignments, roles, tokens, issuer } = build();
    const user = new UserBuilder().withId('u6').build();
    const role = RoleMother.promoter();
    roles.seed(role);
    await assignments.create(
      new RoleAssignmentBuilder().withUserId(user.id).withRoleId(role.id).build(),
    );

    await issuer.issueFor(user);

    expect(tokens.accessClaims.at(-1)?.mfaPending).toBe(false);
  });
});
