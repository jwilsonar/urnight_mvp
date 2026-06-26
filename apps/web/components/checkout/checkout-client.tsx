'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Gift, Minus, Plus } from '@phosphor-icons/react';
import { useSession } from 'next-auth/react';
import { useCallback, useMemo, useState, useTransition } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import type {
  CreateOrderDto,
  EventResponse,
  ResolveRedemptionCodeResponse,
  TicketTypeResponse,
} from '@urnight/contracts';
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from '@urnight/ui';
import { useMe } from '@/lib/api/auth/hooks';
import { getErrorMessage } from '@/lib/api/error-messages';
import { checkout, type CheckoutResult } from '@/lib/api/orders';
import { SESSION_EXPIRED } from '@/lib/constants';
import { StorageImage } from '@/lib/storage/storage-context';
import { formatDate, formatPEN } from '@/lib/utils';
import { AttendeeFieldset } from './attendee-fieldset';
import {
  checkoutFormSchema,
  emptyAttendee,
  PAYMENT_METHODS,
  type CheckoutFormInput,
  type CheckoutFormValues,
} from './checkout-form';
import { CheckoutSuccess } from './checkout-success';

/**
 * Orquesta el checkout. Soporta dos modos:
 * - Estándar: selección de entrada, asistentes y pago (código opcional).
 * - Entrada GRATIS: cuando llega con un código de promotor 100% (`freeOffer`),
 *   muestra la oferta del promotor + card del evento, fija el tipo de entrada y
 *   cambia el botón a "Recibir" (emite la entrada con total 0).
 */
export function CheckoutClient({
  event,
  ticketTypes,
  presetCode,
  freeOffer,
}: {
  event: EventResponse;
  ticketTypes: TicketTypeResponse[];
  presetCode?: string;
  freeOffer?: ResolveRedemptionCodeResponse | null;
}) {
  const { data: session } = useSession();
  const { data: me } = useMe();
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckoutResult | null>(null);
  const [selfBuyer, setSelfBuyer] = useState(false);

  // "Soy yo" solo si la cuenta tiene la identidad completa del registro
  // (las altas con Google no la tienen, así que no hay nada que reutilizar).
  const canBeSelf = Boolean(me?.documentType && me?.documentNumber && me?.birthDate);

  const available = useMemo(
    () => ticketTypes.filter((tt) => tt.status === 'active' && tt.remaining > 0),
    [ticketTypes],
  );

  const freeTicket = freeOffer?.ticketType
    ? available.find((tt) => tt.id === freeOffer.ticketType!.id)
    : undefined;
  const isFreeFlow = Boolean(freeOffer?.valid && freeOffer?.isFree && freeTicket);

  const form = useForm<CheckoutFormInput, unknown, CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      ticketTypeId: freeTicket?.id ?? available[0]?.id ?? '',
      method: 'card',
      promoCode: presetCode ?? '',
      attendees: [emptyAttendee(true)],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'attendees' });

  const selectedId = form.watch('ticketTypeId');
  const selected = available.find((tt) => tt.id === selectedId);
  const maxQty = selected ? Math.min(selected.remaining, selected.maxPerUser ?? 10) : 10;
  const subtotal = selected ? selected.price * fields.length : 0;

  // Rellena el asistente comprador (índice 0) con los datos de la cuenta.
  const applySelf = useCallback(
    (checked: boolean) => {
      setSelfBuyer(checked);
      if (!checked || !me) return;
      form.setValue('attendees.0.fullName', me.fullName, { shouldValidate: true });
      if (me.documentType)
        form.setValue('attendees.0.documentType', me.documentType, { shouldValidate: true });
      if (me.documentNumber)
        form.setValue('attendees.0.documentNumber', me.documentNumber, { shouldValidate: true });
      if (me.birthDate)
        form.setValue('attendees.0.birthDate', me.birthDate, { shouldValidate: true });
    },
    [me, form],
  );

  function onSubmit(values: CheckoutFormValues) {
    setFormError(null);
    const token = session?.accessToken;
    if (!token) {
      setFormError(SESSION_EXPIRED);
      return;
    }
    const dto: CreateOrderDto = {
      eventId: event.id,
      items: [{ ticketTypeId: values.ticketTypeId, attendees: values.attendees }],
      method: values.method,
      promoCode: values.promoCode?.trim() ? values.promoCode.trim() : undefined,
    };
    startTransition(async () => {
      try {
        setResult(await checkout(dto, token));
      } catch (error) {
        setFormError(getErrorMessage(error));
      }
    });
  }

  if (result) return <CheckoutSuccess result={result} />;

  // El código de promotor llegó pero su entrada ya no está disponible.
  if (freeOffer?.valid && freeOffer.isFree && !freeTicket) {
    return (
      <Alert>
        <AlertDescription>
          La entrada gratis de este código ya no está disponible (agotada o pausada).
        </AlertDescription>
      </Alert>
    );
  }

  if (available.length === 0) {
    return (
      <Alert>
        <AlertDescription>No hay entradas disponibles para este evento.</AlertDescription>
      </Alert>
    );
  }

  // ── Modo entrada GRATIS ──────────────────────────────────────────────────
  if (isFreeFlow && freeTicket) {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
          {formError ? (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}

          <Card className="overflow-hidden border-primary/40">
            <div className="flex items-center gap-2 bg-primary/10 px-4 py-3">
              <Gift className="h-5 w-5 text-primary" weight="duotone" />
              <p className="text-sm font-medium">
                Tu promotor {freeOffer?.promoterName ?? 'UrNight'} te brinda una{' '}
                <span className="font-semibold text-primary">entrada GRATIS</span> al evento
              </p>
            </div>
            <div className="flex gap-4 p-4">
              {event.flyerUrl ? (
                <div className="relative hidden h-24 w-20 shrink-0 overflow-hidden rounded-md sm:block">
                  <StorageImage
                    src={event.flyerUrl}
                    alt={event.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
              ) : null}
              <div className="min-w-0 space-y-1">
                <h2 className="truncate font-heading text-lg font-bold">{event.name}</h2>
                <p className="text-sm text-muted-foreground">{formatDate(event.startsAt)}</p>
                <Badge variant="secondary">{freeTicket.name}</Badge>
                <p className="pt-1 text-sm">
                  Ahorras{' '}
                  <span className="font-semibold">
                    {formatPEN(freeOffer?.savings ?? freeTicket.price)}
                  </span>
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tus datos</CardTitle>
            </CardHeader>
            <CardContent>
              <AttendeeFieldset
                control={form.control}
                index={0}
                self={canBeSelf ? { checked: selfBuyer, onCheckedChange: applySelf } : undefined}
                locked={selfBuyer}
              />
            </CardContent>
          </Card>

          <div className="flex items-center justify-between text-base font-semibold">
            <span>Total</span>
            <span className="text-primary">GRATIS</span>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={pending}>
            {pending ? 'Emitiendo…' : 'Recibir entrada'}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Cortesía del promotor. No se realizará ningún cargo.
          </p>
        </form>
      </Form>
    );
  }

  // ── Modo estándar ────────────────────────────────────────────────────────
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
        {formError ? (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Entrada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="ticketTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de entrada</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {available.map((tt) => (
                        <SelectItem key={tt.id} value={tt.id}>
                          {tt.name} — {formatPEN(tt.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Cantidad</span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={fields.length <= 1}
                  onClick={() => remove(fields.length - 1)}
                  aria-label="Quitar entrada"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-medium">{fields.length}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={fields.length >= maxQty}
                  onClick={() => append(emptyAttendee())}
                  aria-label="Agregar entrada"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Asistentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {fields.map((fieldItem, index) => (
              <AttendeeFieldset
                key={fieldItem.id}
                control={form.control}
                index={index}
                onRemove={index > 0 ? () => remove(index) : undefined}
                self={
                  index === 0 && canBeSelf
                    ? { checked: selfBuyer, onCheckedChange: applySelf }
                    : undefined
                }
                locked={index === 0 && selfBuyer}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pago</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de pago</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="promoCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Código promocional <span className="text-muted-foreground">(opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="PROMO2026" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Separator />
            <div className="flex items-center justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatPEN(subtotal)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Pago de prueba (MVP). No se realizará ningún cargo real.
            </p>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" size="lg" disabled={pending}>
          {pending ? 'Procesando…' : `Pagar ${formatPEN(subtotal)}`}
        </Button>
      </form>
    </Form>
  );
}
