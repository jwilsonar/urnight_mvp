import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  grantRoleSchema,
  type GrantRoleDto,
  type RoleAssignmentResponse,
} from '@urnight/contracts';
import { CurrentUser, type AuthUser } from '../../../../edge/decorators/current-user.decorator';
import { Roles } from '../../../../edge/decorators/roles.decorator';
import { ZodValidationPipe } from '../../../../edge/pipes/zod-validation.pipe';
import {
  GrantRoleUseCase,
  type GrantRoleResult,
} from '../../application/use-cases/grant-role.use-case';
import { RevokeRoleUseCase } from '../../application/use-cases/revoke-role.use-case';

/** Gestión RBAC de asignaciones de rol (solo super_admin). /api/v1/users/:userId/roles. */
@Roles('super_admin')
@Controller('users/:userId/roles')
export class RolesController {
  constructor(
    private readonly grantRole: GrantRoleUseCase,
    private readonly revokeRole: RevokeRoleUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async grant(
    @CurrentUser() actor: AuthUser,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body(new ZodValidationPipe(grantRoleSchema)) dto: GrantRoleDto,
  ): Promise<RoleAssignmentResponse> {
    const result = await this.grantRole.execute({
      actorUserId: actor.id,
      targetUserId: userId,
      roleCode: dto.roleCode,
      companyId: dto.companyId ?? null,
      localId: dto.localId ?? null,
    });
    return toResponse(result);
  }

  @Delete(':assignmentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revoke(@Param('assignmentId', ParseUUIDPipe) assignmentId: string): Promise<void> {
    await this.revokeRole.execute({ assignmentId });
  }
}

function toResponse(result: GrantRoleResult): RoleAssignmentResponse {
  const a = result.assignment;
  return {
    id: a.id,
    userId: a.userId,
    roleCode: result.roleCode,
    companyId: a.companyId,
    localId: a.localId,
    isActive: a.isActive,
    grantedAt: a.grantedAt.toISOString(),
  };
}
