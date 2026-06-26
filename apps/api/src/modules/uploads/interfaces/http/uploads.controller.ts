import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  presignRequestSchema,
  type PresignRequestDto,
  type PresignResponseDto,
} from '@urnight/contracts';
import { ZodValidationPipe } from '../../../../edge/pipes/zod-validation.pipe';
import { PresignUploadUseCase } from '../../application/presign-upload.use-case';

/**
 * Firma de subidas. /api/v1/uploads. Requiere autenticación (cualquier rol):
 * la URL apunta a staging tmp/, sin tenant. El gate real es el confirm.
 */
@Controller('uploads')
export class UploadsController {
  constructor(private readonly presignUpload: PresignUploadUseCase) {}

  @Post('presign')
  @HttpCode(HttpStatus.OK)
  async presign(
    @Body(new ZodValidationPipe(presignRequestSchema)) dto: PresignRequestDto,
  ): Promise<PresignResponseDto> {
    return this.presignUpload.execute(dto);
  }
}
