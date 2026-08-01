"use client";

import { Gift, Minus, Plus } from "@phosphor-icons/react";
import type {
  EventResponse,
  ResolveRedemptionCodeResponse,
  TicketTypeResponse,
} from "@urnight/contracts";
import { useFormatter, useTranslations } from "next-intl";
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
} from "@urnight/ui";
import { StorageImage } from "@/lib/storage/storage-context";
import { AttendeeFieldset } from "./attendee-fieldset";
import { emptyAttendee, PAYMENT_METHODS } from "./checkout-form";
import { CheckoutSuccess } from "./checkout-success";
import { useCheckoutForm } from "./use-checkout-form";

/**
 * Orquestador VISUAL del checkout (la lógica vive en `useCheckoutForm`).
 * Soporta dos modos:
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
  const t = useTranslations("checkout");
  const format = useFormatter();
  const money = (value: number) =>
    format.number(value, { style: "currency", currency: "PEN" });
  const {
    form,
    fields,
    append,
    remove,
    available,
    freeTicket,
    isFreeFlow,
    maxQty,
    subtotal,
    canBeSelf,
    selfBuyer,
    applySelf,
    pending,
    holdPending,
    formError,
    result,
    onSubmit,
  } = useCheckoutForm({ event, ticketTypes, presetCode, freeOffer });

  if (result) return <CheckoutSuccess result={result} />;

  // El código de promotor llegó pero su entrada ya no está disponible.
  if (freeOffer?.valid && freeOffer.isFree && !freeTicket) {
    return (
      <Alert>
        <AlertDescription>{t("freeUnavailable")}</AlertDescription>
      </Alert>
    );
  }

  if (available.length === 0) {
    return (
      <Alert>
        <AlertDescription>{t("noTickets")}</AlertDescription>
      </Alert>
    );
  }

  // ── Modo entrada GRATIS ──────────────────────────────────────────────────
  if (isFreeFlow && freeTicket) {
    return (
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
          noValidate
        >
          {formError ? (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}

          <Card className="overflow-hidden border-accent-border">
            <div className="flex items-center gap-2 bg-primary/10 px-4 py-3">
              <Gift className="h-5 w-5 text-primary" weight="duotone" />
              <p className="text-sm font-medium">
                {t.rich("freeOffer", {
                  promoter: freeOffer?.promoterName ?? "RAVENUE",
                  strong: (chunks: React.ReactNode) => (
                    <span className="font-semibold text-rose">{chunks}</span>
                  ),
                })}
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
                <h2 className="truncate font-heading text-lg font-bold">
                  {event.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {format.dateTime(new Date(event.startsAt), {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
                <Badge variant="secondary">{freeTicket.name}</Badge>
                <p className="pt-1 text-sm">
                  {t.rich("savings", {
                    amount: money(freeOffer?.savings ?? freeTicket.price),
                    strong: (chunks: React.ReactNode) => (
                      <span className="font-semibold">{chunks}</span>
                    ),
                  })}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("yourDetails")}</CardTitle>
            </CardHeader>
            <CardContent>
              <AttendeeFieldset
                control={form.control}
                index={0}
                self={
                  canBeSelf
                    ? { checked: selfBuyer, onCheckedChange: applySelf }
                    : undefined
                }
                locked={selfBuyer}
              />
            </CardContent>
          </Card>

          <div className="flex items-center justify-between text-base font-semibold">
            <span>{t("total")}</span>
            <span className="text-rose">{t("free")}</span>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={pending || holdPending}
          >
            {pending ? t("issuing") : t("receiveTicket")}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            {t("courtesyNote")}
          </p>
        </form>
      </Form>
    );
  }

  // ── Modo estándar ────────────────────────────────────────────────────────
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
        noValidate
      >
        {formError ? (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("ticket")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="ticketTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("ticketType")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("select")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {available.map((tt) => (
                        <SelectItem key={tt.id} value={tt.id}>
                          {tt.name} — {money(tt.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t("quantity")}</span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={fields.length <= 1}
                  onClick={() => remove(fields.length - 1)}
                  aria-label={t("removeTicket")}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-medium">
                  {fields.length}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={fields.length >= maxQty}
                  // shouldFocus:false — por defecto append() enfoca el primer
                  // campo del asistente nuevo y el navegador baja el scroll
                  // hasta él. Piero quiere quedarse arriba (en el contador) y
                  // bajar a llenar datos cuando quiera.
                  onClick={() =>
                    append(emptyAttendee(), { shouldFocus: false })
                  }
                  aria-label={t("addTicket")}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("attendees")}</CardTitle>
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
            <CardTitle className="text-lg">{t("payment")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("paymentMethod")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {t(`paymentMethods.${method.value}`)}
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
                    {t("promoCode")}{" "}
                    <span className="text-muted-foreground">
                      {t("optional")}
                    </span>
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
              <span>{t("total")}</span>
              <span>{money(subtotal)}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t("testPayment")}</p>
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={pending || holdPending}
        >
          {pending ? t("processing") : t("pay", { amount: money(subtotal) })}
        </Button>
      </form>
    </Form>
  );
}
