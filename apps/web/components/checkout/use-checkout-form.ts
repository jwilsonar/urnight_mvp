"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import type {
  CreateOrderDto,
  EventResponse,
  ResolveRedemptionCodeResponse,
  TicketTypeResponse,
} from "@urnight/contracts";
import { useMe } from "@/lib/api/auth/hooks";
import { checkout, type CheckoutResult } from "@/lib/api/orders";
import {
  handleSessionExpired,
  isSessionExpiredError,
} from "@/lib/auth/session-expiry";
import {
  createCheckoutFormSchema,
  emptyAttendee,
  type CheckoutFormInput,
  type CheckoutFormValues,
} from "./checkout-form";

export interface CheckoutFormOptions {
  event: EventResponse;
  ticketTypes: TicketTypeResponse[];
  presetCode?: string;
  freeOffer?: ResolveRedemptionCodeResponse | null;
}

/**
 * Lógica del checkout (estado, reglas y submit) separada de la vista:
 * `CheckoutClient` queda como orquestador visual. Cubre los dos modos:
 * estándar (selección + asistentes + pago) y entrada GRATIS (código 100%
 * de promotor: la elegibilidad la valida el backend, aquí solo se refleja).
 */
export function useCheckoutForm({
  event,
  ticketTypes,
  presetCode,
  freeOffer,
}: CheckoutFormOptions) {
  const t = useTranslations("checkout");
  const { data: session } = useSession();
  const { data: me } = useMe();
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckoutResult | null>(null);
  const [selfBuyer, setSelfBuyer] = useState(false);
  const formSchema = useMemo(
    () =>
      createCheckoutFormSchema({
        ticketType: t("validation.ticketType"),
        fullName: t("validation.fullName"),
        document: t("validation.document"),
        birthDate: t("validation.birthDate"),
        adult: t("validation.adult"),
      }),
    [t],
  );

  // "Soy yo" solo si la cuenta tiene la identidad completa del registro
  // (las altas con Google no la tienen, así que no hay nada que reutilizar).
  const canBeSelf = Boolean(
    me?.documentType && me?.documentNumber && me?.birthDate,
  );

  const available = useMemo(
    () =>
      ticketTypes.filter((tt) => tt.status === "active" && tt.remaining > 0),
    [ticketTypes],
  );

  const freeTicket = freeOffer?.ticketType
    ? available.find((tt) => tt.id === freeOffer.ticketType!.id)
    : undefined;
  const isFreeFlow = Boolean(
    freeOffer?.valid && freeOffer?.isFree && freeTicket,
  );

  const form = useForm<CheckoutFormInput, unknown, CheckoutFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ticketTypeId: freeTicket?.id ?? available[0]?.id ?? "",
      method: "card",
      promoCode: presetCode ?? "",
      attendees: [emptyAttendee(true)],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "attendees",
  });

  const selectedId = form.watch("ticketTypeId");
  const selected = available.find((tt) => tt.id === selectedId);
  const maxQty = selected
    ? Math.min(selected.remaining, selected.maxPerUser ?? 10)
    : 10;
  const subtotal = selected ? selected.price * fields.length : 0;

  // Rellena el asistente comprador (índice 0) con los datos de la cuenta.
  const applySelf = useCallback(
    (checked: boolean) => {
      setSelfBuyer(checked);
      if (!checked || !me) return;
      form.setValue("attendees.0.fullName", me.fullName, {
        shouldValidate: true,
      });
      if (me.documentType)
        form.setValue("attendees.0.documentType", me.documentType, {
          shouldValidate: true,
        });
      if (me.documentNumber)
        form.setValue("attendees.0.documentNumber", me.documentNumber, {
          shouldValidate: true,
        });
      if (me.birthDate)
        form.setValue("attendees.0.birthDate", me.birthDate, {
          shouldValidate: true,
        });
    },
    [me, form],
  );

  function onSubmit(values: CheckoutFormValues) {
    setFormError(null);
    const token = session?.accessToken;
    if (!token) {
      setFormError(t("sessionExpired"));
      return;
    }
    const dto: CreateOrderDto = {
      eventId: event.id,
      items: [
        { ticketTypeId: values.ticketTypeId, attendees: values.attendees },
      ],
      method: values.method,
      promoCode: values.promoCode?.trim() ? values.promoCode.trim() : undefined,
    };
    startTransition(async () => {
      try {
        setResult(await checkout(dto, token));
      } catch (error) {
        // No pasa por React Query: manejar la sesión expirada aquí mismo.
        if (isSessionExpiredError(error)) {
          handleSessionExpired();
          return;
        }
        setFormError(t("checkoutError"));
      }
    });
  }

  return {
    form,
    fields,
    append,
    remove,
    available,
    freeTicket,
    isFreeFlow,
    selected,
    maxQty,
    subtotal,
    canBeSelf,
    selfBuyer,
    applySelf,
    pending,
    formError,
    result,
    onSubmit,
  };
}
