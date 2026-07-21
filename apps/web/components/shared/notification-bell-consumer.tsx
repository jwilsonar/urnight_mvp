"use client";

import {
  Bell,
  BellSlash,
  DeviceMobile,
  EnvelopeSimple,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useFormatter, useTranslations } from "next-intl";
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Skeleton,
} from "@urnight/ui";
import type { NotificationResponse } from "@urnight/contracts";
import { getMyNotifications } from "@/lib/api/ops";
import { queryKeys } from "@/lib/api/query-keys";

const STATUS_VARIANT: Record<
  NotificationResponse["status"],
  "secondary" | "success" | "destructive"
> = {
  queued: "secondary",
  sent: "success",
  failed: "destructive",
};

export function NotificationBellConsumer() {
  const t = useTranslations("notificaciones");
  const format = useFormatter();
  const { data: session, status } = useSession();
  const token = session?.accessToken;
  const query = useQuery({
    queryKey: queryKeys.notificationsMe,
    queryFn: () => getMyNotifications(token),
    enabled: status === "authenticated" && Boolean(token),
  });

  if (status === "loading")
    return <Skeleton className="size-11 rounded-full" />;
  if (!session?.user) return null;

  const notifications = query.data ?? [];
  const unread = notifications.filter(
    (notification) => notification.status === "queued",
  ).length;
  const recent = notifications.slice(0, 5);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full"
          aria-label={t("title")}
        >
          <Bell className="size-5" />
          {unread > 0 ? (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>{t("title")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {query.isPending ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            {t("loading")}
          </p>
        ) : query.isError ? (
          <div className="space-y-3 px-3 py-5 text-center">
            <p className="text-sm text-muted-foreground">{t("loadError")}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void query.refetch()}
            >
              {t("retry")}
            </Button>
          </div>
        ) : recent.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-3 py-6 text-center text-muted-foreground">
            <BellSlash className="size-7" weight="duotone" />
            <p className="text-sm">{t("empty")}</p>
          </div>
        ) : (
          <ul className="max-h-72 overflow-y-auto">
            {recent.map((notification) => {
              const Icon =
                notification.channel === "push" ? DeviceMobile : EnvelopeSimple;
              return (
                <li
                  key={notification.id}
                  className="flex items-start gap-3 px-2 py-2.5"
                >
                  <Icon
                    className="mt-0.5 size-4 shrink-0 text-rose"
                    weight="duotone"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate text-sm font-medium">
                      {notification.subject ?? notification.type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format.dateTime(new Date(notification.createdAt), {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <Badge
                    variant={STATUS_VARIANT[notification.status]}
                    className="shrink-0"
                  >
                    {notification.status === "queued"
                      ? t("status.queued")
                      : notification.status === "sent"
                        ? t("status.sent")
                        : t("status.failed")}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
        <DropdownMenuSeparator />
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center"
          asChild
        >
          <Link href="/account/notificaciones">{t("viewAll")}</Link>
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
