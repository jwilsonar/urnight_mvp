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
} from '@nestjs/common';
import {
  confirmLocalVerificationDocumentSchema,
  reviewLocalVerificationDocumentSchema,
  type ConfirmLocalVerificationDocumentDto,
  type LocalVerificationDocumentResponse,
  type ReviewLocalVerificationDocumentDto,
  type VerificationPolicyResponse,
} from '@urnight/contracts';
import {
  CurrentUser,
  type AuthUser,
} from '../../../../edge/decorators/current-user.decorator';
import { Roles } from '../../../../edge/decorators/roles.decorator';
import { tenantScopeOf } from '../../../../edge/tenant/tenant-scope.helper';
import { ZodValidationPipe } from '../../../../edge/pipes/zod-validation.pipe';
import {
  STORAGE_PORT,
  type StoragePort,
} from '../../../../shared/adapters/storage/storage.port';
import { ConfirmLocalVerificationDocumentUseCase } from '../../application/use-cases/confirm-local-verification-document.use-case';
import { GetVerificationPolicyUseCase } from '../../application/use-cases/get-verification-policy.use-case';
import { ListLocalVerificationDocumentsUseCase } from '../../application/use-cases/list-local-verification-documents.use-case';
import { ListPendingVerificationDocumentsUseCase } from '../../application/use-cases/list-pending-verification-documents.use-case';
import { ReviewLocalVerificationDocumentUseCase } from '../../application/use-cases/review-local-verification-document.use-case';
import type { LocalVerificationDocumentContext } from '../../domain/ports/local-verification-document.repository';

@Roles('admin_local')
@Controller('locals')
export class LocalVerificationDocumentsController {
  constructor(
    private readonly listDocuments: ListLocalVerificationDocumentsUseCase,
    private readonly confirmDocument: ConfirmLocalVerificationDocumentUseCase,
    private readonly getPolicy: GetVerificationPolicyUseCase,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
  ) {}

  @Get(':id/verification-documents')
  async list(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) localId: string,
  ): Promise<LocalVerificationDocumentResponse[]> {
    const [documents, policy] = await Promise.all([
      this.listDocuments.execute(localId, tenantScopeOf(actor)),
      this.getPolicy.execute(),
    ]);
    return Promise.all(
      documents.map((document) =>
        toDocumentResponse(document, this.storage, policy.expiryWarningDays),
      ),
    );
  }

  @Post(':id/verification-documents')
  @HttpCode(HttpStatus.CREATED)
  async confirm(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) localId: string,
    @Body(new ZodValidationPipe(confirmLocalVerificationDocumentSchema))
    dto: ConfirmLocalVerificationDocumentDto,
  ): Promise<LocalVerificationDocumentResponse> {
    const [document, policy] = await Promise.all([
      this.confirmDocument.execute({
        localId,
        scope: tenantScopeOf(actor),
        dto,
      }),
      this.getPolicy.execute(),
    ]);
    return toDocumentResponse(
      document,
      this.storage,
      policy.expiryWarningDays,
    );
  }
}

@Roles('super_admin')
@Controller('local-verification-documents')
export class LocalVerificationDocumentReviewsController {
  constructor(
    private readonly listPending: ListPendingVerificationDocumentsUseCase,
    private readonly reviewDocument: ReviewLocalVerificationDocumentUseCase,
    private readonly getPolicy: GetVerificationPolicyUseCase,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
  ) {}

  @Get('pending')
  async pending(): Promise<LocalVerificationDocumentResponse[]> {
    const [documents, policy] = await Promise.all([
      this.listPending.execute(),
      this.getPolicy.execute(),
    ]);
    return Promise.all(
      documents.map((document) =>
        toDocumentResponse(document, this.storage, policy.expiryWarningDays),
      ),
    );
  }

  @Get('policy')
  async policy(): Promise<VerificationPolicyResponse> {
    return this.getPolicy.execute();
  }

  @Post(':id/review')
  @HttpCode(HttpStatus.OK)
  async review(
    @CurrentUser() reviewer: AuthUser,
    @Param('id', ParseUUIDPipe) documentId: string,
    @Body(new ZodValidationPipe(reviewLocalVerificationDocumentSchema))
    dto: ReviewLocalVerificationDocumentDto,
  ): Promise<LocalVerificationDocumentResponse> {
    const [document, policy] = await Promise.all([
      this.reviewDocument.execute({
        documentId,
        reviewerId: reviewer.id,
        dto,
      }),
      this.getPolicy.execute(),
    ]);
    return toDocumentResponse(
      document,
      this.storage,
      policy.expiryWarningDays,
    );
  }
}

async function toDocumentResponse(
  context: LocalVerificationDocumentContext,
  storage: Pick<StoragePort, 'getDownloadUrl'>,
  expiryWarningDays: number,
): Promise<LocalVerificationDocumentResponse> {
  const document = context.document;
  return {
    id: document.id,
    verificationId: document.verificationId,
    localId: context.localId,
    localName: context.localName,
    companyId: context.companyId,
    documentType: document.documentType,
    issuedAt: document.issuedAt,
    expiresAt: document.expiresAt,
    reviewStatus: document.reviewStatus,
    lifecycleStatus: document.lifecycleStatus(new Date(), expiryWarningDays),
    reviewNotes: document.reviewNotes,
    reviewedAt: document.reviewedAt?.toISOString() ?? null,
    downloadUrl: await storage.getDownloadUrl(document.storageKey),
    createdAt: document.createdAt.toISOString(),
  };
}
