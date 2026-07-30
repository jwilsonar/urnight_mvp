import { Module } from '@nestjs/common';
import { ConfirmLocalImageUseCase } from './application/use-cases/confirm-local-image.use-case';
import { CreateCompanyUseCase } from './application/use-cases/create-company.use-case';
import { CreateLocalUseCase } from './application/use-cases/create-local.use-case';
import { DeleteLocalImageUseCase } from './application/use-cases/delete-local-image.use-case';
import { GetLocalUseCase } from './application/use-cases/get-local.use-case';
import { GetLocalVerificationUseCase } from './application/use-cases/get-local-verification.use-case';
import { GetMyCompanyUseCase } from './application/use-cases/get-my-company.use-case';
import { ListCompaniesUseCase } from './application/use-cases/list-companies.use-case';
import { ListLocalImagesUseCase } from './application/use-cases/list-local-images.use-case';
import { ListLocalsUseCase } from './application/use-cases/list-locals.use-case';
import { ListMyLocalsUseCase } from './application/use-cases/list-my-locals.use-case';
import { PublishLocalUseCase } from './application/use-cases/publish-local.use-case';
import { ReorderLocalImagesUseCase } from './application/use-cases/reorder-local-images.use-case';
import { RequestVerificationUseCase } from './application/use-cases/request-verification.use-case';
import { ReviewAffiliationUseCase } from './application/use-cases/review-affiliation.use-case';
import { ReviewVerificationUseCase } from './application/use-cases/review-verification.use-case';
import { SetMainLocalImageUseCase } from './application/use-cases/set-main-local-image.use-case';
import { SetCompanyStatusUseCase } from './application/use-cases/set-company-status.use-case';
import { SubmitAffiliationUseCase } from './application/use-cases/submit-affiliation.use-case';
import { SuspendLocalUseCase } from './application/use-cases/suspend-local.use-case';
import { UpdateCompanyUseCase } from './application/use-cases/update-company.use-case';
import { AFFILIATION_REQUEST_REPOSITORY } from './domain/ports/affiliation-request.repository';
import { COMPANY_REPOSITORY } from './domain/ports/company.repository';
import { LOCAL_IMAGE_REPOSITORY } from './domain/ports/local-image.repository';
import { LOCAL_VERIFICATION_REPOSITORY } from './domain/ports/local-verification.repository';
import { LOCAL_REPOSITORY } from './domain/ports/local.repository';
import { DrizzleAffiliationRequestRepository } from './infrastructure/persistence/drizzle-affiliation-request.repository';
import { DrizzleCompanyRepository } from './infrastructure/persistence/drizzle-company.repository';
import { DrizzleLocalImageRepository } from './infrastructure/persistence/drizzle-local-image.repository';
import { DrizzleLocalVerificationRepository } from './infrastructure/persistence/drizzle-local-verification.repository';
import { DrizzleLocalRepository } from './infrastructure/persistence/drizzle-local.repository';
import { AffiliationController } from './interfaces/http/affiliation.controller';
import { CompaniesController } from './interfaces/http/companies.controller';
import { LocalImagesController } from './interfaces/http/local-images.controller';
import { LocalVerificationsController } from './interfaces/http/local-verifications.controller';
import { LocalsController } from './interfaces/http/locals.controller';

/** Bounded context Companies & Locals (multi-tenant §4.1). */
@Module({
  controllers: [
    CompaniesController,
    LocalsController,
    LocalImagesController,
    LocalVerificationsController,
    AffiliationController,
  ],
  providers: [
    CreateCompanyUseCase,
    GetMyCompanyUseCase,
    UpdateCompanyUseCase,
    ListCompaniesUseCase,
    SetCompanyStatusUseCase,
    CreateLocalUseCase,
    GetLocalUseCase,
    GetLocalVerificationUseCase,
    ListLocalsUseCase,
    ListMyLocalsUseCase,
    PublishLocalUseCase,
    SuspendLocalUseCase,
    RequestVerificationUseCase,
    ReviewVerificationUseCase,
    SubmitAffiliationUseCase,
    ReviewAffiliationUseCase,
    ConfirmLocalImageUseCase,
    ListLocalImagesUseCase,
    SetMainLocalImageUseCase,
    ReorderLocalImagesUseCase,
    DeleteLocalImageUseCase,
    { provide: COMPANY_REPOSITORY, useClass: DrizzleCompanyRepository },
    { provide: LOCAL_REPOSITORY, useClass: DrizzleLocalRepository },
    { provide: LOCAL_IMAGE_REPOSITORY, useClass: DrizzleLocalImageRepository },
    {
      provide: LOCAL_VERIFICATION_REPOSITORY,
      useClass: DrizzleLocalVerificationRepository,
    },
    {
      provide: AFFILIATION_REQUEST_REPOSITORY,
      useClass: DrizzleAffiliationRequestRepository,
    },
  ],
})
export class CompaniesModule {}
