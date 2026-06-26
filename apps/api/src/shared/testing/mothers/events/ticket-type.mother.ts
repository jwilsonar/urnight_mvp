import type { TicketType } from '../../../../modules/events/domain/entities/ticket-type.entity';
import { TicketTypeBuilder } from '../../builders/events/ticket-type.builder';

/** Casos predefinidos de TicketType. */
export const TicketTypeMother = {
  general: (): TicketType => new TicketTypeBuilder().withTierCode('general').withName('General').build(),
  vip: (): TicketType =>
    new TicketTypeBuilder().withTierCode('vip').withName('VIP').withPrice(150).build(),
  premium: (): TicketType =>
    new TicketTypeBuilder().withTierCode('premium').withName('Premium').withPrice(250).build(),
  soldOut: (): TicketType =>
    new TicketTypeBuilder().withStock(10).withSold(10).asSoldOut().build(),
  paused: (): TicketType => new TicketTypeBuilder().asPaused().build(),
};
