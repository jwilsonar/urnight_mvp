import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  legalDocTypeSchema,
  publishLegalDocumentSchema,
  type LegalAcceptanceResponse,
  type LegalDocType,
  type LegalDocumentResponse,
  type PublishLegalDocumentDto,
} from '@urnight/contracts';
import { CurrentUser, type AuthUser } from '../../../../edge/decorators/current-user.decorator';
import { Public } from '../../../../edge/decorators/public.decorator';
import { Roles } from '../../../../edge/decorators/roles.decorator';
import { ZodValidationPipe } from '../../../../edge/pipes/zod-validation.pipe';
import { AcceptLegalDocumentUseCase } from '../../application/use-cases/accept-legal-document.use-case';
import { GetCurrentLegalDocumentUseCase } from '../../application/use-cases/get-current-legal-document.use-case';
import { PublishLegalDocumentUseCase } from '../../application/use-cases/publish-legal-document.use-case';
import type { LegalAcceptance } from '../../domain/entities/legal-acceptance.entity';
import type { LegalDocument } from '../../domain/entities/legal-document.entity';

/** Documentos legales y aceptaciones. /api/v1/legal-documents. */
@Controller('legal-documents')
export class LegalController {
  constructor(
    private readonly publish: PublishLegalDocumentUseCase,
    private readonly getCurrent: GetCurrentLegalDocumentUseCase,
    private readonly accept: AcceptLegalDocumentUseCase,
  ) {}

  @Roles('super_admin')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async publishDocument(
    @Body(new ZodValidationPipe(publishLegalDocumentSchema)) dto: PublishLegalDocumentDto,
  ): Promise<LegalDocumentResponse> {
    return toDocumentResponse(await this.publish.execute(dto));
  }

  @Public()
  @Get('current')
  async current(
    @Query('docType', new ZodValidationPipe(legalDocTypeSchema)) docType: LegalDocType,
  ): Promise<LegalDocumentResponse> {
    return toDocumentResponse(await this.getCurrent.execute({ docType }));
  }

  @Post(':id/accept')
  @HttpCode(HttpStatus.CREATED)
  async acceptDocument(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Ip() ip: string,
  ): Promise<LegalAcceptanceResponse> {
    const acceptance = await this.accept.execute({
      userId: user.id,
      legalDocumentId: id,
      ipAddress: ip,
    });
    return toAcceptanceResponse(acceptance);
  }
}

function toDocumentResponse(d: LegalDocument): LegalDocumentResponse {
  return {
    id: d.id,
    docType: d.docType,
    version: d.version,
    contentUrl: d.contentUrl,
    isCurrent: d.isCurrent,
    publishedAt: d.publishedAt.toISOString(),
  };
}

function toAcceptanceResponse(a: LegalAcceptance): LegalAcceptanceResponse {
  return {
    id: a.id,
    legalDocumentId: a.legalDocumentId,
    versionAccepted: a.versionAccepted,
    acceptedAt: a.acceptedAt.toISOString(),
  };
}
