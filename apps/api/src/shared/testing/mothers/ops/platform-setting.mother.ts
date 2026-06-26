import type { PlatformSetting } from '../../../../modules/ops/domain/entities/platform-setting.entity';
import { PlatformSettingBuilder } from '../../builders/ops/platform-setting.builder';

/** Casos predefinidos de PlatformSetting (uno por valueType del MVP §4.1). */
export const PlatformSettingMother = {
  valid: (): PlatformSetting => new PlatformSettingBuilder().build(),
  stringSetting: (): PlatformSetting =>
    new PlatformSettingBuilder()
      .withKey('branding.support_email')
      .withTypedValue('soporte@urnight.com', 'string')
      .build(),
  numberSetting: (): PlatformSetting =>
    new PlatformSettingBuilder()
      .withKey('checkout.max_tickets')
      .withTypedValue('10', 'number')
      .build(),
  booleanSetting: (): PlatformSetting =>
    new PlatformSettingBuilder()
      .withKey('feature.checkout_enabled')
      .withTypedValue('true', 'boolean')
      .build(),
  jsonSetting: (): PlatformSetting =>
    new PlatformSettingBuilder()
      .withKey('payments.gateways')
      .withTypedValue('{"culqi":true,"mp":false}', 'json')
      .build(),
};
