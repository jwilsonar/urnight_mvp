import type { Zone } from '../../../../modules/catalog/domain/entities/zone.entity';
import { ZoneBuilder } from '../../builders/catalog/zone.builder';

/** Casos predefinidos de Zone (y taxonomías hermanas: misma forma). */
export const ZoneMother = {
  valid: (): Zone => new ZoneBuilder().build(),
  centro: (): Zone =>
    new ZoneBuilder().withName('Centro').withSlug('centro').withDisplayOrder(0).build(),
  miraflores: (): Zone =>
    new ZoneBuilder().withName('Miraflores').withSlug('miraflores').withDisplayOrder(1).build(),
  barranco: (): Zone =>
    new ZoneBuilder().withName('Barranco').withSlug('barranco').withDisplayOrder(2).build(),
  inactive: (): Zone => new ZoneBuilder().withName('Antigua').withSlug('antigua').asInactive().build(),
};
