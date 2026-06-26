import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  assignEventSchema,
  generateRedemptionCodeSchema,
  type AssignEventDto,
  type AssignmentResponse,
  type CreatePromoterDto,
  createPromoterSchema,
  type GenerateRedemptionCodeDto,
  type PromoterAssociationResponse,
  type RedemptionCodeResponse,
  type PromoterResponse,
  type PromoterSalesResponse,
} from '@urnight/contracts';
import { CurrentUser, type AuthUser } from '../../../../edge/decorators/current-user.decorator';
import { Public } from '../../../../edge/decorators/public.decorator';
import { Roles } from '../../../../edge/decorators/roles.decorator';
import { tenantScopeOf } from '../../../../edge/tenant/tenant-scope.helper';
import { ZodValidationPipe } from '../../../../edge/pipes/zod-validation.pipe';
import { AssignEventToPromoterUseCase } from '../../application/use-cases/assign-event-to-promoter.use-case';
import { ConfirmPromoterAssociationUseCase } from '../../application/use-cases/confirm-promoter-association.use-case';
import { CreatePromoterUseCase } from '../../application/use-cases/create-promoter.use-case';
import { GenerateRedemptionCodeUseCase } from '../../application/use-cases/generate-my-code.use-case';
import { GetMyPromoterUseCase } from '../../application/use-cases/get-my-promoter.use-case';
import { ListMyAssignmentsUseCase } from '../../application/use-cases/list-my-assignments.use-case';
import { ListMyRedemptionCodesUseCase } from '../../application/use-cases/list-my-codes.use-case';
import { ListMyPromotersUseCase } from '../../application/use-cases/list-my-promoters.use-case';
import { ListPendingAssociationsUseCase } from '../../application/use-cases/list-pending-associations.use-case';
import { ListPromoterAssignmentsUseCase } from '../../application/use-cases/list-promoter-assignments.use-case';
import { UnassignEventUseCase } from '../../application/use-cases/unassign-event.use-case';
import {
  ListPromoterSalesUseCase,
  type PromoterSales,
} from '../../application/use-cases/list-promoter-sales.use-case';
import { RegisterReferralClickUseCase } from '../../application/use-cases/register-referral-click.use-case';
import { RejectPromoterAssociationUseCase } from '../../application/use-cases/reject-promoter-association.use-case';
import { deriveRedemptionCodeStatus } from '../../application/services/promoter-code-status';
import type { Promoter } from '../../domain/entities/promoter.entity';
import type { ReferralLink } from '../../domain/entities/referral-link.entity';
import type { AssignmentView } from '../../domain/ports/promoter-event.repository';
import type { RedemptionCodeView } from '../../domain/ports/promo-code.repository';
import { shareUrlFor } from './share-url';

/** Promotores y links de referido. /api/v1/promoters. */
@Controller('promoters')
export class PromotersController {
  constructor(
    private readonly createPromoter: CreatePromoterUseCase,
    private readonly listMyPromoters: ListMyPromotersUseCase,
    private readonly listSales: ListPromoterSalesUseCase,
    private readonly registerClick: RegisterReferralClickUseCase,
    private readonly confirmAssociation: ConfirmPromoterAssociationUseCase,
    private readonly rejectAssociation: RejectPromoterAssociationUseCase,
    private readonly listPending: ListPendingAssociationsUseCase,
    private readonly getMyPromoter: GetMyPromoterUseCase,
    private readonly assignEvent: AssignEventToPromoterUseCase,
    private readonly unassignEvent: UnassignEventUseCase,
    private readonly listPromoterAssignments: ListPromoterAssignmentsUseCase,
    private readonly listMyAssignments: ListMyAssignmentsUseCase,
    private readonly generateRedemptionCode: GenerateRedemptionCodeUseCase,
    private readonly listMyRedemptionCodes: ListMyRedemptionCodesUseCase,
  ) {}

  /** Promotores de MI empresa (admin_local). Aislado por tenant. */
  @Roles('admin_local')
  @Get('mine')
  async mine(@CurrentUser() actor: AuthUser): Promise<PromoterResponse[]> {
    return (await this.listMyPromoters.execute(tenantScopeOf(actor))).map((p) =>
      toPromoterResponse(p),
    );
  }

  /** Promotor ACTIVO ligado a mi usuario (o `null` si no soy promotor). */
  @Get('me')
  async me(@CurrentUser() actor: AuthUser): Promise<PromoterResponse | null> {
    const result = await this.getMyPromoter.execute(actor.id);
    if (!result) return null;
    return toPromoterResponse(result.promoter, result.link ?? undefined);
  }

  /** Eventos que me asignaron a promocionar (promotor). */
  @Roles('promoter')
  @Get('me/assignments')
  async myAssignments(@CurrentUser() actor: AuthUser): Promise<AssignmentResponse[]> {
    return (await this.listMyAssignments.execute(actor.id)).map(toAssignmentResponse);
  }

  /** Genera un código single-use para un tipo de entrada de una asignación mía. */
  @Roles('promoter')
  @Post('me/redemption-codes')
  @HttpCode(HttpStatus.CREATED)
  async createRedemptionCode(
    @CurrentUser() actor: AuthUser,
    @Body(new ZodValidationPipe(generateRedemptionCodeSchema)) dto: GenerateRedemptionCodeDto,
  ): Promise<RedemptionCodeResponse> {
    return toRedemptionCodeResponse(await this.generateRedemptionCode.execute({ userId: actor.id, dto }));
  }

  /** Códigos generados de una de mis asignaciones (promotor). */
  @Roles('promoter')
  @Get('me/redemption-codes')
  async myRedemptionCodes(
    @CurrentUser() actor: AuthUser,
    @Query('promoterEventId', ParseUUIDPipe) promoterEventId: string,
  ): Promise<RedemptionCodeResponse[]> {
    return (await this.listMyRedemptionCodes.execute({ userId: actor.id, promoterEventId })).map(
      toRedemptionCodeResponse,
    );
  }

  /** Asigna un evento (descuento + cupo por tipo) a un promotor (admin_local). */
  @Roles('admin_local')
  @Post(':id/assignments')
  @HttpCode(HttpStatus.CREATED)
  async assign(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(assignEventSchema)) dto: AssignEventDto,
  ): Promise<AssignmentResponse> {
    return toAssignmentResponse(
      await this.assignEvent.execute({
        promoterId: id,
        assignedBy: actor.id,
        dto,
        scope: tenantScopeOf(actor),
      }),
    );
  }

  /** Asignaciones de un promotor de mi empresa (admin_local). */
  @Roles('admin_local')
  @Get(':id/assignments')
  async assignments(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AssignmentResponse[]> {
    return (
      await this.listPromoterAssignments.execute({ promoterId: id, scope: tenantScopeOf(actor) })
    ).map(toAssignmentResponse);
  }

  /** Desasigna un evento de un promotor (admin_local). No afecta canjes ya hechos. */
  @Roles('admin_local')
  @Delete(':id/assignments/:promoterEventId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unassign(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('promoterEventId', ParseUUIDPipe) promoterEventId: string,
  ): Promise<void> {
    await this.unassignEvent.execute({
      promoterId: id,
      promoterEventId,
      scope: tenantScopeOf(actor),
    });
  }

  /** Invita a un promotor. El companyId sale del actor (admin_local); queda pending. */
  @Roles('admin_local')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() actor: AuthUser,
    @Body(new ZodValidationPipe(createPromoterSchema)) dto: CreatePromoterDto,
  ): Promise<PromoterResponse> {
    const result = await this.createPromoter.execute({
      ...dto,
      companyId: actor.companyId as string,
    });
    return toPromoterResponse(result.promoter);
  }

  /** Invitaciones pendientes dirigidas al usuario autenticado (por id o correo). */
  @Get('me/associations')
  async myAssociations(@CurrentUser() actor: AuthUser): Promise<PromoterAssociationResponse[]> {
    const pending = await this.listPending.execute({
      actorUserId: actor.id,
      actorEmail: actor.email ?? null,
    });
    return pending.map(toAssociationResponse);
  }

  /** El invitado confirma la asociación → activo + link de referido + rol promoter. */
  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  async confirm(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PromoterResponse> {
    const result = await this.confirmAssociation.execute({
      promoterId: id,
      actorUserId: actor.id,
      actorEmail: actor.email ?? null,
    });
    return toPromoterResponse(result.promoter, result.link);
  }

  /** El invitado rechaza la asociación → promotor inactivo. */
  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  async reject(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PromoterAssociationResponse> {
    const promoter = await this.rejectAssociation.execute({
      promoterId: id,
      actorUserId: actor.id,
      actorEmail: actor.email ?? null,
    });
    return toAssociationResponse(promoter);
  }

  @Roles('promoter')
  @Get(':id/sales')
  async sales(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PromoterSalesResponse> {
    return toSalesResponse(
      await this.listSales.execute({
        promoterId: id,
        actorUserId: actor.id,
        isSuperAdmin: actor.roles.includes('super_admin'),
      }),
    );
  }

  @Public()
  @Post('referrals/:code/click')
  @HttpCode(HttpStatus.NO_CONTENT)
  async click(@Param('code') code: string): Promise<void> {
    await this.registerClick.execute(code);
  }
}

function toPromoterResponse(promoter: Promoter, link?: ReferralLink): PromoterResponse {
  return {
    id: promoter.id,
    companyId: promoter.companyId,
    localId: promoter.localId,
    userId: promoter.userId,
    name: promoter.name,
    status: promoter.status,
    invitedEmail: promoter.invitedEmail,
    referralLink: link
      ? { code: link.code, url: link.url, clicks: link.clicks, isActive: link.isActive }
      : null,
    createdAt: promoter.createdAt.toISOString(),
  };
}

function toAssociationResponse(promoter: Promoter): PromoterAssociationResponse {
  return {
    id: promoter.id,
    name: promoter.name,
    companyId: promoter.companyId,
    localId: promoter.localId,
    status: promoter.status,
    invitedEmail: promoter.invitedEmail,
    createdAt: promoter.createdAt.toISOString(),
  };
}

function toAssignmentResponse(v: AssignmentView): AssignmentResponse {
  return {
    id: v.id,
    promoterId: v.promoterId,
    status: v.status,
    event: {
      id: v.event.id,
      slug: v.event.slug,
      name: v.event.name,
      startsAt: v.event.startsAt.toISOString(),
      flyerUrl: v.event.flyerUrl,
    },
    items: v.items.map((i) => ({
      ticketTypeId: i.ticketTypeId,
      ticketTypeName: i.ticketTypeName,
      price: i.price,
      currency: i.currency,
      discountType: i.discountType,
      discountValue: i.discountValue,
      allocatedStock: i.allocatedStock,
      usedStock: i.usedStock,
      remaining: i.remaining,
    })),
    createdAt: v.createdAt.toISOString(),
  };
}

function toRedemptionCodeResponse(c: RedemptionCodeView): RedemptionCodeResponse {
  return {
    id: c.id,
    code: c.code,
    status: deriveRedemptionCodeStatus(c),
    ticketTypeId: c.ticketTypeId,
    ticketTypeName: c.ticketTypeName,
    discountType: c.discountType,
    discountValue: c.discountValue,
    usageQuota: c.usageQuota,
    usedCount: c.usedCount,
    clicks: c.clicks,
    shareUrl: shareUrlFor(c.code),
    createdAt: c.createdAt.toISOString(),
  };
}

function toSalesResponse(s: PromoterSales): PromoterSalesResponse {
  return {
    promoterId: s.promoterId,
    totalAttributions: s.attributions.length,
    totalCommission: s.totalCommission,
    attributions: s.attributions.map((a) => ({
      orderId: a.orderId,
      commissionAmount: a.commissionAmount,
      status: a.status,
      attributedAt: a.attributedAt.toISOString(),
    })),
  };
}
