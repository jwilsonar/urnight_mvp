"use client";

import {
  ArrowLeft,
  CreditCard,
  MapPin,
  SpinnerGap,
  Storefront,
  Wallet,
  Warning,
} from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ORDERS_ERROR_CODES,
  type LocalOrderPaymentMethod,
  type LocalOrderResponse,
} from "@urnight/contracts";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Separator,
  cn,
} from "@urnight/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useCart } from "@/components/carta/cart-provider";
import { OrderStatusTimeline } from "@/components/carta/order-status-timeline";
import { BrandQr } from "@/components/shared/brand-qr";
import { Reveal } from "@/components/shared/reveal";
import { ApiError } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/api/error-messages";
import {
  createLocalOrder,
  getMyLocalOrder,
  payLocalOrder,
} from "@/lib/api/local-orders";
import { queryKeys } from "@/lib/api/query-keys";

interface OrderItemSnapshot {
  productId: string;
  name: string;
  quantity: number;
  unitAmount: number;
  lineAmount: number;
}

/** Revisión final, pago y seguimiento del pedido real del asistente. */
export function OrderFlow({
  localId,
  pickupZone,
  orderSchedule,
  ordersOpen,
  orderWindowsReady,
  onReset,
}: {
  localId: string;
  pickupZone: string;
  orderSchedule: string;
  ordersOpen: boolean;
  orderWindowsReady: boolean;
  onReset: () => void;
}) {
  const t = useTranslations("carta.order");
  const errorT = useTranslations("auth.errors");
  const format = useFormatter();
  const cart = useCart();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const { data: session, status: sessionStatus } = useSession();
  const [attendeeName, setAttendeeName] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<LocalOrderPaymentMethod>("card");
  const [order, setOrder] = useState<LocalOrderResponse | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItemSnapshot[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const attendeeNameInitialized = useRef(false);
  const walletDebitedOrderId = useRef<string | null>(null);
  const payableAmount = order?.totalAmount ?? cart.totalAmount;
  const walletAvailable = cart.walletBalance >= payableAmount;

  useEffect(() => {
    if (!attendeeNameInitialized.current && session?.user?.name) {
      setAttendeeName(session.user.name);
      attendeeNameInitialized.current = true;
    }
  }, [session?.user?.name]);

  useEffect(() => {
    if (paymentMethod === "wallet" && !walletAvailable) {
      setPaymentMethod("card");
    }
  }, [paymentMethod, walletAvailable]);

  const money = (value: number, currency = cart.currency) =>
    format.number(value, { style: "currency", currency });

  const translateOrderError = (error: unknown) =>
    getErrorMessage(error, (key) =>
      key === "orderWindowClosed"
        ? t("windowClosedWithSchedule", { schedule: orderSchedule })
        : errorT(key),
    );

  const snapshotFromOrder = (nextOrder: LocalOrderResponse) =>
    nextOrder.items.map((line) => ({
      productId: line.productId,
      name: cart.productFor(line.productId)?.name ?? t("unknownProduct"),
      quantity: line.quantity,
      unitAmount: line.unitAmount,
      lineAmount: line.lineAmount,
    }));

  const finishPaidOrder = (paidOrder: LocalOrderResponse) => {
    setOrder(paidOrder);
    if (
      paidOrder.paymentMethod === "wallet" &&
      walletDebitedOrderId.current !== paidOrder.id
    ) {
      cart.debitDemoWallet(paidOrder.totalAmount);
      walletDebitedOrderId.current = paidOrder.id;
    }
    cart.clear();
    window.scrollTo({ top: 0 });
  };

  const submit = async () => {
    setSubmitError(null);
    const token = session?.accessToken;
    if (!token) {
      setSubmitError(t("loginRequired"));
      return;
    }
    if (!order && (!orderWindowsReady || !ordersOpen)) {
      setSubmitError(t("windowClosedWithSchedule", { schedule: orderSchedule }));
      return;
    }
    if (!order && !attendeeName.trim()) {
      setSubmitError(t("nameRequired"));
      return;
    }

    setSubmitting(true);
    let attemptedOrder = order;
    try {
      if (!attemptedOrder) {
        attemptedOrder = await createLocalOrder(
          localId,
          {
            attendeeName: attendeeName.trim(),
            pickupZone,
            paymentMethod,
            items: cart.lines.map((line) => ({
              productId: line.itemId,
              quantity: line.quantity,
            })),
          },
          token,
        );
        setOrderItems(snapshotFromOrder(attemptedOrder));
        setOrder(attemptedOrder);
      }

      const paidOrder = await payLocalOrder(
        attemptedOrder.id,
        { method: paymentMethod },
        token,
      );
      finishPaidOrder(paidOrder);
    } catch (error) {
      if (
        attemptedOrder &&
        error instanceof ApiError &&
        error.code === ORDERS_ERROR_CODES.ORDER_ALREADY_PAID
      ) {
        try {
          const current = await getMyLocalOrder(attemptedOrder.id, token);
          if (current.paymentStatus === "paid") {
            finishPaidOrder(current);
            return;
          }
        } catch (refreshError) {
          setSubmitError(translateOrderError(refreshError));
          return;
        }
      }
      if (
        error instanceof ApiError &&
        error.code === ORDERS_ERROR_CODES.PRODUCT_UNAVAILABLE
      ) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.menuProducts(localId),
        });
      }
      setSubmitError(translateOrderError(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (order) {
    return (
      <ConfirmedOrder
        order={order}
        orderItems={orderItems}
        token={session?.accessToken}
        submitting={submitting}
        submitError={submitError}
        money={money}
        onRetryPayment={() => void submit()}
        onOrderChange={(nextOrder) => {
          setOrder(nextOrder);
          if (nextOrder.paymentStatus === "paid") finishPaidOrder(nextOrder);
        }}
        onReset={onReset}
      />
    );
  }

  const loginHref = `/login?callbackUrl=${encodeURIComponent(pathname)}`;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Reveal>
        <Card>
          <CardContent className="space-y-6 p-6">
            <div>
              <p className="rv-eyebrow mb-2">{t("eyebrow")}</p>
              <h2 className="font-heading text-2xl font-extrabold">
                {t("summary")}
              </h2>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-4 shrink-0" weight="duotone" />
                {t("pickup", { zone: pickupZone })}
              </p>
            </div>

            <OrderItems items={cart.lines.map((line) => {
              const product = cart.productFor(line.itemId);
              return {
                productId: line.itemId,
                name: product?.name ?? t("unknownProduct"),
                quantity: line.quantity,
                unitAmount: product?.priceAmount ?? 0,
                lineAmount: (product?.priceAmount ?? 0) * line.quantity,
              };
            })} money={money} />

            <Separator />
            <div className="flex items-center justify-between gap-4">
              <span className="font-heading font-bold">{t("orderTotal")}</span>
              <span className="font-heading text-xl font-extrabold tabular-nums">
                {money(cart.totalAmount)}
              </span>
            </div>

            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                void submit();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="attendee-name">{t("attendeeName")}</Label>
                <Input
                  id="attendee-name"
                  name="attendeeName"
                  autoComplete="name"
                  value={attendeeName}
                  onChange={(event) => setAttendeeName(event.target.value)}
                  placeholder={t("attendeeNamePlaceholder")}
                  required
                  maxLength={120}
                />
              </div>

              <PaymentMethods
                value={paymentMethod}
                onChange={setPaymentMethod}
                walletAvailable={walletAvailable}
                walletBalance={cart.walletBalance}
                money={money}
              />

              {!orderWindowsReady || !ordersOpen ? (
                <div
                  className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm"
                  role="status"
                >
                  <Warning className="mt-0.5 size-4 shrink-0 text-warning" weight="duotone" />
                  <p>{t("windowClosedWithSchedule", { schedule: orderSchedule })}</p>
                </div>
              ) : null}

              {submitError ? (
                <div
                  className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
                  role="alert"
                >
                  <p>{submitError}</p>
                  {!session?.accessToken ? (
                    <Button variant="ghost" size="sm" className="mt-2" asChild>
                      <Link href={loginHref}>{t("loginAction")}</Link>
                    </Button>
                  ) : null}
                </div>
              ) : null}

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={
                  submitting ||
                  sessionStatus === "loading" ||
                  !orderWindowsReady ||
                  !ordersOpen
                }
              >
                {submitting ? (
                  <SpinnerGap
                    className="size-4 animate-spin motion-reduce:animate-none"
                    weight="bold"
                  />
                ) : null}
                {submitting ? t("submitting") : t("confirm")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Reveal>

      <Button variant="ghost" className="w-full" onClick={onReset}>
        <ArrowLeft className="size-4" /> {t("backToMenu")}
      </Button>
    </div>
  );
}

function PaymentMethods({
  value,
  onChange,
  walletAvailable,
  walletBalance,
  money,
}: {
  value: LocalOrderPaymentMethod;
  onChange: (method: LocalOrderPaymentMethod) => void;
  walletAvailable: boolean;
  walletBalance: number;
  money: (value: number) => string;
}) {
  const t = useTranslations("carta.order.payment");
  const methods: Array<{
    value: LocalOrderPaymentMethod;
    icon: typeof Wallet;
    label: string;
    description: string;
  }> = [
    ...(walletAvailable
      ? [
          {
            value: "wallet" as const,
            icon: Wallet,
            label: t("wallet.label"),
            description: t("wallet.description", {
              balance: money(walletBalance),
            }),
          },
        ]
      : []),
    {
      value: "card",
      icon: CreditCard,
      label: t("card.label"),
      description: t("card.description"),
    },
    {
      value: "cash_register",
      icon: Storefront,
      label: t("cashRegister.label"),
      description: t("cashRegister.description"),
    },
  ];

  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-sm font-semibold">{t("legend")}</legend>
      {methods.map((method) => {
        const Icon = method.icon;
        const selected = value === method.value;
        return (
          <label
            key={method.value}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors motion-reduce:transition-none",
              selected
                ? "border-accent-border bg-accent"
                : "border-border bg-surface hover:border-strong",
            )}
          >
            <input
              type="radio"
              name="paymentMethod"
              value={method.value}
              checked={selected}
              onChange={() => onChange(method.value)}
              className="sr-only"
            />
            <Icon
              aria-hidden="true"
              className={cn(
                "mt-0.5 size-5 shrink-0",
                selected ? "text-rose" : "text-muted-foreground",
              )}
              weight="duotone"
            />
            <span>
              <span className="block text-sm font-semibold">{method.label}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {method.description}
              </span>
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}

function OrderItems({
  items,
  money,
  currency,
}: {
  items: readonly OrderItemSnapshot[];
  money: (value: number, currency?: string) => string;
  currency?: string;
}) {
  const t = useTranslations("carta.order");

  return (
    <ul className="space-y-3" aria-label={t("itemsAria")}>
      {items.map((item) => (
        <li key={item.productId} className="flex items-start justify-between gap-4 text-sm">
          <div className="min-w-0">
            <p className="font-semibold">{item.name}</p>
            <p className="text-xs text-muted-foreground">
              {t("itemQuantity", {
                quantity: item.quantity,
                amount: money(item.unitAmount, currency),
              })}
            </p>
          </div>
          <span className="shrink-0 font-semibold tabular-nums">
            {money(item.lineAmount, currency)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ConfirmedOrder({
  order,
  orderItems,
  token,
  submitting,
  submitError,
  money,
  onRetryPayment,
  onOrderChange,
  onReset,
}: {
  order: LocalOrderResponse;
  orderItems: readonly OrderItemSnapshot[];
  token?: string;
  submitting: boolean;
  submitError: string | null;
  money: (value: number, currency?: string) => string;
  onRetryPayment: () => void;
  onOrderChange: (order: LocalOrderResponse) => void;
  onReset: () => void;
}) {
  const t = useTranslations("carta.order");

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Reveal>
        <Card className="overflow-hidden text-center">
          <div className="rv-hero-glow border-b bg-surface px-4 py-8 sm:px-6">
            <p className="rv-eyebrow mb-3">{t("pickupCode")}</p>
            <p className="break-all font-display text-6xl font-extrabold tracking-[0.16em] text-rose sm:text-7xl">
              {order.pickupCode}
            </p>
            <div className="mt-6 flex justify-center">
              <BrandQr
                value={order.pickupCode}
                alt={t("pickupQrAlt", { code: order.pickupCode })}
                size={184}
              />
            </div>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-4 shrink-0" weight="duotone" />
              {order.pickupZone}
            </p>
          </div>
          <CardContent className="space-y-5 p-6 text-left">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold">{t("paymentStatus")}</span>
              <Badge variant={order.paymentStatus === "paid" ? "success" : "warning"}>
                {t(`paymentState.${order.paymentStatus}`)}
              </Badge>
            </div>

            {orderItems.length ? (
              <>
                <OrderItems items={orderItems} money={money} currency={order.currency} />
                <Separator />
                <div className="flex items-center justify-between gap-4">
                  <span className="font-heading font-bold">{t("orderTotal")}</span>
                  <span className="font-heading text-lg font-extrabold tabular-nums">
                    {money(order.totalAmount, order.currency)}
                  </span>
                </div>
              </>
            ) : null}

            {submitError ? (
              <div
                className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
                role="alert"
              >
                <p>{submitError}</p>
                {order.paymentStatus !== "paid" ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    disabled={submitting}
                    onClick={onRetryPayment}
                  >
                    {submitting ? (
                      <SpinnerGap
                        className="size-4 animate-spin motion-reduce:animate-none"
                        weight="bold"
                      />
                    ) : null}
                    {t("retryPayment")}
                  </Button>
                ) : null}
              </div>
            ) : null}

            {token ? (
              <OrderStatusTimeline
                orderId={order.id}
                token={token}
                initialOrder={order}
                onOrderChange={onOrderChange}
              />
            ) : (
              <p className="text-sm text-destructive" role="alert">
                {t("statusSessionRequired")}
              </p>
            )}
          </CardContent>
        </Card>
      </Reveal>

      {order.paymentStatus === "paid" ? (
        <Reveal delay={80}>
          <Button variant="secondary" className="w-full" onClick={onReset}>
            <ArrowLeft className="size-4" /> {t("orderMore")}
          </Button>
        </Reveal>
      ) : null}
    </div>
  );
}
