import type { SupportTicket } from '../../../../modules/ops/domain/entities/support-ticket.entity';
import { SupportTicketBuilder } from '../../builders/ops/support-ticket.builder';

/** Casos predefinidos de SupportTicket (workflow de estados §4.1). */
export const SupportTicketMother = {
  valid: (): SupportTicket => new SupportTicketBuilder().build(),
  open: (): SupportTicket => new SupportTicketBuilder().withStatus('open').build(),
  inProgress: (): SupportTicket => new SupportTicketBuilder().withStatus('in_progress').build(),
  resolved: (): SupportTicket => new SupportTicketBuilder().withStatus('resolved').build(),
  closed: (): SupportTicket => new SupportTicketBuilder().withStatus('closed').build(),
  bug: (): SupportTicket =>
    new SupportTicketBuilder()
      .withCategory('bug')
      .withPriority('high')
      .withSubject('Crash al abrir el mapa')
      .build(),
};
