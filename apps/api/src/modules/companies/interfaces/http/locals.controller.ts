import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  createLocalSchema,
  localListQuerySchema,
  requestVerificationSchema,
  suspendLocalSchema,
  type CreateLocalDto,
  type LocalListQuery,
  type LocalResponse,
  type RequestVerificationDto,
  type SuspendLocalDto,
  type VerificationResponse,
} from '@urnight/contracts';
import { CurrentUser, type AuthUser } from '../../../../edge/decorators/current-user.decorator';
import { Public } from '../../../../edge/decorators/public.decorator';
import { Roles } from '../../../../edge/decorators/roles.decorator';
import { tenantScopeOf } from '../../../../edge/tenant/tenant-scope.helper';
import { ZodValidationPipe } from '../../../../edge/pipes/zod-validation.pipe';
import { STORAGE_PORT, type StoragePort } from '../../../../shared/adapters/storage/storage.port';
import { CreateLocalUseCase } from '../../application/use-cases/create-local.use-case';
import { GetLocalUseCase } from '../../application/use-cases/get-local.use-case';
import { GetLocalVerificationUseCase } from '../../application/use-cases/get-local-verification.use-case';
import { ListLocalsUseCase } from '../../application/use-cases/list-locals.use-case';
import { ListMyLocalsUseCase } from '../../application/use-cases/list-my-locals.use-case';
import { PublishLocalUseCase } from '../../application/use-cases/publish-local.use-case';
import { RequestVerificationUseCase } from '../../application/use-cases/request-verification.use-case';
import { SuspendLocalUseCase } from '../../application/use-cases/suspend-local.use-case';
import type { LocalVerification } from '../../domain/entities/local-verification.entity';
import type { Local } from '../../domain/entities/local.entity';

/** Locales (LOCAL). /api/v1/locals. Lectura pública; escritura admin_local/super_admin. */
@Controller('locals')
export class LocalsController {
  constructor(
    private readonly listLocals: ListLocalsUseCase,
    private readonly listMyLocals: ListMyLocalsUseCase,
    private readonly getLocal: GetLocalUseCase,
    private readonly getLocalVerification: GetLocalVerificationUseCase,
    private readonly createLocal: CreateLocalUseCase,
    private readonly publishLocal: PublishLocalUseCase,
    private readonly suspendLocal: SuspendLocalUseCase,
    private readonly requestVerification: RequestVerificationUseCase,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
  ) {}

  /** Mapper ligado al storage del entorno (resuelve la ref de portada a URL). */
  private readonly toResponse = (l: Local): LocalResponse => toLocalResponse(l, this.storage);

  @Public()
  @Get()
  async list(
    @Query(new ZodValidationPipe(localListQuerySchema)) query: LocalListQuery,
  ): Promise<LocalResponse[]> {
    return (await this.listLocals.execute(query)).map(this.toResponse);
  }

  /** Locales de MI empresa (todos los estados). Aislado por tenant. */
  @Roles('admin_local')
  @Get('mine')
  async mine(@CurrentUser() actor: AuthUser): Promise<LocalResponse[]> {
    return (await this.listMyLocals.execute(tenantScopeOf(actor))).map(this.toResponse);
  }

  @Public()
  @Get(':slug')
  async detail(@Param('slug') slug: string): Promise<LocalResponse> {
    const local = await this.getLocal.execute(slug);
    const verification = await this.getLocalVerification.execute(local.id);
    return toLocalResponse(local, this.storage, verification);
  }

  @Roles('admin_local')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() actor: AuthUser,
    @Body(new ZodValidationPipe(createLocalSchema)) dto: CreateLocalDto,
  ): Promise<LocalResponse> {
    const local = await this.createLocal.execute({
      ...dto,
      isSuperAdmin: actor.roles.includes('super_admin'),
      actorCompanyId: actor.companyId ?? null,
    });
    return this.toResponse(local);
  }

  @Roles('admin_local')
  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  async publish(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<LocalResponse> {
    const local = await this.publishLocal.execute({
      localId: id,
      isSuperAdmin: actor.roles.includes('super_admin'),
      actorCompanyId: actor.companyId ?? null,
    });
    return this.toResponse(local);
  }

  @Roles('admin_local')
  @Post(':id/suspend')
  @HttpCode(HttpStatus.OK)
  async suspend(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(suspendLocalSchema)) dto: SuspendLocalDto,
  ): Promise<LocalResponse> {
    const scope = tenantScopeOf(actor);
    return this.toResponse(
      await this.suspendLocal.execute({
        localId: id,
        reason: dto.reason,
        isSuperAdmin: scope.isSuperAdmin,
        actorCompanyId: scope.companyId,
      }),
    );
  }

  @Roles('admin_local')
  @Post(':id/verifications')
  @HttpCode(HttpStatus.CREATED)
  async verify(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(requestVerificationSchema))
    dto: RequestVerificationDto,
  ): Promise<VerificationResponse> {
    const scope = tenantScopeOf(actor);
    return toVerificationResponse(
      await this.requestVerification.execute({
        localId: id,
        dto,
        isSuperAdmin: scope.isSuperAdmin,
        actorCompanyId: scope.companyId,
      }),
    );
  }
}

export function toLocalResponse(
  l: Local,
  storage: Pick<StoragePort, 'resolveUrl'>,
  verification?: LocalVerification | null,
): LocalResponse {
  return {
    id: l.id,
    companyId: l.companyId,
    zoneId: l.zoneId,
    name: l.name,
    slug: l.slug,
    description: l.description,
    address: l.address,
    latitude: l.latitude,
    longitude: l.longitude,
    // La portada se persiste como key/ref; se resuelve a URL pública aquí.
    mainImageUrl: l.mainImageKey ? storage.resolveUrl(l.mainImageKey) : null,
    status: l.status,
    isVerified: l.isVerified,
    verificationStatus: verification?.status ?? (l.isVerified ? 'approved' : 'unverified'),
    verificationReviewedAt: verification?.reviewedAt?.toISOString() ?? null,
    createdAt: l.createdAt.toISOString(),
  };
}

export function toVerificationResponse(v: LocalVerification): VerificationResponse {
  return {
    id: v.id,
    localId: v.localId,
    status: v.status,
    licenseReference: v.licenseReference,
    validUntil: v.validUntil,
    reviewedAt: v.reviewedAt?.toISOString() ?? null,
    createdAt: v.createdAt.toISOString(),
  };
}
