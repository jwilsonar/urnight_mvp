import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Crypto from 'expo-crypto';
import {
  attendeeInputSchema,
  createOrderSchema,
  type AttendeeInput,
  type CreateOrderDto,
  type EventResponse,
  type TicketHoldResponse,
  type TicketTypeResponse,
} from '@urnight/contracts';
import {
  checkoutRequest,
  createTicketHold,
  releaseTicketHold,
  type CheckoutResult,
} from './api-client';
import { checkoutMessageOf, isRetryable } from './checkout-errors';
import { clearDraft, readDraft, saveDraft } from './checkout-draft';
import { keyForSubmission } from './checkout-draft-rules';
import { createLogger } from './logger';
import { upsertTickets } from './tickets-cache';

const log = createLogger('checkout');

/** Reintentos de red antes de dejarlo en manos del usuario (SD-05 fase 3). */
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = [1000, 3000, 7000];

export interface AttendeeDraft {
  fullName: string;
  documentType: AttendeeInput['documentType'];
  documentNumber: string;
  birthDate: string;
}

export function emptyAttendee(): AttendeeDraft {
  return { fullName: '', documentType: 'dni', documentNumber: '', birthDate: '' };
}

export interface CheckoutOptions {
  event: EventResponse;
  ticketTypes: TicketTypeResponse[];
  /** Código de promotor precargado por el enlace profundo (SD-04 fase 3). */
  presetCode?: string;
}

export function useCheckout({ event, ticketTypes, presetCode }: CheckoutOptions) {
  const available = useMemo(
    () => ticketTypes.filter((tt) => tt.status === 'active' && tt.remaining > 0),
    [ticketTypes],
  );

  const [ticketTypeId, setTicketTypeId] = useState<string>(available[0]?.id ?? '');
  const [attendees, setAttendees] = useState<AttendeeDraft[]>([emptyAttendee()]);
  const [method, setMethod] = useState<CreateOrderDto['method']>('card');
  const [promoCode, setPromoCode] = useState(presetCode ?? '');
  const [hold, setHold] = useState<TicketHoldResponse | null>(null);
  const [holdPending, setHoldPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [result, setResult] = useState<CheckoutResult | null>(null);

  const holdRef = useRef<TicketHoldResponse | null>(null);
  const holdVersion = useRef(0);
  const holdChain = useRef<Promise<void>>(Promise.resolve());

  const selected = available.find((tt) => tt.id === ticketTypeId);
  const maxQty = selected ? Math.min(selected.remaining, selected.maxPerUser ?? 10) : 10;
  const subtotal = selected ? selected.price * attendees.length : 0;

  // Reserva de cupo: se crea al entrar y se reemplaza al cambiar tramo o cantidad.
  // Las llamadas se serializan con contador de versión porque dos cambios rápidos
  // dejarían holds huérfanos ocupando stock hasta su TTL.
  useEffect(() => {
    if (!ticketTypeId || attendees.length < 1 || result) return;
    const version = ++holdVersion.current;
    setHoldPending(true);
    holdChain.current = holdChain.current
      .then(async () => {
        if (version !== holdVersion.current) return;
        const created = await createTicketHold({
          eventId: event.id,
          ticketTypeId,
          quantity: attendees.length,
          replaceHoldId: holdRef.current?.id,
        });
        holdRef.current = created;
        if (version === holdVersion.current) {
          setHold(created);
          setFormError(null);
        }
      })
      .catch((err: unknown) => {
        if (version === holdVersion.current) {
          setHold(null);
          setFormError(checkoutMessageOf(err));
        }
      })
      .finally(() => {
        if (version === holdVersion.current) setHoldPending(false);
      });
  }, [event.id, ticketTypeId, attendees.length, result]);

  // Al salir se libera el cupo. Si falla, el TTL del backend lo recoge igual.
  useEffect(
    () => () => {
      const current = holdRef.current;
      if (current?.status === 'active') {
        void releaseTicketHold(current.id).catch(() => undefined);
      }
    },
    [],
  );

  const addAttendee = useCallback(() => {
    setAttendees((prev) => (prev.length < maxQty ? [...prev, emptyAttendee()] : prev));
  }, [maxQty]);

  const removeAttendee = useCallback((index: number) => {
    setAttendees((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }, []);

  const updateAttendee = useCallback((index: number, patch: Partial<AttendeeDraft>) => {
    setAttendees((prev) => prev.map((a, i) => (i === index ? { ...a, ...patch } : a)));
  }, []);

  /** DTO validado con el esquema compartido, o los errores por campo. */
  const buildDto = useCallback((): CreateOrderDto | null => {
    const errors: Record<string, string> = {};
    attendees.forEach((attendee, index) => {
      const parsed = attendeeInputSchema.safeParse({ ...attendee, isBuyer: index === 0 });
      if (!parsed.success) {
        const flat = parsed.error.flatten().fieldErrors;
        if (flat.fullName) errors[`${index}.fullName`] = 'Ingresa el nombre completo.';
        if (flat.documentType) errors[`${index}.documentType`] = 'Elige un tipo de documento.';
        if (flat.documentNumber) errors[`${index}.documentNumber`] = 'Documento inválido.';
        if (flat.birthDate) {
          errors[`${index}.birthDate`] = 'Debe ser mayor de 18 años (AAAA-MM-DD).';
        }
      }
    });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return null;
    }
    setFieldErrors({});

    if (!hold || hold.ticketTypeId !== ticketTypeId || hold.quantity !== attendees.length) {
      setFormError('Tu reserva de cupo no está lista. Espera un momento e inténtalo de nuevo.');
      return null;
    }

    const candidate = {
      eventId: event.id,
      items: [
        {
          ticketTypeId,
          holdId: hold.id,
          attendees: attendees.map((a, index) => ({ ...a, isBuyer: index === 0 })),
        },
      ],
      method,
      promoCode: promoCode.trim() ? promoCode.trim() : undefined,
    };
    const parsed = createOrderSchema.safeParse(candidate);
    if (!parsed.success) {
      setFormError('Revisa los datos del pedido.');
      return null;
    }
    return parsed.data;
  }, [attendees, event.id, hold, method, promoCode, ticketTypeId]);

  /**
   * Envío con reintento seguro (SD-05 fase 3). La clave se persiste ANTES de
   * mandar nada: si el sistema mata la app entre el POST y la respuesta, el
   * borrador permite reenviar con la MISMA clave y el backend reproduce la orden
   * en vez de duplicarla. Solo se reintenta el fallo de red.
   */
  const submit = useCallback(async () => {
    setFormError(null);
    const dto = buildDto();
    if (!dto) return;

    const existing = await readDraft(event.id);
    const key = keyForSubmission(existing, dto, Crypto.randomUUID());
    const createdAt = existing?.createdAt ?? new Date().toISOString();
    await saveDraft({
      eventId: event.id,
      idempotencyKey: key,
      dto,
      status: 'sent',
      createdAt,
    });

    setPending(true);
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      try {
        const res = await checkoutRequest(dto, key);
        // Las entradas quedan en la copia local antes de salir de aquí: quien
        // compra camino a la puerta ya tiene el QR sin red (SD-06).
        await upsertTickets(res.tickets);
        await clearDraft(event.id);
        holdRef.current = null;
        setResult(res);
        setRetrying(false);
        setPending(false);
        log.info({ orderId: res.order.id }, 'mobile.checkout.confirmed');
        return;
      } catch (err) {
        if (!isRetryable(err) || attempt === MAX_RETRIES) {
          setFormError(checkoutMessageOf(err));
          setRetrying(false);
          setPending(false);
          log.warn({ attempt, retryable: isRetryable(err) }, 'mobile.checkout.failed');
          return;
        }
        setRetrying(true);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS[attempt] ?? 7000));
      }
    }
  }, [buildDto, event.id]);

  return {
    available,
    selected,
    ticketTypeId,
    setTicketTypeId,
    attendees,
    addAttendee,
    removeAttendee,
    updateAttendee,
    method,
    setMethod,
    promoCode,
    setPromoCode,
    maxQty,
    subtotal,
    hold,
    holdPending,
    formError,
    fieldErrors,
    pending,
    retrying,
    result,
    submit,
  };
}
