import type { CreateOrderDto } from '@urnight/contracts';

export type DraftStatus = 'draft' | 'sent';

/**
 * Borrador de compra persistido (SD-05 fase 2). Guarda el DTO junto a la clave
 * de idempotencia: sin el DTO no se puede saber si la clave sigue siendo válida.
 */
export interface CheckoutDraft {
  eventId: string;
  idempotencyKey: string;
  dto: CreateOrderDto;
  status: DraftStatus;
  createdAt: string;
}

/**
 * Igualdad de forma del pedido. Ignora `holdId`: el hold se rota al cambiar de
 * pantalla o al expirar, y eso no convierte la compra en otra distinta.
 */
export function sameOrderShape(a: CreateOrderDto, b: CreateOrderDto): boolean {
  const shape = (dto: CreateOrderDto) =>
    JSON.stringify({
      eventId: dto.eventId,
      method: dto.method,
      promoCode: dto.promoCode ?? null,
      referralCode: dto.referralCode ?? null,
      items: dto.items.map((item) => ({
        ticketTypeId: item.ticketTypeId,
        attendees: item.attendees.map((at) => ({
          fullName: at.fullName,
          documentType: at.documentType,
          documentNumber: at.documentNumber,
          birthDate: at.birthDate,
        })),
      })),
    });
  return shape(a) === shape(b);
}

/**
 * Qué clave de idempotencia mandar.
 *
 * Reutilizar la del borrador es lo que impide cobrar dos veces cuando el primer
 * envío llegó al servidor pero la respuesta se perdió. Y estrenarla cuando el
 * pedido cambió es lo que impide que el backend reproduzca una orden vieja en
 * lugar de crear la nueva.
 */
export function keyForSubmission(
  existing: CheckoutDraft | null,
  dto: CreateOrderDto,
  freshKey: string,
): string {
  if (existing && sameOrderShape(existing.dto, dto)) return existing.idempotencyKey;
  return freshKey;
}
