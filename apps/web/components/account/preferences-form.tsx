"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import {
  Button,
  Checkbox,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@urnight/ui";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { updatePreferences } from "@/lib/api/identity";
import { queryKeys } from "@/lib/api/query-keys";
import { useApiMutation } from "@/lib/api/use-api-mutation";

const STORAGE_KEY = "ravenue:notification-preferences";

type NotificationType = "reminders" | "eventUpdates" | "promotions" | "social";

interface NotificationSettings {
  channel: "email" | "push";
  scope: "all" | "favorites";
  types: Record<NotificationType, boolean>;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  channel: "push",
  scope: "favorites",
  types: {
    reminders: true,
    eventUpdates: true,
    promotions: false,
    social: true,
  },
};

export function PreferencesForm() {
  const t = useTranslations("account.preferences");
  const { data: session } = useSession();
  const token = session?.accessToken ?? "";
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as Partial<NotificationSettings>;
      setSettings({
        channel: parsed.channel === "email" ? "email" : "push",
        scope: parsed.scope === "all" ? "all" : "favorites",
        types: { ...DEFAULT_SETTINGS.types, ...parsed.types },
      });
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const mutation = useApiMutation({
    mutationFn: () =>
      updatePreferences(
        {
          acceptsMarketing: settings.types.promotions,
          acceptsReminders: settings.types.reminders,
        },
        token,
      ),
    successMessage: t("success"),
    invalidateKeys: [queryKeys.me],
  });

  function save() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    mutation.mutate(undefined);
  }

  function setType(key: NotificationType, checked: boolean) {
    setSettings((current) => ({
      ...current,
      types: { ...current.types, [key]: checked },
    }));
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <LocaleSwitcher id="account-language" showLabel />
        <div className="space-y-2">
          <Label htmlFor="notification-channel">{t("channel.label")}</Label>
          <Select
            value={settings.channel}
            onValueChange={(value) =>
              setSettings((current) => ({
                ...current,
                channel: value as NotificationSettings["channel"],
              }))
            }
          >
            <SelectTrigger id="notification-channel">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">{t("channel.email")}</SelectItem>
              <SelectItem value="push">{t("channel.push")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="notification-scope">{t("scope.label")}</Label>
          <Select
            value={settings.scope}
            onValueChange={(value) =>
              setSettings((current) => ({
                ...current,
                scope: value as NotificationSettings["scope"],
              }))
            }
          >
            <SelectTrigger id="notification-scope">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("scope.all")}</SelectItem>
              <SelectItem value="favorites">{t("scope.favorites")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-foreground">
          {t("types.label")}
        </legend>
        {(["reminders", "eventUpdates", "promotions", "social"] as const).map(
          (key) => (
            <label
              key={key}
              htmlFor={`notification-${key}`}
              className="flex cursor-pointer items-start gap-3 rounded-md border bg-white/[0.02] p-3.5"
            >
              <Checkbox
                id={`notification-${key}`}
                checked={settings.types[key]}
                onCheckedChange={(checked) => setType(key, checked === true)}
              />
              <span className="space-y-1 leading-snug">
                <span className="block text-sm font-medium text-foreground">
                  {t(`types.${key}.label`)}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {t(`types.${key}.description`)}
                </span>
              </span>
            </label>
          ),
        )}
      </fieldset>

      <Button
        type="button"
        onClick={save}
        disabled={!token || mutation.isPending}
      >
        {mutation.isPending ? t("saving") : t("save")}
      </Button>
    </div>
  );
}
