"use client";

import {
  ArrowClockwise,
  Clock,
  Wallet,
  Warning,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, Skeleton } from "@urnight/ui";
import { useState } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { CartProvider, useCart } from "@/components/carta/cart-provider";
import { CartaBrowser } from "@/components/carta/carta-browser";
import { CartFab } from "@/components/carta/cart-fab";
import { OrderFlow } from "@/components/carta/order-flow";
import { EmptyState } from "@/components/shared/empty-state";
import { getErrorMessage } from "@/lib/api/error-messages";
import {
  getLocalOrderWindows,
  getMenuCategories,
  getMenuProducts,
} from "@/lib/api/menu";
import { queryKeys } from "@/lib/api/query-keys";
import {
  formatLocalOrderWindows,
  isWithinLocalOrderWindow,
} from "@/lib/utils/order-windows";

/** Orquesta catálogo público, carrito y pedido autenticado dentro del local. */
export function CartaExperience({
  localId,
  localSlug,
  pickupZone,
}: {
  localId: string;
  localSlug: string;
  pickupZone: string;
}) {
  const t = useTranslations("carta.load");
  const errorT = useTranslations("auth.errors");
  const categoriesQuery = useQuery({
    queryKey: queryKeys.menuCategories(localId),
    queryFn: ({ signal }) => getMenuCategories(localId, signal),
    staleTime: 30_000,
  });
  const productsQuery = useQuery({
    queryKey: queryKeys.menuProducts(localId),
    queryFn: ({ signal }) => getMenuProducts(localId, signal),
    staleTime: 30_000,
  });
  const windowsQuery = useQuery({
    queryKey: queryKeys.localOrderWindows(localId),
    queryFn: ({ signal }) => getLocalOrderWindows(localId, signal),
    staleTime: 30_000,
  });

  if (productsQuery.isPending) {
    return <CatalogSkeleton label={t("productsLoading")} />;
  }

  if (productsQuery.isError) {
    return (
      <EmptyState
        icon={<Warning weight="duotone" />}
        title={t("productsErrorTitle")}
        description={getErrorMessage(productsQuery.error, (key) => errorT(key))}
        action={
          <Button type="button" onClick={() => void productsQuery.refetch()}>
            <ArrowClockwise className="size-4" /> {t("retry")}
          </Button>
        }
      />
    );
  }

  return (
    <CartProvider localSlug={localSlug} products={productsQuery.data}>
      <CartaFlow
        localId={localId}
        pickupZone={pickupZone}
        categories={categoriesQuery.data ?? []}
        categoriesPending={categoriesQuery.isPending}
        categoriesError={categoriesQuery.error}
        retryCategories={() => void categoriesQuery.refetch()}
        windows={windowsQuery.data ?? []}
        windowsPending={windowsQuery.isPending}
        windowsError={windowsQuery.error}
        retryWindows={() => void windowsQuery.refetch()}
        products={productsQuery.data}
      />
    </CartProvider>
  );
}

function CartaFlow({
  localId,
  pickupZone,
  categories,
  categoriesPending,
  categoriesError,
  retryCategories,
  windows,
  windowsPending,
  windowsError,
  retryWindows,
  products,
}: {
  localId: string;
  pickupZone: string;
  categories: Parameters<typeof CartaBrowser>[0]["categories"];
  categoriesPending: boolean;
  categoriesError: unknown;
  retryCategories: () => void;
  windows: Parameters<typeof formatLocalOrderWindows>[0];
  windowsPending: boolean;
  windowsError: unknown;
  retryWindows: () => void;
  products: Parameters<typeof CartaBrowser>[0]["products"];
}) {
  const t = useTranslations("carta");
  const errorT = useTranslations("auth.errors");
  const locale = useLocale();
  const format = useFormatter();
  const cart = useCart();
  const [reviewingOrder, setReviewingOrder] = useState(false);
  const activeCategories = [...categories]
    .filter((category) => category.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);
  const schedule = windows.length
    ? formatLocalOrderWindows(windows, locale)
    : t("page.noOrderHours");
  const ordersOpen = !windowsPending && !windowsError && isWithinLocalOrderWindow(windows);

  if (reviewingOrder) {
    return (
      <OrderFlow
        localId={localId}
        pickupZone={pickupZone}
        orderSchedule={schedule}
        ordersOpen={ordersOpen}
        orderWindowsReady={!windowsPending && !windowsError}
        onReset={() => {
          setReviewingOrder(false);
          window.scrollTo({ top: 0 });
        }}
      />
    );
  }

  return (
    <>
      {cart.walletBalance > 0 ? (
        <Card className="mb-5 flex items-start gap-3 border-success-border bg-success-soft p-4">
          <Wallet
            className="mt-0.5 size-5 shrink-0 text-success"
            weight="duotone"
          />
          <div>
            <p className="text-sm font-semibold text-success">
              {t("wallet.available", {
                amount: format.number(cart.walletBalance, {
                  style: "currency",
                  currency: cart.currency,
                }),
              })}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("wallet.note")}
            </p>
          </div>
        </Card>
      ) : null}

      <OrderWindowNotice
        pending={windowsPending}
        error={windowsError}
        schedule={schedule}
        open={ordersOpen}
        onRetry={retryWindows}
      />

      {categoriesPending ? (
        <div
          className="mb-5 flex gap-2 overflow-hidden"
          role="status"
          aria-label={t("load.categoriesLoading")}
        >
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-8 w-24 shrink-0 rounded-full motion-reduce:animate-none"
            />
          ))}
        </div>
      ) : null}

      {categoriesError ? (
        <div
          className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          <span>{getErrorMessage(categoriesError, (key) => errorT(key))}</span>
          <Button type="button" variant="ghost" size="sm" onClick={retryCategories}>
            <ArrowClockwise className="size-4" /> {t("load.retry")}
          </Button>
        </div>
      ) : null}

      <CartaBrowser
        localId={localId}
        categories={activeCategories}
        products={products}
      />
      <CartFab
        pickupZone={pickupZone}
        onConfirm={() => {
          setReviewingOrder(true);
          window.scrollTo({ top: 0 });
        }}
      />
    </>
  );
}

function OrderWindowNotice({
  pending,
  error,
  schedule,
  open,
  onRetry,
}: {
  pending: boolean;
  error: unknown;
  schedule: string;
  open: boolean;
  onRetry: () => void;
}) {
  const t = useTranslations("carta.page");
  const loadT = useTranslations("carta.load");
  const errorT = useTranslations("auth.errors");

  if (pending) {
    return (
      <Card
        className="mb-5 space-y-2 p-4"
        role="status"
        aria-label={loadT("windowsLoading")}
      >
        <Skeleton className="h-4 w-36 motion-reduce:animate-none" />
        <Skeleton className="h-4 w-full motion-reduce:animate-none" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-5 border-destructive/40 bg-destructive/10 p-4" role="alert">
        <div className="flex items-start gap-3">
          <Warning className="mt-0.5 size-5 shrink-0 text-destructive" weight="duotone" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-destructive">
              {getErrorMessage(error, (key) => errorT(key))}
            </p>
            <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={onRetry}>
              <ArrowClockwise className="size-4" /> {loadT("retry")}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mb-5 flex items-start gap-3 p-4">
      <Clock
        className={open ? "mt-0.5 size-5 shrink-0 text-success" : "mt-0.5 size-5 shrink-0 text-warning"}
        weight="duotone"
      />
      <div>
        <p className="text-sm font-semibold">
          {open ? t("ordersOpen") : t("ordersClosed")}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("hours", { schedule })}
        </p>
      </div>
    </Card>
  );
}

function CatalogSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-5" aria-busy="true" aria-label={label}>
      <Skeleton className="h-10 w-full motion-reduce:animate-none" />
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton
            key={index}
            className="h-8 w-24 shrink-0 rounded-full motion-reduce:animate-none"
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton
            key={index}
            className="aspect-[3/4] motion-reduce:animate-none"
          />
        ))}
      </div>
    </div>
  );
}
