import { Body, Controller, HttpCode, HttpStatus, Patch, Post } from '@nestjs/common';
import {
  updatePreferenceSchema,
  type PreferenceResponse,
  type UpdatePreferenceDto,
} from '@urnight/contracts';
import { CurrentUser, type AuthUser } from '../../../../edge/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../../../edge/pipes/zod-validation.pipe';
import { CompleteOnboardingUseCase } from '../../application/use-cases/complete-onboarding.use-case';
import { UpdatePreferencesUseCase } from '../../application/use-cases/update-preferences.use-case';
import type { UserPreference } from '../../domain/entities/user-preference.entity';

/** Preferencias y onboarding del usuario autenticado. /api/v1/me. */
@Controller('me')
export class PreferencesController {
  constructor(
    private readonly updatePreferences: UpdatePreferencesUseCase,
    private readonly completeOnboarding: CompleteOnboardingUseCase,
  ) {}

  @Patch('preferences')
  async update(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(updatePreferenceSchema)) dto: UpdatePreferenceDto,
  ): Promise<PreferenceResponse> {
    return toResponse(await this.updatePreferences.execute({ userId: user.id, patch: dto }));
  }

  @Post('onboarding')
  @HttpCode(HttpStatus.OK)
  async onboarding(@CurrentUser() user: AuthUser): Promise<PreferenceResponse> {
    return toResponse(await this.completeOnboarding.execute({ userId: user.id }));
  }
}

function toResponse(p: UserPreference): PreferenceResponse {
  return {
    onboardingCompleted: p.onboardingCompleted,
    acceptsMarketing: p.acceptsMarketing,
    acceptsReminders: p.acceptsReminders,
    preferredLocale: p.preferredLocale,
  };
}
