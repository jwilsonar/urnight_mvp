import { Module } from '@nestjs/common';
import { ApplyPromoterUseCase } from './application/use-cases/apply-promoter.use-case';
import { AssignEventToPromoterUseCase } from './application/use-cases/assign-event-to-promoter.use-case';
import { AttributeSaleUseCase } from './application/use-cases/attribute-sale.use-case';
import { ConfirmPromoterAssociationUseCase } from './application/use-cases/confirm-promoter-association.use-case';
import { CreatePromoCodeUseCase } from './application/use-cases/create-promo-code.use-case';
import { CreatePromoterUseCase } from './application/use-cases/create-promoter.use-case';
import { GenerateRedemptionCodeUseCase } from './application/use-cases/generate-my-code.use-case';
import { GetMyPromoterUseCase } from './application/use-cases/get-my-promoter.use-case';
import { ListMyAssignmentsUseCase } from './application/use-cases/list-my-assignments.use-case';
import { ListMyRedemptionCodesUseCase } from './application/use-cases/list-my-codes.use-case';
import { ListMyPromotersUseCase } from './application/use-cases/list-my-promoters.use-case';
import { ListPendingAssociationsUseCase } from './application/use-cases/list-pending-associations.use-case';
import { ListPromoterAssignmentsUseCase } from './application/use-cases/list-promoter-assignments.use-case';
import { ListPromoterSalesUseCase } from './application/use-cases/list-promoter-sales.use-case';
import { RegisterRedemptionClickUseCase } from './application/use-cases/register-promo-click.use-case';
import { RegisterReferralClickUseCase } from './application/use-cases/register-referral-click.use-case';
import { RejectPromoterAssociationUseCase } from './application/use-cases/reject-promoter-association.use-case';
import { ResolveRedemptionCodeUseCase } from './application/use-cases/resolve-promo-code.use-case';
import { ReviewPromoterApplicationUseCase } from './application/use-cases/review-promoter-application.use-case';
import { UnassignEventUseCase } from './application/use-cases/unassign-event.use-case';
import { ValidatePromoCodeUseCase } from './application/use-cases/validate-promo-code.use-case';
import { ListMyRedemptionsUseCase } from './application/use-cases/list-my-redemptions.use-case';
import { ListPromoCodeRedemptionsUseCase } from './application/use-cases/list-promo-code-redemptions.use-case';
import { PromoRedemptionService } from './application/services/promo-redemption.service';
import { OrderPaidSubscriber } from './application/subscribers/order-paid.subscriber';
import { PromoRedemptionPort } from '../../shared/ports/promo-redemption.port';
import { PROMO_CODE_REPOSITORY } from './domain/ports/promo-code.repository';
import { PROMOTER_APPLICATION_REPOSITORY } from './domain/ports/promoter-application.repository';
import { PROMOTER_EVENT_REPOSITORY } from './domain/ports/promoter-event.repository';
import { PROMOTER_REPOSITORY } from './domain/ports/promoter.repository';
import { REFERRAL_LINK_REPOSITORY } from './domain/ports/referral-link.repository';
import { SALE_ATTRIBUTION_REPOSITORY } from './domain/ports/sale-attribution.repository';
import { DrizzlePromoCodeRepository } from './infrastructure/persistence/drizzle-promo-code.repository';
import { DrizzlePromoterApplicationRepository } from './infrastructure/persistence/drizzle-promoter-application.repository';
import { DrizzlePromoterEventRepository } from './infrastructure/persistence/drizzle-promoter-event.repository';
import { DrizzlePromoterRepository } from './infrastructure/persistence/drizzle-promoter.repository';
import { DrizzleReferralLinkRepository } from './infrastructure/persistence/drizzle-referral-link.repository';
import { DrizzleSaleAttributionRepository } from './infrastructure/persistence/drizzle-sale-attribution.repository';
import { PromoCodesController } from './interfaces/http/promo-codes.controller';
import { PromoterApplicationsController } from './interfaces/http/promoter-applications.controller';
import { PromotersController } from './interfaces/http/promoters.controller';
import { RedemptionCodesController } from './interfaces/http/redemption-codes.controller';
import { RedemptionsController } from './interfaces/http/redemptions.controller';

/** Bounded context Promoters & Promo Codes (§4.1). Atribución vía OrderPaid. */
@Module({
  controllers: [
    PromotersController,
    PromoterApplicationsController,
    PromoCodesController,
    RedemptionCodesController,
    RedemptionsController,
  ],
  providers: [
    CreatePromoterUseCase,
    ListMyPromotersUseCase,
    ConfirmPromoterAssociationUseCase,
    RejectPromoterAssociationUseCase,
    ListPendingAssociationsUseCase,
    ApplyPromoterUseCase,
    ReviewPromoterApplicationUseCase,
    CreatePromoCodeUseCase,
    ValidatePromoCodeUseCase,
    ListMyRedemptionsUseCase,
    ListPromoCodeRedemptionsUseCase,
    ListPromoterSalesUseCase,
    RegisterReferralClickUseCase,
    AttributeSaleUseCase,
    GetMyPromoterUseCase,
    AssignEventToPromoterUseCase,
    UnassignEventUseCase,
    ListPromoterAssignmentsUseCase,
    ListMyAssignmentsUseCase,
    GenerateRedemptionCodeUseCase,
    ListMyRedemptionCodesUseCase,
    ResolveRedemptionCodeUseCase,
    RegisterRedemptionClickUseCase,
    OrderPaidSubscriber,
    { provide: PromoRedemptionPort, useClass: PromoRedemptionService },
    { provide: PROMOTER_REPOSITORY, useClass: DrizzlePromoterRepository },
    { provide: PROMOTER_EVENT_REPOSITORY, useClass: DrizzlePromoterEventRepository },
    { provide: REFERRAL_LINK_REPOSITORY, useClass: DrizzleReferralLinkRepository },
    { provide: PROMO_CODE_REPOSITORY, useClass: DrizzlePromoCodeRepository },
    { provide: SALE_ATTRIBUTION_REPOSITORY, useClass: DrizzleSaleAttributionRepository },
    { provide: PROMOTER_APPLICATION_REPOSITORY, useClass: DrizzlePromoterApplicationRepository },
  ],
  exports: [PromoRedemptionPort],
})
export class PromotersModule {}
