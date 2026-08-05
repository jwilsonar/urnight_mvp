import { Bell } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import type { NotificationResponse } from "@urnight/contracts";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@urnight/ui";
import { PreferencesForm } from "@/components/account/preferences-form";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { getMyNotifications } from "@/lib/api/ops";
import { requireAccessToken } from "@/lib/auth-helpers";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("notificaciones");
  return { title: t("title") };
}

const STATUS_VARIANT: Record<
  NotificationResponse["status"],
  "default" | "secondary" | "destructive"
> = {
  queued: "secondary",
  sent: "default",
  failed: "destructive",
};

/** Actividad y personalización de notificaciones del usuario. */
export default async function NotificationsPage() {
  const [t, format] = await Promise.all([
    getTranslations("notificaciones"),
    getFormatter(),
  ]);
  const { token } = await requireAccessToken("/account/notificaciones");

  let notifications: NotificationResponse[] | null = null;
  try {
    notifications = await getMyNotifications(token);
  } catch {
    // La personalización sigue disponible aunque falle el historial.
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("customize.title")}</CardTitle>
          <CardDescription>{t("customize.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <PreferencesForm />
        </CardContent>
      </Card>

      <section
        className="space-y-3"
        aria-labelledby="notification-history-title"
      >
        <h2
          id="notification-history-title"
          className="font-heading text-lg font-bold"
        >
          {t("recent")}
        </h2>
        {notifications === null ? (
          <ErrorState
            title={t("loadError")}
            description={t("errorDescription")}
          />
        ) : notifications.length === 0 ? (
          <EmptyState
            compact
            icon={<Bell className="h-10 w-10" weight="duotone" />}
            title={t("empty")}
            description={t("emptyDescription")}
          />
        ) : (
          notifications.map((notification) => (
            <Card key={notification.id}>
              <CardContent className="flex items-start justify-between gap-4 py-4">
                <div className="min-w-0 space-y-1">
                  <p className="truncate font-medium">
                    {notification.subject ?? notification.type}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {notification.channel === "email"
                      ? t("channel.email")
                      : t("channel.push")}{" "}
                    ·{" "}
                    {format.dateTime(new Date(notification.createdAt), {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[notification.status]}>
                  {t(`status.${notification.status}`)}
                </Badge>
              </CardContent>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
